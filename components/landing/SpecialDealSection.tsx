"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, ArrowRight, Check } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

interface SpecialDealSectionProps {
  onClaimDeal: () => void;
}

export function SpecialDealSection({ onClaimDeal }: SpecialDealSectionProps) {
  const deal = LANDING_CONFIG.specialDeal;

  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 2, hours: 14, minutes: 35, seconds: 42 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="uu-dai-1k" className="py-16 sm:py-20 bg-[#FFFBEB] border-b border-stone-200/60 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-stone-800 px-3 py-1 rounded-md mb-4 border border-stone-700">
                Chính sách đối tác sỉ
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold font-muli uppercase text-white tracking-normal mb-3">
                Đăng ký nhận Kit Mẫu Thử & Báo giá sỉ tận gốc.
              </h2>

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed mb-6 font-normal">
                Nhằm đồng hành cùng các chủ quán mới mở, xưởng Nem Núi gửi tặng trực tiếp Kit Mẫu Thử
                nướng than hoa kèm hũ sốt chấm bí truyền để bạn nếm thử độ ẩm mọng nước và chất lượng thịt nạc vai 8:2
                trước khi quyết định nhập số lượng lớn.
              </p>

              {/* 2 Sample Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-7">
                <div className="bg-stone-800/90 rounded-xl p-4 border border-stone-700">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Mẫu thử 01</span>
                    <span className="text-emerald-400 font-semibold">Miễn phí</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Kit nem nướng than hoa (3 cây)</p>
                  <p className="text-xs text-stone-400">Chuẩn 60g/cây, hút chân không sạch sẽ</p>
                  <div className="mt-3 pt-2 border-t border-stone-700 flex items-center justify-between">
                    <span className="text-xs text-stone-400">Quy cách:</span>
                    <span className="text-xs font-bold text-amber-400">Nướng sẵn giao nóng / Lạnh</span>
                  </div>
                </div>

                <div className="bg-stone-800/90 rounded-xl p-4 border border-stone-700">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Mẫu thử 02</span>
                    <span className="text-emerald-400 font-semibold">Tặng kèm</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Hũ sốt tương đậu bí truyền</p>
                  <p className="text-xs text-stone-400">Pha sẵn chuẩn vị mè rang béo bùi</p>
                  <div className="mt-3 pt-2 border-t border-stone-700 flex items-center justify-between">
                    <span className="text-xs text-stone-400">Kèm theo:</span>
                    <span className="text-xs font-bold text-amber-400">Cẩm nang công thức pha</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClaimDeal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[46px] text-sm sm:text-base font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all shadow-xs"
              >
                <span>Đăng ký nhận Kit Mẫu Thử & Báo giá</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Card: Combo Photo & Countdown */}
            <div className="lg:col-span-5 bg-stone-800 rounded-2xl p-6 border border-stone-700">
              {/* Photo: Real Combo Tray with Nem, Bánh Tráng & Sốt */}
              <div className="relative rounded-xl overflow-hidden border border-stone-700 shadow-sm aspect-[16/9] mb-5">
                <Image
                  src="/assets/image5.png"
                  alt="Mẹt nem nướng 3 cây nướng than hoa vàng rộm kèm bún tươi, bánh tráng và chén sốt đậu"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>

              <div className="flex items-center justify-between pb-3 mb-5 border-b border-stone-700 text-xs font-semibold text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Suất mẫu thử miễn phí tuần
                </span>
                <span className="text-amber-400 font-bold">Còn {deal.remainingSlots} / 50 suất</span>
              </div>

              {/* Clean Digits */}
              <div className="grid grid-cols-4 gap-2 text-center mb-6 font-mono">
                <div className="bg-stone-900/90 rounded-xl p-3 border border-stone-700/80">
                  <span className="block text-2xl font-black text-white">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-sans">Ngày</span>
                </div>
                <div className="bg-stone-900/90 rounded-xl p-3 border border-stone-700/80">
                  <span className="block text-2xl font-black text-white">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-sans">Giờ</span>
                </div>
                <div className="bg-stone-900/90 rounded-xl p-3 border border-stone-700/80">
                  <span className="block text-2xl font-black text-white">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-sans">Phút</span>
                </div>
                <div className="bg-stone-900/90 rounded-xl p-3 border border-amber-400/40">
                  <span className="block text-2xl font-black text-amber-400">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-amber-400 uppercase font-sans">Giây</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2 text-xs text-stone-400">
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dành riêng cho chủ quán ăn, xe ăn vặt, tiệm trà sữa.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tặng kèm công thức pha sốt tương đậu & mắm kẹo độc quyền.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hỗ trợ tư vấn định lượng cost và menu quán mới mở.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
