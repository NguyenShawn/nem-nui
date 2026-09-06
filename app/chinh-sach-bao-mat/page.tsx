import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Phone, Scale } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata = {
  title: "Chính Sách Bảo Vệ Dữ Liệu Cá Nhân | Nem Núi",
  description: "Chính sách xử lý và bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Nem Núi.",
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-3">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Tuân thủ Nghị định 13/2023/NĐ-CP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            CHÍNH SÁCH BẢO VỆ & XỬ LÝ DỮ LIỆU CÁ NHÂN
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Áp dụng cho mọi hoạt động thu thập, lưu trữ và xử lý thông tin khách hàng tại Nem Núi
          </p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed font-normal">
          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>1. Cam kết tuân thủ Nghị định 13/2023/NĐ-CP</span>
            </h2>
            <p>
              Hộ Kinh Doanh Nem Núi cam kết tôn trọng và bảo vệ tuyệt đối quyền riêng tư cùng dữ liệu cá nhân của khách hàng phù hợp với các quy định pháp luật hiện hành tại Việt Nam, đặc biệt là <strong>Nghị định số 13/2023/NĐ-CP ngày 17/04/2023</strong> của Chính phủ về bảo vệ dữ liệu cá nhân.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-600" />
              <span>2. Loại dữ liệu cá nhân được thu thập</span>
            </h2>
            <p>Chúng tôi chỉ thu thập các dữ liệu cá nhân cơ bản cần thiết phục vụ cho việc thực hiện giao dịch:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
              <li><strong>Họ và tên</strong> (hoặc tên quán) của người đặt hàng hoặc người liên hệ tư vấn sỉ.</li>
              <li><strong>Số điện thoại liên lạc</strong> dùng để xác nhận đơn hàng, gửi mã tracking và gọi giao nhận hàng.</li>
              <li><strong>Địa chỉ giao hàng cụ thể</strong> để nhân viên giao hàng vận chuyển món ăn nóng tận nơi.</li>
              <li><strong>Ghi chú đơn hàng</strong> (nếu có yêu cầu đặc thù về khẩu vị hoặc thời gian nhận).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-600" />
              <span>3. Mục đích và phạm vi xử lý dữ liệu</span>
            </h2>
            <p>Dữ liệu thu thập được sử dụng duy nhất cho các mục đích hợp pháp sau:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
              <li>Tiếp nhận, xử lý và hoàn tất giao dịch đặt hàng hoặc đăng ký nhận bảng giá sỉ.</li>
              <li>Thông báo tình trạng đơn hàng qua tin nhắn hoặc điện thoại trực tiếp.</li>
              <li>Hỗ trợ khách hàng giải quyết khiếu nại, đối soát chuyển khoản thanh toán.</li>
              <li>Cam kết <strong>KHÔNG</strong> chia sẻ, bán hoặc chuyển giao dữ liệu cá nhân của khách hàng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo thương mại trái phép.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <span>4. Biện pháp an toàn và quyền của chủ thể dữ liệu</span>
            </h2>
            <p>
              Hệ thống áp dụng các biện pháp mã hóa kỹ thuật, phân quyền truy cập nghiêm ngặt và lưu trữ an toàn trên máy chủ đám mây. Khách hàng có toàn quyền yêu cầu kiểm tra, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bất kỳ lúc nào bằng cách liên hệ hotline quản lý.
            </p>
          </section>

          <section className="pt-4 border-t border-stone-200">
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span>5. Đơn vị kiểm soát và xử lý dữ liệu cá nhân</span>
            </h2>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1.5 text-xs text-stone-700">
              <p><strong>Đơn vị:</strong> Hộ Kinh Doanh Nem Núi</p>
              <p><strong>Người đại diện theo pháp luật:</strong> Nguyễn Trường Sơn</p>
              <p><strong>Mã số thuế:</strong> 8492048291 do Chi cục Thuế Huyện Bình Chánh cấp ngày 15/03/2024</p>
              <p><strong>Địa chỉ trụ sở:</strong> {SHOP_CONFIG.address}</p>
              <p><strong>Hotline tiếp nhận yêu cầu về dữ liệu:</strong> {SHOP_CONFIG.displayPhone}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
