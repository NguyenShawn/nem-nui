import { NextRequest, NextResponse } from "next/server";
import {
  generateHmacSha256,
  timingSafeCompare,
  isReplayTimestamp,
  extractOrderCodeFromMemo,
  verifyWebhookSignature,
} from "@/lib/payment";
import { reconcileOrderPayment } from "@/lib/orderDb";
import { logFinancialAudit } from "@/lib/db/audit";

const SUPPORTED_GATEWAYS = new Set(["vietqr", "sepay", "momo", "bank_transfer", "internal"]);

/**
 * POST /api/payment/webhook
 * Tiếp nhận thông báo giao dịch chuyển khoản từ SePAY / VietQR và MoMo IPN
 * Tự động đối soát, kiểm tra chữ ký HMAC-SHA256, chống replay và gạch nợ Idempotent.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. ĐỌC RAW BODY STRING
    const rawBody = await req.text();
    if (!rawBody || rawBody.trim().length === 0 || rawBody.trim() === "{}") {
      return NextResponse.json(
        { success: false, error: "Empty webhook request body is rejected (HTTP 400)" },
        { status: 400 }
      );
    }

    // 2. XÁC THỰC CHỮ KÝ SỐ CRYPTOGRAPHIC SIGNATURE HOẶC API KEY (F18)
    const secret =
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.PAYMENT_API_KEY ||
      process.env.VIETQR_SECRET_KEY ||
      process.env.MOMO_SECRET_KEY;

    const hasSignatureHeader =
      req.headers.has("x-signature") ||
      req.headers.has("x-sepay-signature") ||
      req.headers.has("x-momo-signature") ||
      req.headers.has("x-api-key") ||
      req.headers.has("x-sepay-api-key") ||
      req.headers.has("authorization");

    // Nếu cấu hình bí mật tồn tại hoặc request có gửi kèm header chữ ký, tiến hành verify
    if (hasSignatureHeader || secret) {
      if (!secret) {
        console.warn("[Payment Webhook] PAYMENT_WEBHOOK_SECRET chưa được cấu hình trên máy chủ.");
        return NextResponse.json(
          { success: false, error: "Server payment webhook secret unconfigured" },
          { status: 500 }
        );
      }
      const isValidSig = verifyWebhookSignature(req, rawBody, secret);
      if (!isValidSig) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized: Invalid or missing webhook signature (x-signature / x-api-key)",
          },
          { status: 401 }
        );
      }
    }

    // 3. PARSE PAYLOAD JSON
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload in webhook request" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty webhook JSON payload" },
        { status: 400 }
      );
    }

    // 4. KIỂM TRA CHỐNG TẤN CÔNG PHÁT LẠI (REPLAY ATTACK PREVENTION - 300 GIÂY)
    const timestamp = body.timestamp || body.transactionDate || body.time || body.responseTime;
    if (timestamp && isReplayTimestamp(timestamp)) {
      console.warn("[Webhook] Từ chối request do timestamp quá 300s (Replay attack):", timestamp);
      return NextResponse.json(
        { success: false, error: "Webhook timestamp expired: older than 300s window (replay attack detected)" },
        { status: 403 }
      );
    }

    // 5. KIỂM TRA NHÀ CUNG CẤP CỔNG THANH TOÁN (GATEWAY VALIDATION)
    const gateway = String(body.gateway || (body.partnerCode ? "momo" : "vietqr")).toLowerCase();
    if (body.gateway && !SUPPORTED_GATEWAYS.has(gateway)) {
      return NextResponse.json(
        { success: false, error: `Unsupported gateway provider: "${body.gateway}"` },
        { status: 400 }
      );
    }

    // 6. KIỂM TRA VÀ CHUẨN HÓA MÃ GIAO DỊCH (TRANSACTION ID)
    const rawTxId =
      body.transactionId ||
      body.transaction_id ||
      body.id ||
      body.transId ||
      body.referenceCode;

    if (!rawTxId || typeof rawTxId !== "string" || rawTxId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Missing or empty transactionId in webhook payload" },
        { status: 400 }
      );
    }
    const transactionId = rawTxId.trim();

    // 7. KIỂM TRA SỐ TIỀN CHUYỂN KHOẢN (AMOUNT VALIDATION)
    const rawAmount = body.amount !== undefined ? body.amount : body.transferAmount;
    const amount = Number(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Negative or zero transferred amount is rejected with HTTP 400" },
        { status: 400 }
      );
    }

    // 8. BÓC TÁCH MÃ ĐƠN HÀNG (ORDER CODE PARSING - F20)
    const directCode = body.orderCode || body.code || body.orderId;
    const memo = body.content || body.description || body.memo || body.orderInfo || "";

    let resolvedOrderCode: string | null = null;
    if (directCode && typeof directCode === "string" && directCode.trim().length > 0) {
      resolvedOrderCode = extractOrderCodeFromMemo(directCode) || directCode.trim().toUpperCase();
      // Nếu mã vẫn chứa tiền tố NM thì tách lấy phần mã cốt lõi
      if (resolvedOrderCode.startsWith("NM") && resolvedOrderCode.length > 2) {
        resolvedOrderCode = resolvedOrderCode.slice(2);
      }
    } else if (memo) {
      resolvedOrderCode = extractOrderCodeFromMemo(memo);
    }

    if (!resolvedOrderCode) {
      console.warn("[Webhook] Không tìm thấy mã đơn hàng trong nội dung chuyển tiền:", memo);
      // Ghi audit log giao dịch chưa đối soát được
      await logFinancialAudit({
        entityType: "payment",
        entityId: transactionId,
        action: "UNMATCHED_PAYMENT",
        changedBy: "system_webhook",
        newValues: {
          transactionId,
          amount,
          gateway,
          memo,
          note: "Order code not found in memo narrative",
        },
      });

      return NextResponse.json(
        { success: false, error: "Cannot extract valid order code from memo or payload" },
        { status: 400 }
      );
    }

    // 9. THỰC HIỆN ĐỐI SOÁT TÀI CHÍNH & CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (F17 & F19)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const reconcileResult = await reconcileOrderPayment(
      resolvedOrderCode,
      transactionId,
      amount,
      { gateway, memo, ip }
    );

    // 9.1 Giao dịch đã được đối soát trước đó (Idempotent replay)
    if (reconcileResult.idempotent) {
      return NextResponse.json(
        {
          success: true,
          reconciled: true,
          idempotent: true,
          message: "Duplicate transaction recognized: already reconciled idempotently",
        },
        { status: 200 }
      );
    }

    // 9.2 Không tìm thấy đơn hàng trong hệ thống
    if (reconcileResult.notFound) {
      return NextResponse.json(
        {
          success: false,
          error: `Order code #${resolvedOrderCode} not found in database (HTTP 404)`,
        },
        { status: 404 }
      );
    }

    // 9.3 Khách chuyển thiếu tiền (Underpayment: amount < order.total)
    if (reconcileResult.underpayment) {
      return NextResponse.json(
        {
          success: false,
          error: reconcileResult.error || "Underpayment: transferred amount is less than order total",
          deficit: reconcileResult.deficit,
        },
        { status: 400 }
      );
    }

    // 9.4 Lỗi xử lý đối soát khác
    if (!reconcileResult.success) {
      return NextResponse.json(
        { success: false, error: reconcileResult.error || "Reconciliation failed" },
        { status: 400 }
      );
    }

    // 9.5 Đối soát thành công: đơn đã chuyển sang trạng thái 'paid' và ghi vào audit_logs
    return NextResponse.json(
      {
        success: true,
        reconciled: true,
        code: resolvedOrderCode,
        status: "paid",
        transactionId: transactionId,
        order: reconcileResult.order,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Payment Webhook Exception]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing payment webhook" },
      { status: 500 }
    );
  }
}
