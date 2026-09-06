import { SHOP_CONFIG } from "@/config/shop";

/**
 * Định dạng số tiền sang định dạng tiền Việt Nam: 35.000đ
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

/**
 * Regex kiểm tra số điện thoại Việt Nam hợp lệ
 * Bắt đầu bằng 0 hoặc +84 kết hợp với đầu số di động (3, 5, 7, 8, 9) và 8 chữ số tiếp theo
 */
export const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function isValidVNPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s.-]/g, "");
  return VN_PHONE_REGEX.test(cleanPhone);
}

/**
 * Kiểm tra xem quán ăn hiện tại có đang trong giờ mở cửa không
 */
export function checkShopOpenStatus(): {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
} {
  try {
    const now = new Date();
    // Chuyển giờ theo timezone Việt Nam (GMT+7)
    const vnTimeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const formattedTime = vnTimeFormatter.format(now);
    const [currentHour, currentMinute] = formattedTime.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [openHour, openMinute] = SHOP_CONFIG.openingHours.open.split(":").map(Number);
    const openMinutes = openHour * 60 + openMinute;

    const [closeHour, closeMinute] = SHOP_CONFIG.openingHours.close.split(":").map(Number);
    const closeMinutes = closeHour * 60 + closeMinute;

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return {
        isOpen: true,
        message: `Đang mở cửa (${SHOP_CONFIG.openingHours.open} - ${SHOP_CONFIG.openingHours.close})`,
      };
    }

    return {
      isOpen: false,
      message: `Quán hiện đang đóng cửa (Giờ phục vụ: ${SHOP_CONFIG.openingHours.open} - ${SHOP_CONFIG.openingHours.close})`,
      nextOpenTime: SHOP_CONFIG.openingHours.open,
    };
  } catch {
    // Fallback nếu có lỗi lấy timezone
    return {
      isOpen: true,
      message: `Giờ mở cửa: ${SHOP_CONFIG.openingHours.open} - ${SHOP_CONFIG.openingHours.close}`,
    };
  }
}

/**
 * Sinh mã đơn hàng ngẫu nhiên 6 ký tự
 * Loại bỏ các ký tự dễ gây nhầm lẫn: 0, O, 1, I
 */
export function generateOrderCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

/**
 * Tạo URL QR MoMo động theo chuẩn MoMo QuickPay hoặc VietQR
 */
export function getMomoQrUrl(orderCode: string, amount: number): string {
  // Có thể dùng ảnh tĩnh nếu không có kết nối, hoặc VietQR/MoMo API
  const phone = SHOP_CONFIG.momo.phone;
  const name = encodeURIComponent(SHOP_CONFIG.momo.accountName);
  const note = encodeURIComponent(`Đơn hàng ${orderCode}`);
  
  // VietQR / MoMo format fallback
  return `https://img.vietqr.io/image/momo-${phone}-compact2.png?amount=${amount}&addInfo=${note}&accountName=${name}`;
}
