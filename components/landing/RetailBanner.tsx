"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { RETAIL_ORDER_URL } from "@/config/landing";

export function RetailBanner() {
  return (
    <section className="py-12 sm:py-16 bg-emerald-950 text-white border-b border-emerald-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900/90 rounded-3xl p-6 sm:p-8 border border-emerald-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Text */}
          <div className="md:col-span-6 lg:col-span-7 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1">
              Dành cho khách ăn liền & gia đình
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2">
              Bạn muốn ăn liền hôm nay? Không cần đợi sỉ!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 font-normal leading-relaxed mb-4">
              Đặt ngay nem nướng cuộn bánh tráng, bún nem nướng nóng giòn hoặc xiên lẻ kèm nước chấm
              mắm kẹo tỏi ớt đặc biệt, giao tận nơi trong 30-45 phút.
            </p>
            <a
              href={RETAIL_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm sm:text-base font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-stone-900" />
              <span>Thực đơn đặt lẻ giao ngay</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right Dish Visual: image4.jpg */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[320px] aspect-4/3 rounded-2xl overflow-hidden border border-emerald-700/80 shadow-md">
              <Image
                src="/assets/image2.jpg"
                alt="Suất nem nướng nóng hổi xém cạnh rắc đậu phộng thơm bùi"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
