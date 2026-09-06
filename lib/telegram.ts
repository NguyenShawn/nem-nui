import { OrderItemPayload, PaymentMethod } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const isTelegramConfigured = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

interface TelegramOrderMessageProps {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string | null;
  items: OrderItemPayload[];
  total: number;
  paymentMethod: PaymentMethod;
  shippingFee: number;
}

/**
 * Định dạng thời gian theo chuẩn Việt Nam (HH:mm dd/MM/yyyy)
 */
function getVietnamFormattedTime(): string {
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  return `${timeStr} ${dateStr}`;
}

/**
 * Tạo nội dung tin nhắn Telegram gửi về cho chủ quán theo đúng mẫu yêu cầu
 */
export function buildTelegramMessage({
  orderCode,
  customerName,
  phone,
  address,
  note,
  items,
  total,
  paymentMethod,
  shippingFee,
}: TelegramOrderMessageProps): string {
  const itemsText = items
    .map(
      (item) =>
        `• ${item.qty}x ${item.name} — ${formatCurrency(item.price * item.qty)}`
    )
    .join("\n");

  const paymentText =
    paymentMethod === "momo"
      ? "MoMo (khách báo chuyển khoản QR)"
      : "COD (Thanh toán tiền mặt khi nhận)";

  const timeText = getVietnamFormattedTime();
  const noteText = note && note.trim() ? note.trim() : "Không có";

  const message = [
    `🍜 ĐƠN MỚI #${orderCode}`,
    `👤 Khách: ${customerName}`,
    `📞 SĐT: ${phone}`,
    `📍 Đ/c: ${address}`,
    `🛒 Món:`,
    itemsText,
    `💰 Tổng: ${formatCurrency(total)} (Phí ship: ${formatCurrency(shippingFee)})`,
    `💳 ${paymentText}`,
    `📝 Ghi chú: ${noteText}`,
    `⏰ ${timeText}`,
  ].join("\n");

  return message;
}

/**
 * Gửi tin nhắn Telegram thông qua Bot API
 */
export async function sendTelegramOrderNotification(
  props: TelegramOrderMessageProps
): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramConfigured) {
    console.warn(
      "[Telegram] TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID chưa được cấu hình trong .env.local. Đơn hàng được xử lý giả lập thành công."
    );
    return { success: true };
  }

  try {
    const text = buildTelegramMessage(props);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("[Telegram Error]", data);
      return {
        success: false,
        error: data.description || "Lỗi gửi tin nhắn Telegram",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Telegram Exception]", error);
    return {
      success: false,
      error: error?.message || "Lỗi kết nối đến máy chủ Telegram",
    };
  }
}

/**
 * Gửi tin nhắn thô dạng văn bản bất kỳ qua Telegram (dùng cho Lead B2B)
 */
export async function sendRawTelegramMessage(
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramConfigured) {
    return { success: true };
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML",
      }),
    });
    const data = await response.json();
    return { success: data.ok };
  } catch (error: any) {
    console.warn("[Telegram lead error]", error);
    return { success: false, error: error?.message };
  }
}

