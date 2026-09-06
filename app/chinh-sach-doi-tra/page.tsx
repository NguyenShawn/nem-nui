import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Phone } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata = {
  title: "Chính Sách Kiểm Hàng & Đổi Trả | Nem Núi",
  description: "Quy định kiểm tra hàng hóa khi nhận và chính sách đổi trả sản phẩm tươi sống của Nem Núi.",
};

export default function ReturnPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quy chuẩn chất lượng & đổi trả</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            CHÍNH SÁCH KIỂM HÀNG & ĐỔI TRẢ
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Bảo đảm quyền lợi người tiêu dùng theo Nghị định 52/2013/NĐ-CP & Nghị định 85/2021/NĐ-CP
          </p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed font-normal">
          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Quyền kiểm tra hàng khi nhận (Đồng kiểm)</span>
            </h2>
            <p>
              Khách hàng hoàn toàn có quyền đồng kiểm tra số lượng món ăn, bao bì và độ nóng của món trước khi thanh toán hoặc ký nhận với shipper. Trường hợp món ăn bị thiếu, sai món hoặc bao bì bị rách vỡ do quá trình vận chuyển, quý khách có quyền từ chối nhận hàng ngay tại chỗ.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <span>2. Chính sách đổi trả & Hoàn tiền</span>
            </h2>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
              <p>
                <strong>Đơn hàng bán lẻ ăn liền:</strong> Do đặc thù thực phẩm nóng chế biến theo suất, nếu chất lượng món không đạt tiêu chuẩn (cháy khét, có mùi lạ, không đúng định lượng), quý khách vui lòng thông báo trong vòng <strong>60 phút</strong> kể từ khi nhận hàng. Nem Núi cam kết đổi mới 1:1 miễn phí hoặc hoàn tiền 100%.
              </p>
              <p>
                <strong>Đơn sỉ nem hút chân không:</strong> Đối tác có quyền yêu cầu đổi trả 1:1 trong vòng <strong>24 giờ</strong> nếu phát hiện rách túi chân không hoặc suy giảm chất lượng trong điều kiện bảo quản đúng hướng dẫn.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>3. Các trường hợp không áp dụng đổi trả</span>
            </h2>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              <li>Quá thời gian quy định tiếp nhận khiếu nại (quá 60 phút đối với đồ ăn nóng, quá 24h đối với hàng đóng gói).</li>
              <li>Sản phẩm bị hỏng do khách hàng bảo quản không đúng chỉ dẫn nhiệt độ (để ngoài môi trường nắng nóng quá lâu).</li>
              <li>Khách hàng thay đổi ý định sau khi đơn hàng đã được giao thành công theo đúng yêu cầu.</li>
            </ul>
          </section>

          <section className="pt-4 border-t border-stone-200">
            <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span>4. Quy trình tiếp nhận & Giải quyết khiếu nại</span>
            </h2>
            <p>
              Quý khách vui lòng gửi hình ảnh hoặc video ngắn phản ánh qua Zalo hoặc gọi ngay đến hotline quản lý để được hỗ trợ tức thì:
            </p>
            <p className="mt-2 font-bold text-orange-600 text-base">
              Hotline giải quyết khiếu nại: {SHOP_CONFIG.displayPhone}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Đơn vị chủ quản: Hộ Kinh Doanh Nem Núi (Chủ hộ: Nguyễn Trường Sơn)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
