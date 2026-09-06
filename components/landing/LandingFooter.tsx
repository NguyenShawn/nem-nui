"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Phone, MapPin, Clock, MessageSquare, ShieldCheck, FileCheck2, Scale } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-20 sm:pb-16 border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Craft (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-start">
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
                  Chuyên Nem Nướng sỉ tận gốc & lẻ giao nóng
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
              <span>Đạt chuẩn An toàn Vệ sinh Thực phẩm (VSATTP)</span>
            </div>
          </div>

          {/* Col 2: Legal Disclosures per Decree 52/2013 & 85/2021 (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Thông tin chủ quản & Đăng ký kinh doanh</span>
            </h4>

            <div className="space-y-2 text-xs sm:text-sm text-stone-300">
              <div>
                <span className="text-stone-400">Tên đơn vị: </span>
                <strong className="text-white">Hộ Kinh Doanh Nem Núi</strong>{" "}
                <span className="text-stone-400">(Chủ hộ: Nguyễn Trường Sơn)</span>
              </div>

              <div>
                <span className="text-stone-400">Mã số thuế (MST): </span>
                <strong className="text-white">8492048291</strong>{" "}
                <span className="text-stone-400">do Chi cục Thuế Huyện Bình Chánh cấp ngày 15/03/2024</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400">Địa chỉ đăng ký & xưởng: </span>
                  <span className="text-stone-200">{LANDING_CONFIG.brand.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400">Hotline hỗ trợ & khiếu nại: </span>
                  <a
                    href={`tel:${LANDING_CONFIG.brand.hotline}`}
                    className="text-white font-bold hover:text-orange-400 transition-colors"
                  >
                    {LANDING_CONFIG.brand.hotlineDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400">Zalo đặt hàng & tư vấn sỉ: </span>
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

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400">Thời gian hoạt động: </span>
                  <span className="text-stone-200">{LANDING_CONFIG.brand.operatingHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: E-Commerce Mandatory Policies per Decree 52/85 (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-orange-400" />
              <span>Chính sách TMĐT</span>
            </h4>

            <ul className="text-xs sm:text-sm space-y-2.5 font-normal">
              <li>
                <Link
                  href="/chinh-sach-giao-hang"
                  className="text-stone-300 hover:text-orange-400 transition-colors block underline-offset-2 hover:underline"
                >
                  Chính sách giao hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/chinh-sach-doi-tra"
                  className="text-stone-300 hover:text-orange-400 transition-colors block underline-offset-2 hover:underline"
                >
                  Chính sách kiểm hàng & đổi trả
                </Link>
              </li>
              <li>
                <Link
                  href="/chinh-sach-bao-mat"
                  className="text-stone-300 hover:text-orange-400 transition-colors block underline-offset-2 hover:underline"
                >
                  Chính sách bảo vệ dữ liệu cá nhân
                </Link>
              </li>
            </ul>

            <div className="pt-3 border-t border-stone-800">
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Website TMĐT bán hàng tuân thủ quy định tại{" "}
                <strong className="text-stone-400">Nghị định 52/2013/NĐ-CP</strong> và{" "}
                <strong className="text-stone-400">Nghị định 85/2021/NĐ-CP</strong> của Chính phủ.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {currentYear} Hộ Kinh Doanh Nem Núi. Tất cả các quyền được bảo lưu.</p>
          <p className="text-stone-400 text-center sm:text-right">
            Nem Núi - Hương vị đậm đà, kết nối kinh doanh • MST: 8492048291
          </p>
        </div>
      </div>
    </footer>
  );
}
