"use client";

import React, { useCallback } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { UspGrid } from "@/components/landing/UspGrid";
import { LeadFormSection } from "@/components/landing/LeadFormSection";
import { RetailBanner } from "@/components/landing/RetailBanner";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { StickyMobileBar } from "@/components/landing/StickyMobileBar";

export default function LandingPage() {
  const scrollToForm = useCallback(() => {
    const formElement = document.getElementById("tu-van");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToDeal = useCallback(() => {
    const dealElement = document.getElementById("uu-dai-1k") || document.getElementById("tu-van");
    if (dealElement) {
      dealElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-stone-900 selection:bg-orange-200 selection:text-orange-900 font-sans antialiased">
      {/* 1. Header / Navigation */}
      <LandingHeader onScrollToForm={scrollToForm} />

      {/* Main Content Layout */}
      <main id="main-content">
        {/* 2. Hero Section */}
        <HeroSection onScrollToForm={scrollToForm} onScrollToDeal={scrollToDeal} />

        {/* 3. USP Grid (Lợi thế cạnh tranh bỏ mối) */}
        <UspGrid />

        {/* 4. Trạm Đăng Ký Kit Mẫu Thử & Báo Giá Sỉ (Hợp nhất 2 cột chuyển đổi cao) */}
        <LeadFormSection />

        {/* 5. Quick Retail Banner (Dành cho khách lẻ muốn ăn liền) */}
        <RetailBanner />

        {/* 7. FAQ Accordion (4 câu hỏi thường gặp) */}
        <FaqAccordion />
      </main>

      {/* 8. Footer */}
      <LandingFooter />

      {/* Mobile Sticky Action Bar (chỉ hiện trên Mobile khi cuộn trang) */}
      <StickyMobileBar onScrollToForm={scrollToForm} />
    </div>
  );
}
