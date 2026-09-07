"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export interface PrivacyConsentCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  defaultChecked?: boolean;
}

/**
 * Reusable Personal Data Protection Consent Checkbox
 * Compliant with Decree 13/2023/NĐ-CP on Personal Data Protection.
 * Opt-in mandate: NOT pre-ticked by default (defaultChecked={false}).
 */
export function PrivacyConsentCheckbox({
  id = "privacy-consent-checkbox",
  checked,
  onChange,
  error,
  required = true,
  disabled = false,
  className = "",
  defaultChecked = false,
}: PrivacyConsentCheckboxProps) {
  return (
    <div className={`privacy-consent-block ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={id}
            type="checkbox"
            name="privacyConsent"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            required={required}
            disabled={disabled}
            className="w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-0 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
        <label
          htmlFor={id}
          className="text-xs text-stone-600 leading-relaxed cursor-pointer select-none font-normal"
        >
          Tôi đã đọc và đồng ý với{" "}
          <Link
            href="/chinh-sach-bao-mat"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Chính sách xử lý dữ liệu cá nhân
          </Link>{" "}
          theo <strong className="font-semibold text-stone-800">Nghị định 13/2023/NĐ-CP</strong>.
        </label>
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default PrivacyConsentCheckbox;
