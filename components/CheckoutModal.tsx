"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { CartItem, OrderApiResponse, PaymentMethod } from "@/types/order";
import { formatCurrency, isValidVNPhone } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderSuccess: (orderData: OrderApiResponse & { customerName: string; phone: string; address: string; note?: string }) => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onOrderSuccess,
  showToast,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot field

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = SHOP_CONFIG.shippingFee;
  const grandTotal = subtotal + shippingFee;

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!customerName.trim()) {
      errs.customerName = "Vui lòng nhập họ và tên của bạn";
    } else if (customerName.trim().length < 2 || customerName.trim().length > 50) {
      errs.customerName = "Họ tên phải từ 2 đến 50 ký tự";
    }

    if (!phone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại";
    } else if (!isValidVNPhone(phone.trim())) {
      errs.phone = "Số điện thoại không hợp lệ (VD: 0909123456 hoặc +84909123456)";
    }

    if (!address.trim()) {
      errs.address = "Vui lòng nhập địa chỉ nhận hàng cụ thể";
    } else if (address.trim().length < 10) {
      errs.address = "Địa chỉ cần chi tiết từ 10 ký tự trở lên (số nhà, tên đường, phường/xã)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("error", "Vui lòng kiểm tra lại thông tin còn thiếu hoặc sai định dạng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim() || undefined,
        paymentMethod,
        honeypot: honeypot.trim(), // Gửi honeypot
        items: cart.map((item) => ({
          id: item.id,
          qty: item.quantity,
        })),
      };

      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: OrderApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Đặt hàng không thành công. Vui lòng thử lại.");
      }

      // Thông báo thành công và chuyển màn hình
      onOrderSuccess({
        ...data,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
      });
    } catch (err: any) {
      console.error("[Submit Order Error]", err);
      showToast("error", err.message || "Đã xảy ra lỗi khi gửi đơn hàng. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in border border-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 text-white p-2 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Thông tin giao hàng
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Quán sẽ gọi xác nhận ngay sau khi nhận đơn
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* HONEYPOT TRAP (Chống Bot - Người thật không thấy) */}
            <div className="honeypot-field" aria-hidden="true">
              <label htmlFor="website_url">Website URL (Leave blank)</label>
              <input
                type="text"
                id="website_url"
                name="website_url"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Họ và tên của bạn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors({ ...errors, customerName: "" });
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                    errors.customerName
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.customerName && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.customerName}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Số điện thoại nhận hàng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0909 123 456"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                    errors.phone
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Địa chỉ giao hàng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa chỉ giao hàng chi tiết <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Số nhà, tên đường, ngõ ngách, tên tòa nhà/phòng..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: "" });
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                    errors.address
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.address && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.address}
                </p>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú cho quán <span className="text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: Ít cay, không lấy hành tây, giao giờ trưa..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Chọn hình thức thanh toán */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phương thức thanh toán <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* MoMo */}
                <label
                  onClick={() => setPaymentMethod("momo")}
                  className={`cursor-pointer p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                    paymentMethod === "momo"
                      ? "border-pink-600 bg-pink-50/50 ring-2 ring-pink-100"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-black text-xs shadow-sm mb-1.5">
                    M
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Chuyển khoản MoMo
                  </span>
                  <span className="text-[11px] text-pink-700 font-semibold mt-0.5">
                    Quét mã QR tiện lợi
                  </span>
                </label>

                {/* COD */}
                <label
                  onClick={() => setPaymentMethod("cod")}
                  className={`cursor-pointer p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                    paymentMethod === "cod"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-100"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm mb-1.5">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Tiền mặt (COD)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Trả khi nhận hàng
                  </span>
                </label>
              </div>
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="bg-orange-50/70 border border-orange-200/70 rounded-2xl p-3.5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền món ({cart.length} loại món):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí ship:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="pt-2 border-t border-orange-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Tổng thanh toán:</span>
                <span className="font-black text-orange-600 text-base sm:text-lg">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang gửi đơn hàng...</span>
                </>
              ) : (
                <span>
                  Xác nhận đặt hàng • {formatCurrency(grandTotal)}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
