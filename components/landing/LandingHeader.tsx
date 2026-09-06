"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Flame, Menu, X, ShoppingBag, ArrowUpRight } from "lucide-react";
import { LANDING_CONFIG, RETAIL_ORDER_URL } from "@/config/landing";

interface LandingHeaderProps {
  onScrollToForm: () => void;
}

export function LandingHeader({ onScrollToForm }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Ưu điểm sỉ", href: "#uu-diem" },
    { label: "Bảng giá", href: "#bang-gia" },
    { label: "Mẫu thử & Sỉ", href: "#uu-dai-1k" },
    { label: "Hỏi đáp", href: "#faq" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (href === "#bang-gia") {
      onScrollToForm();
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FFFBEB]/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-2"
          : "bg-[#FFFBEB] py-2.5 sm:py-3"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo - Rõ nét, kích thước chuẩn huy hiệu tròn */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded-xl"
            aria-label="Nem Núi - Trang Chủ"
          >
            <div className="relative w-[50px] h-[50px] sm:w-[58px] sm:h-[58px] shrink-0 group-hover:scale-105 transition-transform duration-200 drop-shadow-sm flex items-center justify-center">
              <Image
                src="/assets/logo-circle-512.png"
                alt="Logo thương hiệu Nem Núi"
                width={58}
                height={58}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 leading-none">
                Nem Núi
              </span>
              <span className="text-[11px] text-stone-500 font-medium hidden sm:inline mt-1 leading-none">
                Chuyên bán Nem Nướng uy tín sỉ / lẻ
              </span>
            </div>
          </a>

          {/* Desktop Nav Links (Single Line, Restrained) */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Điều hướng">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Secondary: Đặt Lẻ */}
            <a
              href={RETAIL_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all min-h-[40px]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Đặt lẻ ăn ngay</span>
            </a>

            {/* Primary: Báo Giá Sỉ */}
            <button
              onClick={onScrollToForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl transition-all shadow-xs min-h-[40px]"
            >
              <span>Lấy báo giá sỉ</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={RETAIL_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              Đặt lẻ
            </a>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center text-stone-700 hover:text-stone-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-[#FFFBEB] px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2 text-sm font-semibold text-stone-800"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-stone-200 space-y-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onScrollToForm();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm"
            >
              <span>Lấy báo giá sỉ từ 100 cây</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
