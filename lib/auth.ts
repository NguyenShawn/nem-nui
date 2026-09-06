import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";

/**
 * Standardized authentication failure response schema conforming to Interface Contract 1
 */
export interface AuthErrorResponse {
  success: false;
  error: string;
}

/**
 * Constant-time string comparison using SHA-256 digest buffers.
 * Solves the length-mismatch problem of crypto.timingSafeEqual and protects against timing side-channel attacks.
 */
export function timingSafeCompare(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;

  const hashProvided = createHash("sha256").update(provided).digest();
  const hashExpected = createHash("sha256").update(expected).digest();

  return timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Extracts administrative credentials from request headers in the following priority:
 * 1. Authorization: Bearer <ADMIN_SECRET or ADMIN_PIN>
 * 2. x-admin-key: <ADMIN_SECRET or ADMIN_PIN>
 * 3. x-admin-pin: <ADMIN_PIN>
 *
 * NOTE: Query parameters (e.g. ?pin=) are strictly IGNORED to prevent credential leakage in logs.
 */
export function extractAdminToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      const token = trimmed.slice(7).trim();
      if (token) return token;
    } else if (trimmed) {
      return trimmed;
    }
  }

  const adminKey = req.headers.get("x-admin-key");
  if (adminKey && adminKey.trim()) {
    return adminKey.trim();
  }

  const adminPinHeader = req.headers.get("x-admin-pin");
  if (adminPinHeader && adminPinHeader.trim()) {
    return adminPinHeader.trim();
  }

  return null;
}

/**
 * Verifies request credentials against server environment secrets.
 * Validates against process.env.ADMIN_SECRET or process.env.ADMIN_PIN (fallback: "99887766").
 * Supports optional bodyPin parameter for backward compatibility in JSON mutation requests.
 */
export function verifyAdminAuth(req: Request, bodyPin?: string): boolean {
  const token = extractAdminToken(req) || (bodyPin ? String(bodyPin).trim() : null);
  if (!token) return false;

  const validPin = process.env.ADMIN_PIN || "99887766";
  const validSecret = process.env.ADMIN_SECRET || "nemnui_admin_secret_2026";

  const isPinValid = timingSafeCompare(token, validPin);
  const isSecretValid = timingSafeCompare(token, validSecret);

  return isPinValid || isSecretValid;
}

/**
 * Strict verification against ADMIN_SECRET only (e.g., automated batch sync or wholesale CRM).
 */
export function verifyAdminSecret(req: Request): boolean {
  const token = extractAdminToken(req);
  if (!token) return false;

  const validSecret = process.env.ADMIN_SECRET || "nemnui_admin_secret_2026";
  return timingSafeCompare(token, validSecret);
}

/**
 * Factory for 401 Unauthorized NextResponse conforming to PROJECT.md Contract 1
 */
export function createUnauthorizedResponse(
  message = "Unauthorized: Missing or invalid administrative credentials"
): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}
