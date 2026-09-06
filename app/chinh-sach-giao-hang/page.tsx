import React from "react";
import Link from "next/link";
import { ArrowLeft, Truck, Clock, MapPin, ShieldAlert, Phone } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";
import { LANDING_CONFIG } from "@/config/landing";

export const metadata = {
  title: "Chính Sách Giao Hàng & Vận Chuyển | Nem Núi",
  description: "Quy định chi tiết về phạm vi giao hàng, phí vận chuyển và thời gian cam kết của Nem Núi.",
};

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        <div className="border-b border-stone-200 pb-6 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-3">
            <Truck className="w-3.5 h-3.5 text-orange-600" />
            <span>Chính sách vận chuyển & giao nhận</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            CHÍNH SÁCH GIAO HÀNG & PHẠM VI PHỤC VỤ
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Áp dụng cho khách hàng đặt lẻ và đối tác sỉ của Hộ Kinh Doanh Nem Núi (Cập nhật 2026)
          </p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed font-normal">
          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>1. Thời gian hoạt động & Xử lý đơn hàng</span>
            </h2>
            <p>
              Nem Núi phục vụ từ <strong>08:00 đến 22:00</strong> tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày lễ). Mọi đơn hàng đặt trực tuyến trong khung giờ này sẽ được tiếp nhận và xử lý ngay.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>2. Phạm vi giao hàng & Phí vận chuyển</span>
            </h2>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
              <p>
                <strong>Đơn hàng bán lẻ (giao hỏa tốc):</strong> Áp dụng tại khu vực nội thành TP. Hồ Chí Minh. Phí giao hàng tiêu chuẩn đồng giá <strong>15.000đ/đơn</strong> đối với các đơn hàng đạt mức tối thiểu từ 30.000đ (hoặc 25.000đ với Kit mẫu thử).
              </p>
              <p>
                <strong>Thời gian giao hàng:</strong> Nem được nướng than hoa nóng hổi theo từng đơn, cam kết giao đến tay quý khách trong vòng <strong>30 - 60 phút</strong> tùy khoảng cách.
              </p>
              <p>
                <strong>Đơn sỉ từ 100 cây (gửi tỉnh):</strong> Đóng thùng xốp lót đá gel giữ nhiệt tiêu chuẩn, giao tận nơi tại bến xe Miền Tây, bến xe Miền Đông hoặc các chành xe theo yêu cầu của đối tác.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <span>3. Đặt cọc đối với đơn hàng giá trị cao (COD)</span>
            </h2>
            <p>
              Do đặc thù thực phẩm chế biến tươi nóng, các đơn hàng chọn phương thức thanh toán tiền mặt (COD) có giá trị <strong>trên 150.000đ</strong> yêu cầu đặt cọc trước tối thiểu 30.000đ hoặc xác nhận trực tiếp qua điện thoại với nhân viên quản lý trước khi bếp nướng nem.
            </p>
          </section>

          <section className="pt-4 border-t border-stone-200">
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span>4. Thông tin liên hệ hỗ trợ vận chuyển</span>
            </h2>
            <p>
              Nếu quý khách cần giao gấp hoặc điều chỉnh thông tin đơn hàng, vui lòng gọi trực tiếp hotline:
            </p>
            <p className="mt-2 font-bold text-orange-600 text-base">
              Hotline: {SHOP_CONFIG.displayPhone}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Địa chỉ: {SHOP_CONFIG.address}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
