"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  onClose: (id: string) => void;
}

export function ToastItem({ id, type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-fade-in transition-all ${
        type === "success"
          ? "bg-emerald-900/90 text-white border-emerald-700/50 backdrop-blur-md"
          : type === "error"
          ? "bg-rose-900/90 text-white border-rose-700/50 backdrop-blur-md"
          : "bg-slate-900/90 text-white border-slate-700/50 backdrop-blur-md"
      }`}
    >
      {type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
      {type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      {type === "info" && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: { id: string; type: "success" | "error" | "info"; message: string }[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-md pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
