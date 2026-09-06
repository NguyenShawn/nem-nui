"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Send,
  Check,
  AlertCircle,
  Phone,
  User,
  MapPin,
  X,
  PhoneCall,
  Gift,
  FileText,
  Sparkles,
  Flame,
  ShieldCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";
import { PrivacyConsentCheckbox } from "@/components/PrivacyConsentCheckbox";

interface FormErrors {
  fullName?: string;
  phone?: string;
  addressNote?: string;
  consent?: string;
}

export function LeadFormSection() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTier, setSelectedTier] = useState("tier_200_500");
  const [addressNote, setAddressNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [consentChecked, setConsentChecked] = useState(false); // Nghị định 13/2023/NĐ-CP
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    phone: string;
    tier: string;
  } | null>(null);

  const validateVietnamPhone = (number: string): boolean => {
    const cleaned = number.replace(/\s+/g, "").replace(/\./g, "").replace(/-/g, "");
    const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
    return vnPhoneRegex.test(cleaned);
  };

  const handleValidate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên hoặc tên quán của bạn";
    }

    if (!phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại để nhận bảng giá sỉ";
    } else if (!validateVietnamPhone(phone)) {
      newErrors.phone =
        "Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (03x, 05x, 07x, 08x, 09x)";
    }

    if (!consentChecked) {
      newErrors.consent =
        "Vui lòng xác nhận đồng ý với Chính sách xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidate()) return;

    setIsSubmitting(true);

    const tierObject = LANDING_CONFIG.wholesaleTiers.find((t) => t.id === selectedTier);

    const leadPayload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      tier: `[BÁO GIÁ SỈ] ${tierObject?.label || selectedTier}`,
      tierLabel: `[BÁO GIÁ SỈ] ${tierObject?.label || selectedTier}`,
      addressNote: addressNote.trim(),
      consentChecked,
      website_url: honeypot,
      submittedAt: new Date().toISOString(),
    };

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      });

      setSubmittedData({
        name: fullName.trim(),
        phone: phone.trim(),
        tier: tierObject?.label || "",
      });
      setIsSuccessModalOpen(true);
      setFullName("");
      setPhone("");
      setAddressNote("");
      setConsentChecked(false);
      setErrors({});
    } catch (err) {
      console.error("Lỗi gửi thông tin sỉ:", err);
      setSubmittedData({
        name: fullName.trim(),
        phone: phone.trim(),
        tier: tierObject?.label || "",
      });
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="tu-van" className="py-14 sm:py-20 bg-[#FFFBEB] border-b border-stone-200/60 scroll-mt-16">
      {/* Anchor hỗ trợ điều hướng */}
      <div id="uu-dai-1k" className="scroll-mt-20" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 2-Column Powerhouse Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: CHI TIẾT KIT MẪU THỬ & ĐẶT GIAO LIỀN (lg:col-span-6) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-stone-50/70 border-b lg:border-b-0 lg:border-r border-stone-200/80">
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200/80 mb-4">
                  <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                  <span>Kit Mẫu Thử Thẩm Định Vị</span>
                </div>

                {/* Headline */}
                <h2 className="text-2xl sm:text-3xl font-bold font-muli uppercase text-stone-900 tracking-normal leading-tight mb-3">
                  Đặt Kit Mẫu Thử giao nóng tận quán để thẩm định vị.
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-5 font-normal">
                  Để bạn an tâm về chất lượng trước khi nhập số lượng lớn, xưởng Nem Núi hỗ trợ phần
                  <strong> Kit Mẫu Thử trải nghiệm trợ giá chỉ 25.000đ</strong> (3 cây nướng than hoa + hũ sốt bí truyền).
                  Giao nóng ăn liền trong 2h như món ăn thường.
                </p>

                {/* Real Tray Image with Caption */}
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-stone-200 shadow-sm mb-5 group">
                  <Image
                    src="/assets/image5.png"
                    alt="Khay Kit mẫu thử nem nướng than hoa kèm bánh tráng và sốt chấm độc quyền Nem Núi"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 550px"
                    priority
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kit mẫu 3 cây + sốt (Trợ giá 25.000đ)</span>
                  </div>
                </div>

                {/* 2 Gift Items Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {/* Item 1 */}
                  <div className="bg-white rounded-xl p-3.5 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-stone-500 uppercase tracking-wider text-[11px]">Mẫu thử 01</span>
                      <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md text-[11px]">
                        Trợ giá 25.000đ
                      </span>
                    </div>
                    <p className="text-sm font-bold text-stone-900 mb-0.5">Kit nem nướng (3 cây)</p>
                    <p className="text-xs text-stone-600 mb-2">Chuẩn 60g/cây, nạc mỡ 8:2 nướng than mọng nước.</p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Quy cách:</span>
                      <span className="font-bold text-orange-700">Nướng nóng ăn liền</span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="bg-white rounded-xl p-3.5 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-stone-500 uppercase tracking-wider text-[11px]">Mẫu thử 02</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                        Tặng kèm
                      </span>
                    </div>
                    <p className="text-sm font-bold text-stone-900 mb-0.5">Hũ sốt chấm bí truyền</p>
                    <p className="text-xs text-stone-600 mb-2">Pha sẵn vị mè rang béo bùi + Cẩm nang cost 65%.</p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Đặc quyền:</span>
                      <span className="font-bold text-emerald-700">Hoàn tiền khi nhập sỉ</span>
                    </div>
                  </div>
                </div>

                {/* Direct Order Button on Left Column */}
                <a
                  href="/dat-le?item=kit-nem-mau-thu"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-orange-600/25 transition-all mb-4 group"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Đặt Kit Mẫu Thử Giao Nóng 2H (Trợ Giá 25.000đ)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* 3 Honest Commitments */}
              <div className="pt-4 border-t border-stone-200/80 space-y-2 text-xs text-stone-700 font-medium">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span><strong>Giao hàng như món thường:</strong> Đặt giao nóng ăn liền tận quán trong 2h tại TP.HCM.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Hoàn tiền 100% khi nhập sỉ:</strong> Khi lên đơn sỉ từ 100 cây, xưởng sẽ hoàn trừ 25.000đ vào hóa đơn!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Thẩm định vị chuẩn xác:</strong> Nếm thử thực tế thớ thịt nạc vai 8:2 trước khi quyết định hợp tác.</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: FORM NHẬN BÁO GIÁ SỈ TẬN GỐC (lg:col-span-6) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
              <div>
                {/* Form Heading */}
                <div className="mb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-1.5 tracking-tight">
                    Đăng ký nhận Bảng Báo Giá Sỉ tận gốc
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Xưởng Nem Núi gửi bảng giá chiết khấu 100 - 1.000 cây và chính sách hỗ trợ quán qua Zalo.
                  </p>
                </div>

                {/* Quick Callout to Order Sample Kit */}
                <div className="mb-5 p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-orange-950 font-medium">
                    <ShoppingBag className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Muốn nếm thử vị trước? Đặt giao nóng chỉ <strong>25.000đ (Trợ giá)</strong></span>
                  </div>
                  <a
                    href="/dat-le?item=kit-nem-mau-thu"
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs transition-all flex items-center gap-1"
                  >
                    <span>Đặt thử ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* HONEYPOT TRAP (Chống Bot - Người thật không thấy) */}
                  <div
                    className="honeypot-field"
                    style={{ opacity: 0, position: "absolute", top: 0, left: 0, height: 0, width: 0, zIndex: -1, pointerEvents: "none" }}
                    aria-hidden="true"
                  >
                    <label htmlFor="lead_website_url">Website URL (Leave blank)</label>
                    <input
                      id="lead_website_url"
                      type="text"
                      name="website_url"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {/* Họ tên / Tên quán */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Họ tên hoặc Tên quán *</span>
                      {errors.fullName && (
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 normal-case tracking-normal">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.fullName}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        placeholder="Ví dụ: Anh Tuấn (Quán Bún Nem Cô Ba)"
                        className={`w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium bg-stone-50/70 text-stone-900 border transition-all placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 ${
                          errors.fullName
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-stone-200 focus:border-orange-600 focus:ring-orange-600/10"
                        }`}
                      />
                    </div>
                  </div>

                  {/* SĐT / Zalo */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Số điện thoại (Zalo nhận bảng giá) *</span>
                      {errors.phone && (
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 normal-case tracking-normal">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.phone}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        placeholder="Ví dụ: 0987654321"
                        className={`w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium bg-stone-50/70 text-stone-900 border transition-all placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 ${
                          errors.phone
                            ? "border-rose-400 focus:ring-rose-400/20"
                            : "border-stone-200 focus:border-orange-600 focus:ring-orange-600/10"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Địa chỉ quán hoặc Khu vực */}
                  <div>
                    <label htmlFor="addressNote" className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Khu vực mở quán (Tùy chọn)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 flex items-center pointer-events-none text-stone-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <textarea
                        id="addressNote"
                        rows={2}
                        value={addressNote}
                        onChange={(e) => setAddressNote(e.target.value)}
                        placeholder="Ví dụ: Quận Bình Thạnh, TP.HCM hoặc Bến Tre..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-sm font-medium bg-stone-50/70 text-stone-900 border border-stone-200 transition-all placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-600 focus:ring-orange-600/10"
                      />
                    </div>
                  </div>

                  {/* Dự kiến số lượng quan tâm */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Gói sỉ bạn đang quan tâm
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LANDING_CONFIG.wholesaleTiers.map((tier) => {
                        const isSelected = selectedTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setSelectedTier(tier.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all focus:outline-none ${
                              isSelected
                                ? "bg-orange-50/80 border-orange-500 text-orange-950 font-bold shadow-2xs ring-1 ring-orange-500"
                                : "bg-stone-50/60 border-stone-200 text-stone-700 hover:border-stone-300"
                            }`}
                          >
                            <span className="block text-xs font-bold leading-snug">{tier.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Điều khoản bảo vệ dữ liệu cá nhân Nghị định 13/2023/NĐ-CP */}
                  <div className="p-3 bg-stone-50/80 border border-stone-200 rounded-xl">
                    <PrivacyConsentCheckbox
                      id="lead-consent-checkbox"
                      checked={consentChecked}
                      onChange={(checked) => {
                        setConsentChecked(checked);
                        if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }));
                      }}
                      error={errors.consent}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !consentChecked}
                      className="w-full flex items-center justify-center gap-2 py-3.5 min-h-[48px] text-sm sm:text-base font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                    >
                      {isSubmitting ? (
                        <span>Đang xử lý đăng ký...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Gửi yêu cầu nhận Bảng Giá Sỉ (Miễn phí)</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-stone-500 mt-2.5 font-medium">
                      Nem Núi cam kết gọi lại trong 10 phút. Bảo mật thông tin kinh doanh 100%.
                    </p>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUCCESS MODAL */}
      {/* ========================================================================= */}
      {isSuccessModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-stone-200 animate-scale-up">
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4 border border-emerald-200">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-2">
              Đăng ký thành công!
            </h3>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-6 text-left text-sm text-stone-700 leading-relaxed font-normal">
              <p className="font-bold text-stone-900 mb-1">Xưởng Nem Núi đã tiếp nhận yêu cầu!</p>
              <p className="text-xs sm:text-sm text-stone-600 mb-3">
                Chuyên viên tư vấn sẽ liên hệ gửi bảng báo giá sỉ chi tiết qua Zalo cho bạn trong <strong>10 phút</strong>.
              </p>
              {submittedData && (
                <div className="pt-3 border-t border-stone-200 text-xs text-stone-600 space-y-1">
                  <p><strong>Khách hàng:</strong> {submittedData.name}</p>
                  <p><strong>Số điện thoại (Zalo):</strong> {submittedData.phone}</p>
                  <p><strong>Gói sỉ dự kiến:</strong> {submittedData.tier}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={LANDING_CONFIG.brand.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>Nhắn tin Zalo với Xưởng Nem Núi</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`tel:${LANDING_CONFIG.brand.hotline}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                <span>Gọi Hotline: {LANDING_CONFIG.brand.hotlineDisplay}</span>
              </a>

              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full py-2 text-xs font-semibold text-stone-400 hover:text-stone-700 transition-colors"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}