"use client";

import React from "react";
import { Phone, Clock, MapPin, AlertTriangle, Sparkles } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";

interface HeaderProps {
  isOpen: boolean;
  statusMessage: string;
}

export function Header({ isOpen, statusMessage }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-orange-100 shadow-sm">
      {/* Banner cảnh báo khi quán ngoài giờ mở cửa */}
      {!isOpen && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-100 animate-pulse" />
          <span>
            {statusMessage}. Quý khách vẫn có thể xem menu nhưng chức năng đặt món tạm khóa.
          </span>
        </div>
      )}

      {/* Main Header Content */}
      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Shop branding */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <Sparkles className="w-3 h-3" /> QUÁN GIA TRUYỀN
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isOpen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpen ? "bg-emerald-500 animate-ping" : "bg-rose-500"
                  }`}
                />
                {isOpen ? "Đang nhận đơn" : "Tạm đóng cửa"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {SHOP_CONFIG.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {SHOP_CONFIG.slogan}
            </p>

            {/* Address & Hours info */}
            <div className="flex flex-col gap-1 pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{SHOP_CONFIG.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{SHOP_CONFIG.openingHours.daysNote}</span>
              </div>
            </div>
          </div>

          {/* Quick Call Action Button */}
          <div className="flex items-center gap-2 sm:self-center">
            <a
              href={`tel:${SHOP_CONFIG.phone}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              title="Gọi hotline đặt món"
            >
              <Phone className="w-4 h-4 animate-bounce" />
              <span>Gọi hotline: {SHOP_CONFIG.displayPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
