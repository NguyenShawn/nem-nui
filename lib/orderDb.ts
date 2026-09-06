import fs from "fs";
import path from "path";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { OrderRecord, OrderStatus } from "@/types/order";

// Đường dẫn file database dự phòng local
const LOCAL_DB_PATH = path.join(process.cwd(), "data", "orders_db.json");

// Hàm phụ trợ đảm bảo thư mục data tồn tại
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Đọc toàn bộ đơn hàng từ file JSON cục bộ
export function readLocalOrders(): OrderRecord[] {
  try {
    ensureDirectoryExistence(LOCAL_DB_PATH);
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Lỗi đọc database local:", error);
    return [];
  }
}

// Ghi toàn bộ đơn hàng vào file JSON cục bộ
export function writeLocalOrders(orders: OrderRecord[]) {
  try {
    ensureDirectoryExistence(LOCAL_DB_PATH);
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(orders, null, 2), "utf-8");
  } catch (error) {
    console.error("Lỗi ghi database local:", error);
  }
}

/**
 * Hàm lưu đơn hàng mới: Ưu tiên Supabase, dự phòng/ghi song song vào JSON local
 */
export async function saveNewOrder(order: OrderRecord): Promise<boolean> {
  // 1. Lưu local để đảm bảo luôn hoạt động (backup/offline)
  const localOrders = readLocalOrders();
  // Chèn vào đầu danh sách để hiển thị mới nhất trước
  localOrders.unshift(order);
  writeLocalOrders(localOrders);

  // 2. Lưu Supabase nếu đã cấu hình
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("orders").insert({
        code: order.code,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        note: order.note || null,
        items: order.items,
        total: order.total,
        payment_method: order.payment_method,
        status: order.status,
      });
      if (error) {
        console.error("Lỗi ghi đơn vào Supabase:", error);
        return false;
      }
      return true;
    } catch (ex) {
      console.error("Lỗi kết nối Supabase:", ex);
      return false;
    }
  }

  return true;
}

/**
 * Hàm lấy danh sách tất cả đơn hàng (hoặc lọc theo trạng thái)
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  // 1. Nếu có Supabase, ưu tiên lấy từ Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Ánh xạ lại tên cột từ DB (snake_case)
        return data.map((item: any) => {
          let extractedCancelReason = item.cancel_reason || null;
          if (!extractedCancelReason && item.note && item.note.includes("[Lý do hủy:")) {
            const match = item.note.match(/\[Lý do hủy:\s*([^\]]+)\]/);
            if (match) extractedCancelReason = match[1].trim();
          }

          const isMomoConfirmed = Boolean(
            item.momo_confirmed || (item.note && item.note.includes("[Đã báo CK MoMo]"))
          );

          return {
            id: item.id,
            code: item.code,
            customer_name: item.customer_name,
            phone: item.phone,
            address: item.address,
            note: item.note,
            items: item.items,
            total: item.total,
            payment_method: item.payment_method,
            status: item.status as OrderStatus,
            cancel_reason: extractedCancelReason,
            momo_confirmed: isMomoConfirmed,
            created_at: item.created_at,
          };
        });
      }
      console.error("Lỗi lấy đơn từ Supabase, chuyển sang đọc local:", error);
    } catch (ex) {
      console.error("Ngoại lệ khi lấy đơn từ Supabase:", ex);
    }
  }

  // 2. Dự phòng lấy từ file local
  return readLocalOrders();
}

/**
 * Hàm cập nhật trạng thái đơn hàng
 */
export async function updateOrderStatusInDb(
  code: string,
  newStatus: OrderStatus,
  cancelReason?: string | null
): Promise<boolean> {
  let success = false;

  // 1. Cập nhật local
  const localOrders = readLocalOrders();
  const orderIndex = localOrders.findIndex((o) => o.code === code);
  if (orderIndex !== -1) {
    localOrders[orderIndex].status = newStatus;
    if (cancelReason) {
      localOrders[orderIndex].cancel_reason = cancelReason;
      const currentNote = localOrders[orderIndex].note || "";
      localOrders[orderIndex].note = currentNote
        ? `${currentNote} • [Lý do hủy: ${cancelReason}]`
        : `[Lý do hủy: ${cancelReason}]`;
    }
    writeLocalOrders(localOrders);
    success = true;
  }

  // 2. Cập nhật Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const updatePayload: any = { status: newStatus };
      if (cancelReason) {
        const currentOrder = await getOrderByCode(code);
        const currentNote = currentOrder?.note || "";
        updatePayload.note = currentNote
          ? `${currentNote} • [Lý do hủy: ${cancelReason}]`
          : `[Lý do hủy: ${cancelReason}]`;
      }

      const { error } = await supabaseAdmin
        .from("orders")
        .update(updatePayload)
        .eq("code", code);

      if (error) {
        console.error("Lỗi cập nhật trạng thái đơn trên Supabase:", error);
      } else {
        success = true;
      }
    } catch (ex) {
      console.error("Ngoại lệ khi cập nhật Supabase:", ex);
    }
  }

  return success;
}

/**
 * Hàm ghi nhận khách hàng đã bấm xác nhận chuyển tiền MoMo
 */
export async function markMomoPaymentConfirmed(code: string): Promise<boolean> {
  const localOrders = readLocalOrders();
  const orderIndex = localOrders.findIndex((o) => o.code === code);
  if (orderIndex !== -1) {
    localOrders[orderIndex].momo_confirmed = true;
    writeLocalOrders(localOrders);
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const currentOrder = await getOrderByCode(code);
      const currentNote = currentOrder?.note || "";
      if (!currentNote.includes("[Đã báo CK MoMo]")) {
        const updatedNote = currentNote
          ? `${currentNote} • [Đã báo CK MoMo]`
          : `[Đã báo CK MoMo]`;
        await supabaseAdmin
          .from("orders")
          .update({ note: updatedNote })
          .eq("code", code);
      }
    } catch (e) {
      console.warn("Lỗi lưu momo confirmed:", e);
    }
  }

  return true;
}

/**
 * Hàm lấy 1 đơn hàng cụ thể theo mã đơn
 */
export async function getOrderByCode(code: string): Promise<OrderRecord | null> {
  // 1. Ưu tiên lấy từ Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*")
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

        return {
          id: data.id,
          code: data.code,
          customer_name: data.customer_name,
          phone: data.phone,
          address: data.address,
          note: data.note,
          items: data.items,
          total: data.total,
          payment_method: data.payment_method,
          status: data.status as OrderStatus,
          cancel_reason: extractedCancelReason,
          momo_confirmed: isMomoConfirmed,
          created_at: data.created_at,
        };
      }
    } catch (ex) {
      console.error("Lỗi tra đơn hàng trên Supabase:", ex);
    }
  }

  // 2. Tìm trong local
  const localOrders = readLocalOrders();
  return localOrders.find((o) => o.code === code) || null;
}
