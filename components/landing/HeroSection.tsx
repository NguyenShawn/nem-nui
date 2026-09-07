"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Flame, ShoppingBag, ArrowUpRight, ShieldCheck, Truck, Check } from "lucide-react";
import { RETAIL_ORDER_URL } from "@/config/landing";

interface HeroSectionProps {
  onScrollToForm: () => void;
  onScrollToDeal: () => void;
}

export function HeroSection({ onScrollToForm, onScrollToDeal }: HeroSectionProps) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowVideo((prev) => !prev);
    }, 60000); // Tự động chuyển đổi sau mỗi 1 phút
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 bg-[#FFFBEB] border-b border-stone-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Hero Text Stack (Balanced & Harmonious) */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center">
            {/* 1. Restrained Announcement Pill */}
            <button
              onClick={onScrollToDeal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 hover:bg-orange-100 text-orange-950 border border-orange-200 transition-all text-xs font-semibold mb-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 shadow-2xs group"
            >
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse shrink-0" />
              <span className="font-bold text-orange-800 uppercase tracking-wider text-[11px]">Chính sách đối tác:</span>
              <span className="text-stone-700 group-hover:text-stone-900 transition-colors">
                Nhận Kit Mẫu Thử & Báo giá sỉ trực tiếp
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </button>

            {/* 2. Headline (Balanced 2-Line Flow, No Orphan Words) */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-[2.7rem] font-bold text-stone-900 tracking-tight leading-[1.22] mb-5 [text-wrap:balance] font-muli uppercase">
              Nem nướng mật nóng hổi,
              <span className="block text-orange-700 mt-1">nguồn sỉ tận gốc chỉ từ 100 cây.</span>
            </h1>

            {/* 3. Subtext (Concise, Under 25 Words) */}
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed mb-7 max-w-xl font-normal">
              Thịt <strong className="text-stone-900 font-bold">nạc vai mỡ tảng 8:2</strong> nướng xém cạnh, mềm mọng nước không khô xác. <strong className="text-stone-900 font-bold">Bao đổi trả tận nơi 1:1</strong>, hỗ trợ công thức nước chấm độc quyền cho quán ăn và tiệc nhỏ.
            </p>

            {/* 4. Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Primary CTA */}
              <button
                onClick={onScrollToForm}
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-orange-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
              >
                <Flame className="w-4 h-4 fill-white text-white shrink-0" />
                <span className="whitespace-nowrap">Lấy báo giá sỉ & Mẫu thử</span>
                <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </button>

              {/* Secondary CTA */}
              <a
                href={RETAIL_ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 rounded-xl transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 shadow-2xs"
              >
                <ShoppingBag className="w-4 h-4 text-stone-500 group-hover:text-orange-600 transition-colors shrink-0" />
                <span className="whitespace-nowrap">Đặt lẻ ăn ngay</span>
              </a>
            </div>

            {/* Micro-trust indicators */}
            <div className="mt-5 flex items-center flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
                <span>Mẫu thử tận nơi</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
                <span>Không ép sản lượng</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
                <span>Bao đổi trả 1:1</span>
              </span>
            </div>
          </div>

          {/* Right Column: Balanced Food Visual */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-lg aspect-[4/4.2] max-h-[460px]">
              <Image
                src="/assets/image1.jpg"
                alt="Bàn tiệc nem nướng mọng mật cuốn bánh tráng rau sống thơm ngon Nem Núi"
                fill
                className={`object-cover transition-opacity duration-1000 ${
                  showVideo ? "opacity-0" : "opacity-100"
                }`}
                sizes="(max-width: 768px) 100vw, 480px"
                priority
              />
              <video
                src="/assets/nem-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  showVideo ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />
              {/* Subtle visual badge overlay */}
              <div className="absolute bottom-3 left-3 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-white font-semibold flex items-center gap-2 border border-white/10 shadow-sm pointer-events-none">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />
                <span>Nạc mỡ 8:2 • Nướng than hoa</span>
              </div>
            </div>
            {/* Clean, Honest Caption */}
            <p className="mt-3 text-xs text-stone-500 text-center font-medium flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span>Giao nóng than hoa trong 2h hoặc cấp đông sâu 30 ngày</span>
            </p>
          </div>
        </div>

        {/* Social Proof Strip - Balanced Grid Layout */}
        <div className="mt-10 pt-7 border-t border-stone-200/70 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <p className="lg:col-span-5 font-semibold text-xs sm:text-sm text-stone-800">
            Đồng hành cùng 500+ quán ăn, tiệm bún và xe ăn vặt tại TP.HCM & miền Nam
          </p>
          <div className="lg:col-span-7 flex flex-wrap items-center lg:justify-end gap-3 sm:gap-4 text-xs sm:text-sm text-stone-700 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-white/70 border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
              <span>Nạc mỡ 8:2 mọng nước</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/70 border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Bao đổi trả nếu không ưng ý</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/70 border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
              <Truck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Đóng đá gel gửi xe liên tỉnh</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
