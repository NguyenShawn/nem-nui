"use client";

import React from "react";
import { Category } from "@/data/menu";

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  itemCounts: Record<string, number>;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
  itemCounts,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-2 px-4">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = itemCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20 scale-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 active:scale-95"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
