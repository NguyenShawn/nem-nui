"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, Copy, QrCode, ArrowRight, ShieldCheck } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";
import { formatCurrency, getMomoQrUrl } from "@/lib/utils";

interface MomoPaymentModalProps {
  isOpen: boolean;
  orderCode: string;
  total: number;
  onPaidConfirmed: () => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function MomoPaymentModal({
  isOpen,
  orderCode,
  total,
  onPaidConfirmed,
  showToast,
}: MomoPaymentModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmClick = async () => {
    setIsConfirming(true);
    try {
      await fetch("/api/order/confirm-momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode }),
      });
    } catch (e) {
      console.warn("Lỗi gửi confirm momo:", e);
    } finally {
      setIsConfirming(false);
      onPaidConfirmed();
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: "code" | "phone") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast("success", "Đã sao chép mã đơn hàng!");
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      showToast("success", "Đã sao chép số điện thoại MoMo!");
    }
  };

  const dynamicQrUrl = getMomoQrUrl(orderCode, total);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-fade-in" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-5 text-center bg-gradient-to-br from-pink-600 to-rose-700 text-white relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <QrCode className="w-3.5 h-3.5" /> Thanh toán MoMo
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Quét mã QR để thanh toán
            </h3>
            <p className="text-pink-100 text-xs mt-1">
              Đơn hàng của bạn đã được ghi nhận trên hệ thống
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Mã đơn hàng nổi bật */}
            <div className="bg-pink-50/80 border-2 border-pink-200 rounded-2xl p-3.5 text-center">
              <div className="text-xs text-pink-700 font-bold uppercase tracking-wider">
                MÃ ĐƠN HÀNG CỦA BẠN
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-mono text-3xl font-black text-pink-900 tracking-wider">
                  {orderCode}
                </span>
                <button
                  onClick={() => copyToClipboard(orderCode, "code")}
                  className="p-1.5 bg-white hover:bg-pink-100 text-pink-700 rounded-lg border border-pink-200 transition-colors shadow-xs"
                  title="Sao chép mã"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-pink-700 mt-1 font-medium">
                (Vui lòng ghi đúng mã này vào phần <strong>Lời nhắn / Lời chúc</strong>)
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                <Image
                  src={imageError ? SHOP_CONFIG.momo.qrImage : dynamicQrUrl}
                  alt={`QR MoMo đơn ${orderCode}`}
                  fill
                  className="object-contain p-2"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="w-full mt-3 space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span>Số tiền cần chuyển:</span>
                  <span className="font-black text-rose-600 text-base">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Người nhận:</span>
                  <span className="font-bold text-slate-900">
                    {SHOP_CONFIG.momo.accountName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SĐT MoMo:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>{SHOP_CONFIG.momo.phone}</span>
                    <button
                      onClick={() => copyToClipboard(SHOP_CONFIG.momo.phone, "phone")}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {copiedPhone ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-pink-700 bg-pink-50 p-2 rounded-xl border border-pink-200">
                  <span className="font-semibold">Nội dung CK:</span>
                  <span className="font-mono font-black text-sm">{orderCode}</span>
                </div>
              </div>
            </div>

            {/* Hướng dẫn nhanh */}
            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl">
              <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Các bước thanh toán:
              </div>
              <p>1. Mở App MoMo hoặc ứng dụng Ngân hàng quét mã QR.</p>
              <p>2. Kiểm tra số tiền <strong>{formatCurrency(total)}</strong> và ghi nội dung <strong>{orderCode}</strong>.</p>
              <p>3. Bấm nút bên dưới sau khi chuyển tiền hoàn tất.</p>
            </div>

            {/* Nút Tôi đã chuyển tiền */}
            <button
              onClick={handleConfirmClick}
              disabled={isConfirming}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-70 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isConfirming ? (
                <span>Đang gửi thông báo đến bếp...</span>
              ) : (
                <>
                  <span>Tôi đã chuyển tiền thành công</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
