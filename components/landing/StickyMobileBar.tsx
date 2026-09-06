"use client";

import React, { useState, useEffect } from "react";
import { PhoneCall, Flame, ShoppingBag } from "lucide-react";
import { LANDING_CONFIG, RETAIL_ORDER_URL } from "@/config/landing";

interface StickyMobileBarProps {
  onScrollToForm: () => void;
}

export function StickyMobileBar({ onScrollToForm }: StickyMobileBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-2.5 px-4 shadow-lg">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <a
          href={`tel:${LANDING_CONFIG.brand.hotline}`}
          className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 shrink-0 transition-colors"
          aria-label="Gọi điện thoại tư vấn"
        >
          <PhoneCall className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">Gọi sỉ</span>
        </a>

        <a
          href={RETAIL_ORDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 transition-colors"
          aria-label="Đặt lẻ giao liền"
        >
          <ShoppingBag className="w-4 h-4 mb-0.5 text-emerald-700" />
          <span className="text-[9px] font-bold">Đặt lẻ</span>
        </a>

        <button
          type="button"
          onClick={onScrollToForm}
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-xs active:bg-orange-700 transition-all"
        >
          <Flame className="w-4 h-4 fill-white/80" />
          <span>Lấy báo giá sỉ từ 100 cây</span>
        </button>
      </div>
    </div>
  );
}
