"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  ShoppingBag,
  PhoneCall,
  RefreshCw,
  MapPin,
  Clock,
  Compass,
  Utensils,
  XCircle,
} from "lucide-react";
import { CartItem, OrderStatus, PaymentMethod } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";
import { getSupabaseBrowserClient, supabaseClient } from "@/lib/supabase";

interface ThankYouModalProps {
  isOpen: boolean;
  orderCode: string;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
  cartItems: CartItem[];
  onResetOrder: () => void;
}

export function ThankYouModal({
  isOpen,
  orderCode,
  total,
  customerName,
  phone,
  address,
  note,
  paymentMethod,
  cartItems,
  onResetOrder,
}: ThankYouModalProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("new");
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Khởi tạo trạng thái ban đầu và lắng nghe Supabase Realtime WebSocket (Zero Polling)
  useEffect(() => {
    if (!isOpen || !orderCode) return;

    // Reset status về mặc định lúc mới mở
    setCurrentStatus("new");
    setCancelReason(null);
    setErrorMessage("");

    const fetchStatusOnce = async () => {
      try {
        const response = await fetch(`/api/order/status?code=${encodeURIComponent(orderCode)}&t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!response.ok) {
          throw new Error("Không thể kiểm tra trạng thái đơn.");
        }
        const data = await response.json();
        if (data.success && data.status) {
          setCurrentStatus(data.status);
          if (data.cancelReason) {
            setCancelReason(data.cancelReason);
          }
        }
      } catch (err: any) {
        console.error("Lỗi khởi tạo trạng thái đơn hàng:", err);
      }
    };

    // Chạy ngay lần đầu
    fetchStatusOnce();

    // Lắng nghe Realtime WebSocket CDC theo mã đơn
    const client = getSupabaseBrowserClient() || supabaseClient;
    if (!client) return;

    const channel = client
      .channel(`order-status-${orderCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `code=eq.${orderCode}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated && updated.status) {
            setCurrentStatus(updated.status);
            if (updated.cancel_reason) {
              setCancelReason(updated.cancel_reason);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channel && client) {
        client.removeChannel(channel);
      }
    };
  }, [isOpen, orderCode]);

  if (!isOpen) return null;

  // Xác định bước tiến trình hiện tại
  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case "new":
        return 0;
      case "preparing":
        return 1;
      case "delivering":
        return 2;
      case "completed":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const stepIndex = getStepIndex(currentStatus);

  // Định nghĩa các bước hiển thị
  const steps = [
    {
      label: paymentMethod === "momo" && currentStatus === "new" ? "Chờ duyệt MoMo" : "Đã gửi",
      desc: paymentMethod === "momo" && currentStatus === "new" ? "Đang đối soát" : "Chờ xác nhận",
      icon: Clock,
    },
    { label: "Bếp làm", desc: "Chế biến nem", icon: Utensils },
    { label: "Đang giao", desc: "Shipper đi giao", icon: Compass },
    { label: "Hoàn tất", desc: "Ngon miệng!", icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-fade-in" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-slate-100">
          
          {/* Header Banner theo trạng thái */}
          {currentStatus === "cancelled" ? (
            <div className="p-6 text-center bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white space-y-2.5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/30">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">Đơn hàng đã bị hủy</h3>
              <p className="text-rose-100 text-xs sm:text-sm font-medium">
                Mã đơn: <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">#{orderCode}</span>
              </p>
              
              {/* Box lý do hủy rõ ràng */}
              <div className="bg-black/20 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 text-left mt-2 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 block mb-1">
                  LÝ DO HỦY TỪ QUÁN:
                </span>
                <span className="text-sm font-bold text-white block">
                  {cancelReason || "Quán chưa thể tiếp nhận đơn hàng này."}
                </span>
              </div>
            </div>
          ) : currentStatus === "new" && paymentMethod === "momo" ? (
            <div className="p-6 text-center bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 text-white space-y-2">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/30">
                <Clock className="w-9 h-9 text-white animate-spin" style={{ animationDuration: "8s" }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black">Đang chờ quán kiểm tra MoMo</h3>
              <p className="text-purple-100 text-xs sm:text-sm font-medium">
                Đơn <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">#{orderCode}</span> • Nhân viên đang đối soát số tiền chuyển khoản
              </p>
            </div>
          ) : (
            <div className="p-6 text-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-2">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black">Đặt hàng thành công!</h3>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                Đơn <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">#{orderCode}</span> đã gửi trực tiếp đến bếp!
              </p>
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-5">
            {/* TIẾN TRÌNH ĐƠN HÀNG THỜI GIAN THỰC */}
            {currentStatus !== "cancelled" && (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                  TIẾN TRÌNH ĐƠN THỜI GIAN THỰC
                </div>
                
                {/* Stepper Component */}
                <div className="relative flex items-center justify-between mt-2">
                  {/* Thanh nối sau lưng */}
                  <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 -z-0">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${(Math.max(0, stepIndex) / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= stepIndex;
                    const isActive = idx === stepIndex;

                    return (
                      <div key={idx} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isActive
                              ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20 scale-110 animate-pulse"
                              : isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-1.5 ${
                            isActive ? "text-orange-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[8px] text-slate-400 leading-none mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thông báo mô tả theo trạng thái */}
            {currentStatus === "new" && paymentMethod === "momo" && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-purple-900 animate-pulse">
                <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-purple-950 font-bold mb-0.5">
                    Quán đang kiểm tra thanh toán MoMo
                  </strong>
                  Bạn đã xác nhận chuyển tiền. Nhân viên quán đang kiểm tra giao dịch trên app MoMo. Ngay khi tiền vào tài khoản, bếp sẽ lập tức nướng nem nóng hổi!
                </div>
              </div>
            )}

            {currentStatus === "new" && paymentMethod === "cod" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                <PhoneCall className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-950 font-bold mb-0.5">
                    Quán đang tiếp nhận đơn hàng
                  </strong>
                  Chủ quán đang xem danh sách bếp. Hãy để ý điện thoại <span className="font-bold text-amber-950">{phone}</span> để nhận cuộc gọi xác nhận nhé.
                </div>
              </div>
            )}

            {currentStatus === "preparing" && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-orange-900">
                <Utensils className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-orange-950 font-bold mb-0.5">
                    Quán đang chuẩn bị món
                  </strong>
                  Đầu bếp đang nướng nem lụi nóng hổi và đóng hộp. Đơn hàng sẽ sớm được chuyển cho shipper tự giao của quán.
                </div>
              </div>
            )}

            {currentStatus === "delivering" && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-sky-900">
                <Compass className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sky-950 font-bold mb-0.5">
                    Đang trên đường giao tới bạn
                  </strong>
                  Shipper của quán đang mang nem nướng nóng hổi đến cho bạn. Bạn vui lòng chuẩn bị sẵn máy để shipper liên lạc khi đến nơi.
                </div>
              </div>
            )}

            {currentStatus === "completed" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-950 font-bold mb-0.5">
                    Đơn hàng đã hoàn thành!
                  </strong>
                  Đơn hàng đã được giao nhận thành công. Chúc bạn có một bữa ăn ngon miệng cùng đặc sản Nem Núi!
                </div>
              </div>
            )}

            {currentStatus === "cancelled" && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-xs text-rose-900">
                <div className="flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-950 font-bold text-sm">
                      Đơn hàng đã bị hủy
                    </strong>
                    <p className="text-rose-800 text-xs mt-0.5">
                      Lý do: <span className="font-bold text-rose-950">{cancelReason || "Quán chưa thể thực hiện đơn này"}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Gọi Hotline hỗ trợ / Hoàn tiền: {SHOP_CONFIG.displayPhone}</span>
                </a>
              </div>
            )}

            {/* Order Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                  Chi tiết đơn hàng
                </span>
                <span>{cartItems.reduce((s, i) => s + i.quantity, 0)} phần</span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs text-slate-700"
                  >
                    <span className="truncate pr-2">
                      <strong className="text-orange-600 font-bold">{item.quantity}x</strong> {item.name}
                    </span>
                    <span className="font-semibold shrink-0 text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium line-clamp-2">{address}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-slate-600">
                  <span>Thanh toán:</span>
                  <span className="font-bold text-slate-900">
                    {paymentMethod === "momo" ? "Chuyển khoản MoMo QR" : "Tiền mặt khi nhận (COD)"}
                  </span>
                </div>
                {note && (
                  <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                    Ghi chú: {note}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Tổng thanh toán:</span>
                <span className="font-black text-orange-600 text-lg">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Hotline Support */}
            <div className="text-center text-xs text-slate-500">
              Mọi thắc mắc vui lòng liên hệ hotline:{" "}
              <a
                href={`tel:${SHOP_CONFIG.phone}`}
                className="text-orange-600 font-bold underline hover:text-orange-700"
              >
                {SHOP_CONFIG.displayPhone}
              </a>
            </div>

            {/* Nút Đặt đơn mới */}
            <button
              onClick={onResetOrder}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Quay về Đặt đơn mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
