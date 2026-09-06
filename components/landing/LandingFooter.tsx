"use client";

import React from "react";
import Image from "next/image";
import { Flame, Phone, MapPin, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-20 sm:pb-16 border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Craft */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-md flex items-center justify-center shrink-0">
                <Image
                  src="/assets/logo-circle-512.png"
                  alt="Logo Nem Núi"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                  Nem Núi
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  Chuyên bán Nem Nướng uy tín sỉ / lẻ
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-amber-200 mb-2">
              {LANDING_CONFIG.brand.tagline}
            </p>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm mb-6 font-normal">
              {LANDING_CONFIG.brand.description}
            </p>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đạt chuẩn An toàn Vệ sinh Thực phẩm</span>
            </div>
          </div>

          {/* Col 2: Thông tin xưởng */}
          <div className="lg:col-span-4 space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-800 pb-2">
              Thông tin liên hệ sỉ
            </h4>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>{LANDING_CONFIG.brand.address}</span>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
              <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-400">Hotline tư vấn sỉ: </span>
                <a
                  href={`tel:${LANDING_CONFIG.brand.hotline}`}
                  className="text-white font-bold hover:text-orange-400 transition-colors"
                >
                  {LANDING_CONFIG.brand.hotlineDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-400">Zalo gửi mẫu thử: </span>
                <a
                  href={LANDING_CONFIG.brand.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-bold hover:underline"
                >
                  {LANDING_CONFIG.brand.hotlineDisplay} (Zalo Nem Núi)
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Thời gian làm việc: {LANDING_CONFIG.brand.operatingHours}</span>
            </div>
          </div>

          {/* Col 3: Chính sách */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-800 pb-2">
              Chính sách đối tác
            </h4>
            <ul className="text-xs sm:text-sm text-stone-400 space-y-2">
              <li>Bao đổi trả trong 24h nếu có lỗi sản phẩm</li>
              <li>Đóng thùng đá gel gửi bến xe các tỉnh</li>
              <li>Chuyển giao công thức nước chấm độc quyền</li>
              <li>Tư vấn cách bảo quản giữ mọng nước 30 ngày</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {currentYear} Nem Núi. Tất cả các quyền được bảo lưu.</p>
          <p className="text-stone-400">Nem Núi - Hương vị đậm đà, kết nối kinh doanh.</p>
        </div>
      </div>
    </footer>
  );
}
