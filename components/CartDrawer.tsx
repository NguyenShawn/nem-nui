"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { CartItem } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  isShopOpen: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  isShopOpen,
}: CartDrawerProps) {
  // Ngăn cuộn trang khi mở drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = SHOP_CONFIG.shippingFee;
  const grandTotal = subtotal > 0 ? subtotal + shippingFee : 0;
  const hasSampleKit = cart.some((item) => item.id === "kit-nem-mau-thu");
  const effectiveMinOrder = hasSampleKit ? 25000 : SHOP_CONFIG.minOrderAmount;
  const isMinOrderMet = subtotal >= effectiveMinOrder;
  const remainingForMinOrder = effectiveMinOrder - subtotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 text-white p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-base sm:text-lg">
                  Giỏ hàng của bạn
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {totalItems} món đã chọn
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Xóa hết
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <p className="text-slate-700 font-bold text-base">
                  Giỏ hàng đang trống
                </p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Hãy chọn những món nem nướng, bún và đồ uống thơm ngon từ thực đơn để tiếp tục.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-orange-700 active:scale-95 transition-all"
                >
                  Xem thực đơn ngay
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs flex items-center gap-3 hover:border-orange-200 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-orange-600 font-black text-xs sm:text-sm">
                        {formatCurrency(item.price)}
                      </span>
                      {item.id === "kit-nem-mau-thu" && (
                        <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md">
                          Trợ giá • Tối đa 1 suất
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white text-slate-700 rounded-lg shadow-xs hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all"
                      aria-label="Giảm"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    {item.id === "kit-nem-mau-thu" && item.quantity >= 1 ? (
                      <button
                        type="button"
                        disabled
                        className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-400 rounded-lg shadow-xs cursor-not-allowed opacity-50"
                        title="Kit mẫu thử trợ giá giới hạn tối đa 1 phần mỗi đơn"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-orange-600 text-white rounded-lg shadow-xs hover:bg-orange-700 active:scale-95 transition-all"
                        aria-label="Tăng"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
              {/* Cảnh báo đơn tối thiểu */}
              {!isMinOrderMet && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Đơn tối thiểu là <strong>{formatCurrency(effectiveMinOrder)}</strong>. Cần thêm <strong>{formatCurrency(remainingForMinOrder)}</strong> để đặt hàng.
                  </span>
                </div>
              )}

              {/* Tóm tắt tiền */}
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền món ({totalItems} phần):</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    Tổng thanh toán:
                  </span>
                  <span className="font-black text-orange-600 text-lg sm:text-xl">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Nút Đặt hàng */}
              <button
                disabled={!isMinOrderMet || !isShopOpen}
                onClick={onProceedToCheckout}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                  !isShopOpen
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : !isMinOrderMet
                    ? "bg-amber-300 text-amber-800 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-600/30 active:scale-[0.98]"
                }`}
              >
                <span>
                  {!isShopOpen
                    ? "Quán ngoài giờ phục vụ"
                    : !isMinOrderMet
                    ? `Chưa đủ đơn tối thiểu (${formatCurrency(effectiveMinOrder)})`
                    : "Tiến hành đặt hàng"}
                </span>
                {isMinOrderMet && isShopOpen && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
