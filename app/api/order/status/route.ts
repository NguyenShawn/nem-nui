import { NextRequest, NextResponse } from "next/server";
import { getOrderByCode } from "@/lib/orderDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/order/status?code=ABCDEF
 * Cho phép khách hàng tra cứu trạng thái đơn hàng hiện tại theo thời gian thực
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Mã đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const order = await getOrderByCode(code.toUpperCase());

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng." },
        { status: 404 }
      );
    }

    const res = NextResponse.json({
      success: true,
      code: order.code,
      status: order.status,
      cancelReason: order.cancel_reason || null,
      momoConfirmed: order.momo_confirmed || false,
      paymentMethod: order.payment_method,
    });

    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch (error) {
    console.error("Lỗi GET /api/order/status:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống." },
      { status: 500 }
    );
  }
}
