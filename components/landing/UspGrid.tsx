"use client";

import React from "react";
import Image from "next/image";
import {
  Boxes,
  Flame,
  TrendingUp,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  DollarSign,
  PackageCheck,
  Clock3,
} from "lucide-react";

export function UspGrid() {
  return (
    <section id="uu-diem" className="py-16 sm:py-24 bg-stone-50/70 border-b border-stone-200/60 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-100/90 border border-orange-200/80 mb-3.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Lợi thế cạnh tranh • Đối tác F&B</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-muli uppercase text-stone-900 tracking-tight leading-snug">
            Bốn lợi thế giúp quán của bạn giữ khách và tăng lợi nhuận
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Giải quyết triệt để bài toán vốn nhập hàng, chất lượng sản phẩm đồng đều và tốc độ giao nhận.
          </p>
        </div>

        {/* Bento Grid: 12-Column Asymmetrical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-7">
          
          {/* ========================================================================= */}
          {/* CARD 1: HERO VISUAL (7 Columns on Desktop) - CÔNG THỨC ĐỘC QUYỀN */}
          {/* ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/85 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Meta: Icon + Subhead Pill */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-600" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/80 shadow-2xs">
                  ★ Vị Mật Mía Gia Truyền
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 leading-snug group-hover:text-orange-600 transition-colors">
                Thịt nạc vai mỡ tảng 8:2, nướng than hoa xém cạnh
              </h3>

              {/* Scannable Micro-copy Bullets */}
              <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Tỷ lệ nạc mỡ 8:2 chuẩn vị:</strong> Cắn ngập răng đượm vị thịt, giữ trọn độ ẩm mọng nước, không khô xác kể cả khi nguội.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Ướp mật mía & nướng than hoa:</strong> Thơm nức mũi, xém cạnh óng ả đặc trưng, không dùng phẩm màu độc hại.
                  </span>
                </li>
              </ul>

              {/* Real High-Impact Food Visual */}
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-2xs aspect-[16/9] mb-4 bg-stone-900">
                <Image
                  src="/assets/image6.jpg"
                  alt="Cận cảnh thớ thịt nem nướng than hoa xém cạnh óng ả mọng nước tỷ lệ nạc mỡ 8:2"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 650px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white bg-stone-900/85 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 shadow-xs">
                    Cận cảnh thớ thịt 8:2 • Xém than hoa nóng hổi
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Bao đổi trả 1:1 tận quán nếu nem khô xơ</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: MINI UI WIDGET (5 Columns on Desktop) - BIÊN LÃI & CÔNG THỨC SỐT */}
          {/* ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/85 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Meta: Icon + Subhead Pill */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 shadow-2xs">
                  Biên Lãi 60 - 65%
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 leading-snug group-hover:text-emerald-700 transition-colors">
                Tặng công thức sốt & Biên lãi vượt trội
              </h3>

              {/* Scannable Micro-copy Bullets */}
              <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Tặng 2 công thức sốt độc quyền:</strong> Tương đậu phộng mè rang béo bùi và mắm kẹo mật mía chuẩn vị.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Tư vấn định lượng cost:</strong> Giúp quán tính chuẩn giá vốn từng mẹt/suất, giữ chắc biên lợi nhuận.
                  </span>
                </li>
              </ul>

              {/* MINI UI WIDGET: Bảng tính kinh doanh mô phỏng */}
              <div className="bg-gradient-to-br from-stone-50 to-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-200/60 shadow-inner mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-3 pb-2 border-b border-stone-200/60">
                  <span>Mô phỏng 1 suất nem (4 que):</span>
                  <span className="text-emerald-700 font-bold font-mono">LÃI RÒNG ~62%</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">Giá vốn nem & rau sốt:</span>
                    <span className="font-mono font-bold text-stone-800">~14.500đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">Giá bán ra thông thường:</span>
                    <span className="font-mono font-bold text-stone-900">38.000đ – 45.000đ</span>
                  </div>
                  
                  {/* Visual Progress Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-emerald-800 mb-1">
                      <span>Biên lợi nhuận gộp</span>
                      <span>60% – 65%</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full w-[65%] transition-all duration-1000" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Hỗ trợ setup menu & bảng giá cho quán mới</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: MINI UI WIDGET (6 Columns on Desktop) - SỈ LINH HOẠT TỪ 100 CÂY */}
          {/* ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/85 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Meta: Icon + Subhead Pill */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Boxes className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100/90 text-orange-900 border border-orange-300/80 shadow-2xs">
                  Vốn Khởi Điểm Nhẹ
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 leading-snug group-hover:text-orange-600 transition-colors">
                Nhập sỉ từ 100 cây – Không áp lực tồn kho
              </h3>

              {/* Scannable Micro-copy Bullets */}
              <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Vốn khởi đầu chỉ vài trăm nghìn:</strong> Thử nghiệm món mới cực kỳ an toàn, không lo đọng vốn hay rủi ro bán chậm.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Không ép doanh số theo tháng:</strong> Quán lấy hàng linh hoạt theo lượng khách mỗi ngày, bán đến đâu nhập đến đó.
                  </span>
                </li>
              </ul>

              {/* MINI UI WIDGET: Nhãn Seal Cam Kết & Thông Số */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 mb-4 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 shadow-2xs">
                  <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Tối thiểu</span>
                  <span className="text-sm sm:text-base font-extrabold text-orange-700 font-mono">100 Cây</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">Khởi điểm sỉ</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 shadow-2xs">
                  <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Doanh số</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">0 Áp Lực</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">Lấy theo ngày</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 shadow-2xs">
                  <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Cam kết</span>
                  <span className="text-sm sm:text-base font-extrabold text-blue-700 font-mono">Đổi 1:1</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">Bảo hành vị</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-orange-600" />
                <span>Phù hợp cho xe ăn vặt, tiệm trà sữa, quán bún</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: MINI UI WIDGET (6 Columns on Desktop) - LOGISTICS & GIAO TỈNH */}
          {/* ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/85 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Meta: Icon + Subhead Pill */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100/90 text-blue-900 border border-blue-300/80 shadow-2xs">
                  Logistics Chuẩn Lạnh
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 leading-snug group-hover:text-blue-700 transition-colors">
                Giao nhanh 2h & Đóng đá gel gửi xe liên tỉnh
              </h3>

              {/* Scannable Micro-copy Bullets */}
              <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Hỏa tốc nội thành TP.HCM (2H):</strong> Giao liền tay nóng hổi hoặc cấp đông bảo quản trong ngày.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Đóng đá gel gửi tỉnh (24–36H):</strong> Thùng xốp giữ nhiệt tiêu chuẩn, bảo đảm nem đến nơi nguyên vị tươi ngon.
                  </span>
                </li>
              </ul>

              {/* MINI UI WIDGET: Logistics Pipeline Step Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/70 mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-3">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>Quy trình vận hành lạnh khép kín:</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-mono font-bold">
                    CHUẨN VSATTP
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                    <span className="block text-[10px] text-stone-400 font-mono font-bold">BƯỚC 1</span>
                    <span className="text-xs font-bold text-stone-800">Hút Chân Không</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5">Sạch khuẩn 100%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                    <span className="block text-[10px] text-stone-400 font-mono font-bold">BƯỚC 2</span>
                    <span className="text-xs font-bold text-stone-800">Đá Gel Giữ Nhiệt</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5">Thùng xốp âm sâu</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                    <span className="block text-[10px] text-stone-400 font-mono font-bold">BƯỚC 3</span>
                    <span className="text-xs font-bold text-stone-800">Gửi Xe / Hỏa Tốc</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5">Giao tận tay quán</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Gửi chành xe miền Tây, miền Đông, Tây Nguyên</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

