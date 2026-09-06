import crypto from "crypto";

export const ORDER_CODE_REGEX = /^[2-9A-HJ-NP-Z]{6}$/;
export const MEMO_ORDER_CODE_REGEX = /\b(NM[2-9A-HJ-NP-Z]{4,8}|(?=[2-9A-HJ-NP-Z]*\d)[2-9A-HJ-NP-Z]{6})\b/i;

/**
 * Tạo mã chữ ký HMAC-SHA256 chuẩn 64-hex character digest từ secret và payload
 */
export function generateHmacSha256(secret: string, payload: any): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * So sánh an toàn hằng số thời gian (Constant-time comparison) chống tấn công Timing Attack
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
      return false;
    }
    const isHex = /^[0-9a-fA-F]+$/.test(a) && /^[0-9a-fA-F]+$/.test(b) && a.length % 2 === 0;
    const bufA = Buffer.from(a, isHex ? "hex" : "utf-8");
    const bufB = Buffer.from(b, isHex ? "hex" : "utf-8");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Kiểm tra replay attack qua timestamp:
 * Trả về true nếu timestamp quá 300 giây (5 phút) so với hiện tại, hoặc không hợp lệ.
 */
export function isReplayTimestamp(timestamp?: string | number): boolean {
  if (timestamp === undefined || timestamp === null) return false;
  let tsMs: number;
  if (typeof timestamp === "number") {
    tsMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  } else if (typeof timestamp === "string") {
    const parsedNum = Number(timestamp);
    if (!isNaN(parsedNum) && timestamp.trim() !== "") {
      tsMs = parsedNum < 1e11 ? parsedNum * 1000 : parsedNum;
    } else {
      tsMs = new Date(timestamp).getTime();
    }
  } else {
    return false;
  }

  if (isNaN(tsMs)) return false;
  const now = Date.now();
  const ageSeconds = Math.abs(now - tsMs) / 1000;
  return ageSeconds > 300;
}

/**
 * Bóc tách mã đơn hàng Crockford Base32 từ nội dung chuyển khoản ngân hàng (memo / description / content)
 * Priority 1: Tiền tố NM (VD: NM8K3P9X, NM4X8K2)
 * Priority 2: 6 ký tự Base32 có chứa ít nhất 1 chữ số (tránh khớp nhầm từ ngữ tiếng Việt in hoa như CHUYEN)
 */
export function extractOrderCodeFromMemo(memo: string): string | null {
  if (!memo || typeof memo !== "string") return null;

  // 1. Khớp mã có tiền tố NM (VD: "CK NM8K3P9X", "VIETQR:NM7K2P9/THANH TOAN", "MBVCB...NM4X8K2")
  const nmMatch = memo.match(/\bNM([2-9A-HJ-NP-Z]{4,8})\b/i);
  if (nmMatch) {
    return nmMatch[1].toUpperCase();
  }

  // 2. Khớp mã 6 ký tự chứa ít nhất 1 chữ số (loại bỏ từ tiếng Việt 6 chữ cái như CHUYEN)
  const codeWithDigitMatch = memo.match(/\b(?=[2-9A-HJ-NP-Z]*\d)[2-9A-HJ-NP-Z]{6}\b/i);
  if (codeWithDigitMatch) {
    return codeWithDigitMatch[0].toUpperCase();
  }

  return null;
}

/**
 * Xác thực chữ ký webhook từ header x-signature (HMAC-SHA256) hoặc API token x-api-key.
 * Từ chối (HTTP 401 / 403) nếu không hợp lệ hoặc thiếu.
 */
export function verifyWebhookSignature(req: Request, rawBody: string, customSecret?: string): boolean {
  const secret =
    customSecret ||
    process.env.PAYMENT_WEBHOOK_SECRET ||
    process.env.PAYMENT_API_KEY ||
    process.env.VIETQR_SECRET_KEY ||
    process.env.MOMO_SECRET_KEY;
  if (!secret) {
    console.warn("[Payment] PAYMENT_WEBHOOK_SECRET chưa được cấu hình trên máy chủ.");
    return false;
  }

  const signature =
    req.headers.get("x-signature") ||
    req.headers.get("x-sepay-signature") ||
    req.headers.get("x-momo-signature");
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("x-sepay-api-key");
  const authHeader = req.headers.get("authorization");

  // 1. Xác thực bằng API Key header
  if (apiKey) {
    return timingSafeCompare(apiKey, secret);
  }

  // 2. Xác thực bằng Authorization header (Bearer / Apikey)
  if (authHeader) {
    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];
    if (timingSafeCompare(token, secret)) {
      return true;
    }
  }

  // 3. Xác thực bằng HMAC-SHA256 signature
  if (signature) {
    const expectedSignature = generateHmacSha256(secret, rawBody);
    return timingSafeCompare(signature, expectedSignature);
  }

  return false;
}
