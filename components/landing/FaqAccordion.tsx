"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-stone-50/70 border-b border-stone-200/60 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-muli uppercase text-stone-900 tracking-tight">
            Giải đáp thắc mắc của chủ quán & khách sỉ
          </h2>
          <p className="mt-2.5 text-base text-stone-600 leading-relaxed font-normal">
            Thông tin chi tiết về vận chuyển gửi tỉnh, kit mẫu thử và chính sách chiết khấu tận xưởng.
          </p>
        </div>

        <div className="space-y-3">
          {LANDING_CONFIG.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-5 sm:px-6 py-4 min-h-[52px] flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="text-base font-bold text-stone-900 flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-stone-400">0{index + 1}</span>
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-stone-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-stone-900" : ""
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
                    <p className="bg-stone-50 p-4 rounded-xl text-stone-700">
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
