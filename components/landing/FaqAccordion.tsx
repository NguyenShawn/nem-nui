"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

const FAQ_TOPICS = ["Vận chuyển gửi tỉnh", "Kit Mẫu Thử", "Chiết khấu & Đổi trả", "Công thức sốt"];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-stone-50/70 border-b border-stone-200/60 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200/80 mb-3">
            <span className="uppercase tracking-wider text-[11px]">Hỏi Đáp Nhanh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-muli uppercase text-stone-900 tracking-tight">
            Giải đáp thắc mắc của chủ quán & khách sỉ
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Thông tin chi tiết về vận chuyển gửi tỉnh, kit mẫu thử và chính sách chiết khấu tận xưởng.
          </p>
        </div>

        <div className="space-y-3">
          {LANDING_CONFIG.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const topic = FAQ_TOPICS[index] || `Hỏi đáp ${index + 1}`;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-5 sm:px-6 py-4 min-h-[56px] flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 group"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200/70 shrink-0">
                      {topic}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-orange-900 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-stone-400 group-hover:text-stone-700 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-orange-600" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-5 sm:px-6 pb-5 pt-1 text-sm sm:text-base text-stone-600 leading-relaxed border-t border-stone-100 font-normal"
                  >
                    <p className="bg-stone-50/80 p-4 rounded-xl text-stone-700 leading-relaxed border border-stone-100">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
