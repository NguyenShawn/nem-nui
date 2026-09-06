"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Minus, Flame, Check } from "lucide-react";
import { MenuItem } from "@/data/menu";
import { formatCurrency } from "@/lib/utils";

interface FoodCardProps {
  item: MenuItem;
  inCartQty: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQty?: (id: string, delta: number) => void;
  isShopOpen: boolean;
}

export function FoodCard({
  item,
  inCartQty,
  onAddToCart,
  onUpdateQty,
  isShopOpen,
}: FoodCardProps) {
  const [imageError, setImageError] = useState(false);
  const isAvailable = item.available && isShopOpen;

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-orange-100/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        !item.available ? "opacity-60 bg-slate-50" : ""
      }`}
    >
      {/* Food Image Container */}
      <div className="relative w-full aspect-[4/3] bg-amber-50 overflow-hidden">
        <Image
          src={
            imageError
              ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
              : item.image
          }
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            !item.available ? "grayscale" : ""
          }`}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Best Seller Badge */}
        {item.isBestSeller && item.available && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 fill-current" /> Bán chạy
          </div>
        )}

        {/* Unavailable overlay badge */}
        {!item.available && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wide">
              Hết món
            </span>
          </div>
        )}
      </div>

      {/* Food Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Giá bán</span>
            <span className="text-base sm:text-lg font-black text-orange-600">
              {formatCurrency(item.price)}
            </span>
          </div>

          <div>
            {!item.available ? (
              <button
                disabled
                className="px-3 py-1.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Hết hàng
              </button>
            ) : !isShopOpen ? (
              <button
                disabled
                className="px-3 py-1.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Tạm đóng
              </button>
            ) : inCartQty > 0 && onUpdateQty ? (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl p-1">
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-orange-100 text-orange-700 rounded-lg shadow-xs font-bold active:scale-95 transition-all"
                  aria-label="Giảm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center font-bold text-xs sm:text-sm text-orange-900">
                  {inCartQty}
                </span>
                <button
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs font-bold active:scale-95 transition-all"
                  aria-label="Tăng"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(item)}
                className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
