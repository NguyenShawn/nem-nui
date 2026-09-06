/**
 * Gửi dữ liệu khách sỉ vào Google Sheets thông qua Google Apps Script Webhook URL
 */

export interface LeadData {
  fullName: string;
  phone: string;
  tier?: string;
  tierLabel?: string;
  addressNote?: string;
  submittedAt?: string;
}

export async function sendLeadToGoogleSheets(
  lead: LeadData
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.trim()) {
    console.warn(
      "[Google Sheets] GOOGLE_SHEETS_WEBHOOK_URL chưa được cấu hình trong .env.local. Bỏ qua gửi Sheets."
    );
    return { success: false, error: "Chưa cấu hình GOOGLE_SHEETS_WEBHOOK_URL" };
  }

  try {
    const formattedTime =
      lead.submittedAt ||
      new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date());

    const payload = {
      fullName: lead.fullName,
      phone: lead.phone,
      tier: lead.tierLabel || lead.tier || "100 cây",
      addressNote: lead.addressNote || "Không có",
      submittedAt: formattedTime,
    };

    const res = await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn(`[Google Sheets] Webhook trả về mã lỗi: ${res.status}`);
      return { success: false, error: `Mã lỗi HTTP: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Google Sheets] Lỗi khi gửi dữ liệu sang Google Sheets:", err);
    return { success: false, error: err.message };
  }
}

export interface OrderSheetData {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
}

/**
 * Gửi tự động đơn hàng bán lẻ vào Google Sheets qua Webhook chung
 */
export async function sendOrderToGoogleSheets(
  order: OrderSheetData
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, error: "Chưa cấu hình GOOGLE_SHEETS_WEBHOOK_URL" };
  }

  try {
    const formattedTime = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    const itemsSummary = order.items
      .map((i) => `${i.qty}x ${i.name}`)
      .join(", ");

    const paymentLabel = order.paymentMethod === "momo" ? "MoMo (Chờ khách CK)" : "COD (Tiền mặt)";

    const payload = {
      fullName: `[ĐƠN LẺ - #${order.orderCode}] ${order.customerName}`,
      phone: order.phone,
      tier: `${new Intl.NumberFormat("vi-VN").format(order.total)}đ (${paymentLabel})`,
      addressNote: `Đ/c: ${order.address} | Món: ${itemsSummary}${order.note ? ` | Ghi chú: ${order.note}` : ""}`,
      submittedAt: formattedTime,
    };

    const res = await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn(`[Google Sheets] Webhook đơn hàng trả về mã lỗi: ${res.status}`);
      return { success: false, error: `Mã lỗi HTTP: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Google Sheets] Lỗi gửi đơn hàng sang Google Sheets:", err);
    return { success: false, error: err.message };
  }
}