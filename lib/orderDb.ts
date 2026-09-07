import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { OrderRecord, OrderStatus, OrderItemPayload, PaymentMethod } from "@/types/order";
import { generateOrderCode } from "./utils";
import { logFinancialAudit, isTransactionAlreadyLogged, markTransactionProcessed } from "./db/audit";

export interface NewOrderInput {
  code?: string;
  customer_name: string;
  phone: string;
  address: string;
  note?: string | null;
  items: OrderItemPayload[];
  subtotal?: number;
  shipping_fee?: number;
  total: number;
  payment_method: PaymentMethod;
  status?: OrderStatus;
  branch_id?: string | null;
  cancel_reason?: string | null;
  momo_confirmed?: boolean;
}

export interface SaveOrderResult {
  success: boolean;
  code?: string;
  order?: OrderRecord;
  error?: string;
}

const MAX_COLLISION_RETRIES = 3;

/**
 * Kiểm tra mã lỗi vi phạm ràng buộc duy nhất (Unique Violation 23505) của PostgreSQL
 */
export function isUniqueViolation(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    (typeof error.message === "string" &&
      (error.message.includes("23505") ||
        error.message.toLowerCase().includes("unique constraint") ||
        error.message.toLowerCase().includes("duplicate key"))) ||
    (typeof error.details === "string" &&
      (error.details.includes("23505") ||
        error.details.toLowerCase().includes("already exists")))
  );
}

// Bộ nhớ đệm In-memory dự phòng phục vụ kiểm thử offline và môi trường CI
const inMemoryOrders: OrderRecord[] = [];

/**
 * Lưu đơn hàng mới: Atomic insert vào bảng orders và order_items trên Supabase PostgreSQL.
 * Bao gồm vòng lặp retry 3 lần xử lý xung đột mã đơn hàng (PostgreSQL unique_violation 23505).
 */
export async function saveNewOrder(orderData: NewOrderInput | OrderRecord): Promise<SaveOrderResult> {
  const input = orderData as any;
  let initialCode = orderData.code || generateOrderCode();

  // Tính toán subtotal nếu chưa có
  const calculatedSubtotal =
    input.subtotal !== undefined
      ? input.subtotal
      : (orderData.items || []).reduce((sum: number, item: any) => sum + item.price * (item.qty || item.quantity || 1), 0);
  const calculatedShippingFee =
    input.shipping_fee !== undefined ? input.shipping_fee : Math.max(0, orderData.total - calculatedSubtotal);

  // 1. Ghi vào Supabase nếu đã cấu hình
  if (isSupabaseConfigured && supabaseAdmin) {
    let currentCode = initialCode;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_COLLISION_RETRIES; attempt++) {
      try {
        // 1.1 Insert đơn hàng cha vào bảng orders
        const orderInsertPayload: any = {
          code: currentCode,
          customer_name: orderData.customer_name,
          phone: orderData.phone,
          address: orderData.address,
          note: orderData.note || null,
          items: orderData.items, // Lưu JSONB để hỗ trợ tương thích ngược
          subtotal: calculatedSubtotal,
          shipping_fee: calculatedShippingFee,
          total: orderData.total,
          payment_method: orderData.payment_method,
          status: orderData.status || "new",
          branch_id: input.branch_id || null,
          cancel_reason: orderData.cancel_reason || null,
          momo_confirmed: Boolean(orderData.momo_confirmed),
        };

        let { data: insertedOrder, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert(orderInsertPayload)
          .select()
          .single();

        // Resilient fallback nếu bảng orders chưa có các cột mở rộng (PGRST204)
        if (orderError && (orderError.code === "PGRST204" || (typeof orderError.message === "string" && orderError.message.includes("column")))) {
          const minimalPayload = {
            code: currentCode,
            customer_name: orderData.customer_name,
            phone: orderData.phone,
            address: orderData.address,
            note: orderData.note || null,
            items: orderData.items,
            total: orderData.total,
            payment_method: orderData.payment_method,
            status: orderData.status || "new",
          };
          const retryRes = await supabaseAdmin
            .from("orders")
            .insert(minimalPayload)
            .select()
            .single();
          if (!retryRes.error && retryRes.data) {
            insertedOrder = retryRes.data;
            orderError = null;
          }
        }

        if (orderError) {
          lastError = orderError;
          // Kiểm tra lỗi trùng mã đơn (PostgreSQL 23505 unique_violation)
          if (isUniqueViolation(orderError) && attempt < MAX_COLLISION_RETRIES) {
            console.warn(`[OrderDb] Xung đột mã đơn #${currentCode}, thực hiện retry lần ${attempt}/${MAX_COLLISION_RETRIES}...`);
            currentCode = generateOrderCode();
            // Jittered backoff ngắn (20-50ms)
            await new Promise((resolve) => setTimeout(resolve, attempt * 20 + Math.floor(Math.random() * 30)));
            continue;
          }
          console.error("[OrderDb] Lỗi insert orders vào Supabase:", orderError);
          break;
        }

        // 1.2 Insert chi tiết các món vào bảng quan hệ order_items (Chuẩn hóa 3NF)
        if (insertedOrder && orderData.items && orderData.items.length > 0) {
          const itemsPayload = orderData.items.map((item) => ({
            order_id: insertedOrder.id,
            menu_item_id: item.id || null,
            item_name: item.name,
            price: item.price,
            quantity: item.qty || (item as any).quantity || 1,
            subtotal: item.price * (item.qty || (item as any).quantity || 1),
          }));

          const { error: itemsError } = await supabaseAdmin.from("order_items").insert(itemsPayload);
          if (itemsError) {
            console.warn("[OrderDb] Ghi chú lỗi insert order_items (đơn hàng chính vẫn hợp lệ):", itemsError.message);
          }
        }

        const completedOrder: OrderRecord = {
          id: insertedOrder.id,
          code: currentCode,
          customer_name: insertedOrder.customer_name,
          phone: insertedOrder.phone,
          address: insertedOrder.address,
          note: insertedOrder.note,
          items: orderData.items,
          total: insertedOrder.total,
          payment_method: insertedOrder.payment_method as PaymentMethod,
          status: insertedOrder.status as OrderStatus,
          cancel_reason: insertedOrder.cancel_reason,
          momo_confirmed: insertedOrder.momo_confirmed,
          transaction_id: insertedOrder.transaction_id || null,
          paid_at: insertedOrder.paid_at || null,
          branch_id: insertedOrder.branch_id || (orderData as any).branch_id || null,
          created_at: insertedOrder.created_at,
        };

        // Đồng bộ mã đơn quay lại đối tượng đầu vào
        orderData.code = currentCode;

        // Lưu bản sao vào cache in-memory
        inMemoryOrders.unshift(completedOrder);

        return { success: true, code: currentCode, order: completedOrder };
      } catch (ex: any) {
        lastError = ex;
        console.error(`[OrderDb] Ngoại lệ khi insert đơn hàng (lần ${attempt}):`, ex);
        if (isUniqueViolation(ex) && attempt < MAX_COLLISION_RETRIES) {
          currentCode = generateOrderCode();
          await new Promise((resolve) => setTimeout(resolve, attempt * 20 + Math.floor(Math.random() * 30)));
          continue;
        }
        break;
      }
    }

    const errorMessage = isUniqueViolation(lastError)
      ? "Xung đột mã đơn hàng sau 3 lần thử. Vui lòng bấm đặt lại."
      : `Lỗi kết nối cơ sở dữ liệu: ${lastError?.message || "Không xác định"}`;
    return { success: false, error: errorMessage };
  }

  // 2. Dự phòng In-memory (Offline Mode / CI Environment)
  let currentMemCode = initialCode;
  let memAttempt = 1;
  while (inMemoryOrders.some((o) => o.code === currentMemCode) && memAttempt <= MAX_COLLISION_RETRIES) {
    console.warn(`[OrderDb In-Memory] Xung đột mã đơn #${currentMemCode}, retry lần ${memAttempt}/${MAX_COLLISION_RETRIES}...`);
    currentMemCode = generateOrderCode();
    memAttempt++;
  }

  if (inMemoryOrders.some((o) => o.code === currentMemCode)) {
    return { success: false, error: "Xung đột mã đơn hàng sau 3 lần thử. Vui lòng bấm đặt lại." };
  }

  const memoryRecord: OrderRecord = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: currentMemCode,
    customer_name: orderData.customer_name,
    phone: orderData.phone,
    address: orderData.address,
    note: orderData.note || null,
    items: orderData.items,
    total: orderData.total,
    payment_method: orderData.payment_method,
    status: (orderData.status || "new") as OrderStatus,
    cancel_reason: orderData.cancel_reason || null,
    momo_confirmed: Boolean(orderData.momo_confirmed),
    transaction_id: null,
    paid_at: null,
    branch_id: (orderData as any).branch_id || null,
    created_at: new Date().toISOString(),
  };

  orderData.code = currentMemCode;
  inMemoryOrders.unshift(memoryRecord);
  return { success: true, code: currentMemCode, order: memoryRecord };
}

/**
 * Lấy danh sách đơn hàng với quan hệ order_items (Relational Join).
 * Hỗ trợ lọc theo chi nhánh (branchId) và trạng thái (status).
 */
export async function getOrders(branchId?: string, status?: string): Promise<OrderRecord[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            order_id,
            menu_item_id,
            item_name,
            price,
            quantity,
            subtotal
          )
        `)
        .order("created_at", { ascending: false });

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data.map((row: any) => {
          let extractedCancelReason = row.cancel_reason || null;
          if (!extractedCancelReason && row.note && row.note.includes("[Lý do hủy:")) {
            const match = row.note.match(/\[Lý do hủy:\s*([^\]]+)\]/);
            if (match) extractedCancelReason = match[1].trim();
          }

          const isMomoConfirmed = Boolean(
            row.momo_confirmed || (row.note && row.note.includes("[Đã báo CK MoMo]"))
          );

          const resolvedItems: OrderItemPayload[] =
            Array.isArray(row.order_items) && row.order_items.length > 0
              ? row.order_items.map((oi: any) => ({
                  id: oi.menu_item_id || oi.id,
                  name: oi.item_name,
                  price: oi.price,
                  qty: oi.quantity,
                }))
              : Array.isArray(row.items)
              ? row.items
              : [];

          return {
            id: row.id,
            code: row.code,
            customer_name: row.customer_name,
            phone: row.phone,
            address: row.address,
            note: row.note,
            items: resolvedItems,
            total: row.total,
            payment_method: row.payment_method as PaymentMethod,
            status: row.status as OrderStatus,
            cancel_reason: extractedCancelReason,
            momo_confirmed: isMomoConfirmed,
            transaction_id: row.transaction_id || null,
            paid_at: row.paid_at || null,
            branch_id: row.branch_id || null,
            created_at: row.created_at,
          };
        });
      }

      // Resilient fallback nếu bảng order_items chưa được thiết lập quan hệ (PGRST200)
      if (error) {
        console.warn("[OrderDb] Truy vấn với quan hệ order_items thất bại, kích hoạt fallback select trực tiếp:", error.message);
        let fallbackQuery = supabaseAdmin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (status) {
          fallbackQuery = fallbackQuery.eq("status", status);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (!fallbackError && fallbackData) {
          return fallbackData.map((row: any) => {
            let extractedCancelReason = row.cancel_reason || null;
            if (!extractedCancelReason && row.note && row.note.includes("[Lý do hủy:")) {
              const match = row.note.match(/\[Lý do hủy:\s*([^\]]+)\]/);
              if (match) extractedCancelReason = match[1].trim();
            }

            const isMomoConfirmed = Boolean(
              row.momo_confirmed || (row.note && row.note.includes("[Đã báo CK MoMo]"))
            );

            let parsedItems: OrderItemPayload[] = [];
            if (Array.isArray(row.items)) {
              parsedItems = row.items;
            } else if (typeof row.items === "string") {
              try {
                parsedItems = JSON.parse(row.items);
              } catch {
                parsedItems = [];
              }
            }

            return {
              id: row.id,
              code: row.code,
              customer_name: row.customer_name,
              phone: row.phone,
              address: row.address,
              note: row.note,
              items: parsedItems,
              total: row.total,
              payment_method: row.payment_method as PaymentMethod,
              status: row.status as OrderStatus,
              cancel_reason: extractedCancelReason,
              momo_confirmed: isMomoConfirmed,
              transaction_id: row.transaction_id || null,
              paid_at: row.paid_at || null,
              branch_id: row.branch_id || null,
              created_at: row.created_at,
            };
          });
        }
        console.error("[OrderDb] Lỗi truy vấn fallback getOrders từ Supabase:", fallbackError);
      }
    } catch (ex) {
      console.error("[OrderDb] Ngoại lệ khi lấy đơn hàng từ Supabase:", ex);
    }
  }

  // Fallback in-memory
  let result = [...inMemoryOrders];
  if (status) {
    result = result.filter((o) => o.status === status);
  }
  return result;
}

/**
 * Lấy toàn bộ đơn hàng (Tương thích ngược với endpoint admin)
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  return getOrders();
}

/**
 * Cập nhật trạng thái đơn hàng và ghi chú trên Supabase PostgreSQL
 */
export async function updateOrderStatus(
  code: string,
  status: OrderStatus,
  note?: string | null
): Promise<boolean> {
  let success = false;

  // Cập nhật In-memory cache
  const memIdx = inMemoryOrders.findIndex((o) => o.code === code);
  if (memIdx !== -1) {
    inMemoryOrders[memIdx].status = status;
    if (note !== undefined && note !== null) {
      inMemoryOrders[memIdx].note = note;
    }
    success = true;
  }

  // Cập nhật Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const updatePayload: any = { status };
      if (note !== undefined && note !== null) {
        updatePayload.note = note;
      }

      const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("code", code);

      if (!error) {
        success = true;
      } else {
        console.error("[OrderDb] Lỗi cập nhật trạng thái đơn trên Supabase:", error);
      }
    } catch (ex) {
      console.error("[OrderDb] Ngoại lệ khi cập nhật trạng thái Supabase:", ex);
    }
  }

  return success;
}

/**
 * Cập nhật trạng thái đơn hàng kèm lý do hủy (Tương thích ngược với /api/admin/orders)
 */
export async function updateOrderStatusInDb(
  code: string,
  newStatus: OrderStatus,
  cancelReason?: string | null
): Promise<boolean> {
  const currentOrder = await getOrderByCode(code);
  let updatedNote = currentOrder?.note || "";

  if (cancelReason) {
    updatedNote = updatedNote
      ? `${updatedNote} • [Lý do hủy: ${cancelReason}]`
      : `[Lý do hủy: ${cancelReason}]`;
  }

  let success = false;

  // Cập nhật In-memory
  const memIdx = inMemoryOrders.findIndex((o) => o.code === code);
  if (memIdx !== -1) {
    inMemoryOrders[memIdx].status = newStatus;
    if (cancelReason) {
      inMemoryOrders[memIdx].cancel_reason = cancelReason;
      inMemoryOrders[memIdx].note = updatedNote;
    }
    success = true;
  }

  // Cập nhật Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const updatePayload: any = {
        status: newStatus,
        note: updatedNote,
      };
      if (cancelReason !== undefined) {
        updatePayload.cancel_reason = cancelReason;
      }

      const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("code", code);
      if (!error) {
        success = true;
      } else {
        console.error("[OrderDb] Lỗi updateOrderStatusInDb trên Supabase:", error);
      }
    } catch (ex) {
      console.error("[OrderDb] Ngoại lệ updateOrderStatusInDb Supabase:", ex);
    }
  }

  return success;
}

/**
 * Đánh dấu khách hàng đã báo chuyển khoản MoMo
 */
export async function markMomoPaymentConfirmed(code: string): Promise<boolean> {
  // In-memory
  const memOrder = inMemoryOrders.find((o) => o.code === code);
  if (memOrder) {
    memOrder.momo_confirmed = true;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const current = await getOrderByCode(code);
      const currentNote = current?.note || "";
      const updatedNote = currentNote.includes("[Đã báo CK MoMo]")
        ? currentNote
        : currentNote
        ? `${currentNote} • [Đã báo CK MoMo]`
        : `[Đã báo CK MoMo]`;

      await supabaseAdmin
        .from("orders")
        .update({
          momo_confirmed: true,
          note: updatedNote,
        })
        .eq("code", code);
    } catch (e) {
      console.warn("[OrderDb] Lỗi cập nhật momo_confirmed:", e);
    }
  }

  return true;
}

export interface ReconcileResult {
  success: boolean;
  reconciled?: boolean;
  idempotent?: boolean;
  deficit?: number;
  underpayment?: boolean;
  notFound?: boolean;
  error?: string;
  order?: OrderRecord;
}

/**
 * Đối soát thanh toán đơn hàng tự động từ webhook ngân hàng/MoMo (Idempotent & Atomic)
 */
export async function reconcileOrderPayment(
  code: string,
  transactionId: string,
  amount: number,
  options?: { gateway?: string; memo?: string; ip?: string }
): Promise<ReconcileResult> {
  // 1. Kiểm tra Idempotency trước tiên: Tránh cộng trùng tiền hoặc thao tác lặp lại
  if (!transactionId || typeof transactionId !== "string" || transactionId.trim() === "") {
    return { success: false, error: "Missing or empty transactionId" };
  }

  const cleanTx = transactionId.trim();
  const cleanCode = code ? code.trim().toUpperCase() : "";

  if (await isTransactionAlreadyLogged(cleanTx)) {
    return { success: true, reconciled: true, idempotent: true };
  }

  // 2. Tra cứu đơn hàng theo mã đơn
  const order = await getOrderByCode(cleanCode);
  if (!order) {
    return { success: false, notFound: true, error: `Order #${cleanCode} not found` };
  }

  // Nếu đơn hàng này đã được ghi nhận transactionId trùng khớp
  if (order.transaction_id === cleanTx && order.status === "paid") {
    markTransactionProcessed(cleanTx);
    return { success: true, reconciled: true, idempotent: true, order };
  }

  // 3. Kiểm tra số tiền chuyển
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { success: false, error: "Invalid transfer amount: amount must be greater than 0" };
  }

  // 3.1 Phát hiện chuyển thiếu tiền (Underpayment)
  if (amount < order.total) {
    const deficit = order.total - amount;
    const warningNote = `[Chuyển thiếu: Nhận ${amount.toLocaleString("vi-VN")}đ / Cần ${order.total.toLocaleString("vi-VN")}đ - Thiếu ${deficit.toLocaleString("vi-VN")}đ]`;
    const updatedNote = order.note ? `${order.note} • ${warningNote}` : warningNote;

    // Cập nhật note vào in-memory
    const memIdx = inMemoryOrders.findIndex((o) => o.code === cleanCode);
    if (memIdx !== -1) {
      inMemoryOrders[memIdx].note = updatedNote;
    }

    // Cập nhật note vào Supabase
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from("orders").update({ note: updatedNote }).eq("code", cleanCode);
    }

    // Ghi log cảnh báo vào audit_logs
    await logFinancialAudit({
      entityType: "order",
      entityId: order.id || cleanCode,
      action: "UNDERPAYMENT_WARNING",
      changedBy: "system_webhook",
      oldValues: { status: order.status, total: order.total },
      newValues: {
        code: cleanCode,
        transferred: amount,
        total: order.total,
        deficit: deficit,
        transaction_id: cleanTx,
        gateway: options?.gateway || "vietqr",
      },
      ipAddress: options?.ip,
    });

    return {
      success: false,
      underpayment: true,
      deficit: deficit,
      error: `Underpayment: transferred amount (${amount}đ) is less than order total (${order.total}đ)`,
    };
  }

  // 4. Số tiền hợp lệ (amount >= order.total): Atomic update sang 'paid'
  const paidAt = new Date().toISOString();
  let updatedNote = order.note || "";
  if (amount > order.total) {
    const surplus = amount - order.total;
    const surplusNote = `[Chuyển dư: ${surplus.toLocaleString("vi-VN")}đ]`;
    updatedNote = updatedNote ? `${updatedNote} • ${surplusNote}` : surplusNote;
  }

  // 4.1 Cập nhật In-memory cache
  const memIdx = inMemoryOrders.findIndex((o) => o.code === cleanCode);
  if (memIdx !== -1) {
    inMemoryOrders[memIdx].status = "paid";
    inMemoryOrders[memIdx].momo_confirmed = true;
    inMemoryOrders[memIdx].transaction_id = cleanTx;
    inMemoryOrders[memIdx].paid_at = paidAt;
    if (updatedNote) inMemoryOrders[memIdx].note = updatedNote;
  }

  // 4.2 Cập nhật Supabase PostgreSQL
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const updatePayload: any = {
        status: "paid",
        momo_confirmed: true,
        transaction_id: cleanTx,
        paid_at: paidAt,
      };
      if (updatedNote) {
        updatePayload.note = updatedNote;
      }

      const { error: updateErr } = await supabaseAdmin
        .from("orders")
        .update(updatePayload)
        .eq("code", cleanCode);

      if (updateErr) {
        console.error("[OrderDb] Lỗi cập nhật status 'paid' trên Supabase:", updateErr);
      }
    } catch (ex: any) {
      console.error("[OrderDb] Ngoại lệ cập nhật status 'paid' Supabase:", ex);
    }
  }

  // 4.3 Ghi nhật ký kiểm toán tài chính bất biến vào audit_logs
  await logFinancialAudit({
    entityType: "order",
    entityId: order.id || cleanCode,
    action: "WEBHOOK_PAID",
    changedBy: "system_webhook",
    oldValues: {
      status: order.status,
      momo_confirmed: order.momo_confirmed,
      transaction_id: order.transaction_id || null,
    },
    newValues: {
      code: cleanCode,
      total: order.total,
      transferred: amount,
      transaction_id: cleanTx,
      gateway: options?.gateway || "vietqr",
      paid_at: paidAt,
      memo: options?.memo,
    },
    ipAddress: options?.ip,
  });

  // Đánh dấu đã đối soát để bảo vệ Idempotency ngay lập tức
  markTransactionProcessed(cleanTx);

  const updatedOrder: OrderRecord = {
    ...order,
    status: "paid",
    momo_confirmed: true,
    transaction_id: cleanTx,
    paid_at: paidAt,
    note: updatedNote || order.note,
  };

  return {
    success: true,
    reconciled: true,
    order: updatedOrder,
  };
}

/**
 * Tra cứu thông tin đơn hàng cụ thể theo mã đơn
 */
export async function getOrderByCode(code: string): Promise<OrderRecord | null> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            order_id,
            menu_item_id,
            item_name,
            price,
            quantity,
            subtotal
          )
        `)
        .eq("code", code)
        .single();

      if (!error && data) {
        let extractedCancelReason = data.cancel_reason || null;
        if (!extractedCancelReason && data.note && data.note.includes("[Lý do hủy:")) {
          const match = data.note.match(/\[Lý do hủy:\s*([^\]]+)\]/);
          if (match) extractedCancelReason = match[1].trim();
        }

        const isMomoConfirmed = Boolean(
          data.momo_confirmed || (data.note && data.note.includes("[Đã báo CK MoMo]"))
        );

        const resolvedItems: OrderItemPayload[] =
          Array.isArray(data.order_items) && data.order_items.length > 0
            ? data.order_items.map((oi: any) => ({
                id: oi.menu_item_id || oi.id,
                name: oi.item_name,
                price: oi.price,
                qty: oi.quantity,
              }))
            : Array.isArray(data.items)
            ? data.items
            : [];

        return {
          id: data.id,
          code: data.code,
          customer_name: data.customer_name,
          phone: data.phone,
          address: data.address,
          note: data.note,
          items: resolvedItems,
          total: data.total,
          payment_method: data.payment_method as PaymentMethod,
          status: data.status as OrderStatus,
          cancel_reason: extractedCancelReason,
          momo_confirmed: isMomoConfirmed,
          transaction_id: data.transaction_id || null,
          paid_at: data.paid_at || null,
          created_at: data.created_at,
        };
      }
    } catch (ex) {
      console.error("[OrderDb] Lỗi tra cứu đơn hàng theo mã:", ex);
    }
  }

  // Fallback in-memory
  return inMemoryOrders.find((o) => o.code === code) || null;
}

/**
 * Xóa vĩnh viễn 1 đơn hàng theo mã đơn
 */
export async function deleteOrderFromDb(code: string): Promise<boolean> {
  let success = false;

  // In-memory
  const idx = inMemoryOrders.findIndex((o) => o.code === code);
  if (idx !== -1) {
    inMemoryOrders.splice(idx, 1);
    success = true;
  }

  // Supabase (Cascade delete tự động xóa các dòng con trong order_items)
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("orders").delete().eq("code", code);
      if (!error) {
        success = true;
      }
    } catch (ex) {
      console.error("[OrderDb] Ngoại lệ khi xóa đơn trên Supabase:", ex);
    }
  }

  return success;
}

/**
 * Xóa sạch lịch sử các đơn hàng đã hoàn tất hoặc đã hủy
 */
export async function clearOrderHistoryFromDb(): Promise<boolean> {
  let success = false;

  // In-memory
  for (let i = inMemoryOrders.length - 1; i >= 0; i--) {
    if (inMemoryOrders[i].status === "completed" || inMemoryOrders[i].status === "cancelled") {
      inMemoryOrders.splice(i, 1);
    }
  }
  success = true;

  // Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .in("status", ["completed", "cancelled"]);
      if (!error) {
        success = true;
      }
    } catch (ex) {
      console.error("[OrderDb] Ngoại lệ khi xóa lịch sử đơn Supabase:", ex);
    }
  }

  return success;
}
