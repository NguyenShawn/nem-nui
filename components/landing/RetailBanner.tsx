"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { RETAIL_ORDER_URL } from "@/config/landing";

export function RetailBanner() {
  return (
    <section className="py-12 sm:py-16 bg-[#16291e] text-white border-b border-emerald-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900/90 via-[#183324] to-stone-900/95 rounded-3xl p-6 sm:p-8 border border-emerald-700/50 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Text */}
          <div className="md:col-span-6 lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 mb-3">
              <span className="uppercase tracking-wider text-[11px]">Dành cho khách lẻ & gia đình</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-muli uppercase text-white leading-snug mb-2.5 tracking-wide">
              Bạn muốn ăn liền hôm nay? Không cần đợi sỉ!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed mb-5">
              Đặt ngay <strong className="text-white font-bold">nem nướng cuộn bánh tráng</strong>, <strong className="text-white font-bold">bún nem nóng giòn</strong> hoặc xiên nướng than kèm nước chấm mắm kẹo đặc biệt, <strong className="text-amber-300 font-bold">giao tận nơi trong 30-45 phút</strong>.
            </p>
            <a
              href={RETAIL_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm sm:text-base font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-amber-400/20"
            >
              <ShoppingBag className="w-4 h-4 text-stone-950 shrink-0" />
              <span>Thực đơn đặt lẻ giao ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>
          </div>

          {/* Right Dish Visual: image2.jpg */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[320px] aspect-4/3 rounded-2xl overflow-hidden border border-emerald-600/40 shadow-lg group">
              <Image
                src="/assets/image2.jpg"
                alt="Suất nem nướng nóng hổi xém cạnh rắc đậu phộng thơm bùi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 320px"
              />
              <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-amber-300 font-semibold border border-white/10">
                Giao nóng 30 - 45 phút
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
