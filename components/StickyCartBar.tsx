"use client";

import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StickyCartBarProps {
  totalItems: number;
  subtotal: number;
  onOpenCart: () => void;
  isShopOpen: boolean;
}

export function StickyCartBar({
  totalItems,
  subtotal,
  onOpenCart,
  isShopOpen,
}: StickyCartBarProps) {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-30 px-3 sm:px-4 max-w-lg mx-auto pointer-events-none">
      <button
        onClick={onOpenCart}
        className="w-full pointer-events-auto bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-size-200 hover:bg-pos-100 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between gap-3 transform active:scale-[0.98] transition-all duration-200 border border-orange-400/30"
      >
        <div className="flex items-center gap-3">
          <div className="relative bg-white/20 p-2 rounded-xl backdrop-blur-xs">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-orange-600">
              {totalItems}
            </span>
          </div>

          <div className="text-left">
            <div className="text-[11px] text-orange-100 font-medium leading-none">
              {totalItems} món đã chọn
            </div>
            <div className="text-base sm:text-lg font-black leading-tight tracking-tight">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white text-orange-700 text-xs sm:text-sm font-black px-3.5 py-2 rounded-xl shadow-sm">
          <span>Xem giỏ hàng</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
