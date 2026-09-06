/**
 * ============================================================================
 * CẤU HÌNH TẬP TRUNG CHO QUÁN ĂN (SHOP CONFIGURATION)
 * ============================================================================
 * Bạn có thể dễ dàng thay đổi thông tin quán ăn, giờ mở cửa, phí ship,
 * và thông tin chuyển khoản MoMo tại đây.
 */

export interface ShopConfig {
  name: string;
  slogan: string;
  phone: string;
  displayPhone: string;
  address: string;
  openingHours: {
    open: string; // Định dạng HH:mm (vd: "09:00")
    close: string; // Định dạng HH:mm (vd: "22:00")
    daysNote: string; // Ghi chú ngày hoạt động (vd: "Thứ 2 - Chủ Nhật")
  };
  shippingFee: number; // Phí giao hàng cố định (VNĐ)
  minOrderAmount: number; // Đơn hàng tối thiểu để đặt (VNĐ)
  adminPin: string; // Mã PIN để đăng nhập màn hình bếp/quản lý của quán (vd: "1234")
  momo: {
    phone: string; // Số điện thoại đăng ký MoMo
    accountName: string; // Tên chủ tài khoản MoMo (IN HOA)
    qrImage: string; // Đường dẫn ảnh QR MoMo trong /public
  };
  socials?: {
    zalo?: string;
    facebook?: string;
  };
}

export const SHOP_CONFIG: ShopConfig = {
  // Mã PIN bảo mật màn hình bếp (Web Quán / Bếp)
  adminPin: "1234",

  // Tên quán ăn hiển thị trên web và thông báo
  name: "Nem Núi - Đặc Sản Nem Nướng",

  // Câu khẩu hiệu / giới thiệu ngắn
  slogan: "Thơm ngon chuẩn vị • Nước chấm gia truyền • Giao tận nơi nóng hổi",

  // Số điện thoại dùng để khách gọi (bấm nút gọi tel:)
  phone: "0369652674",

  // Số điện thoại hiển thị đẹp mắt cho khách xem
  displayPhone: "0369 652 674",

  // Địa chỉ quán ăn
  address: "123 Đường Số 7, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",

  // Giờ mở cửa hàng ngày (Dùng để kiểm tra ngoài giờ đặt món)
  openingHours: {
    open: "09:00",
    close: "21:30",
    daysNote: "Mở cửa hàng ngày: 09:00 - 21:30",
  },

  // Phí giao hàng (VNĐ) - hiển thị trong giỏ hàng và cộng vào tổng đơn
  shippingFee: 15000,

  // Giá trị đơn hàng tối thiểu để được đặt (VNĐ) - Đơn thường 30.000đ (Kit mẫu thử áp dụng cơ chế ngoại lệ 25.000đ)
  minOrderAmount: 30000,

  // Thông tin thanh toán qua MoMo (Quét mã QR)
  momo: {
    phone: "0369652674",
    accountName: "NEM NUI",
    qrImage: "/momo-qr.png", // Đặt ảnh QR của bạn tại /public/momo-qr.png
  },

  // Liên kết mạng xã hội (tùy chọn)
  socials: {
    zalo: "https://zalo.me/0369652674",
    facebook: "https://facebook.com",
  },
};
