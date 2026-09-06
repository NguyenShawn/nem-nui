import { NextRequest, NextResponse } from "next/server";
import { getOrderByCode, markMomoPaymentConfirmed } from "@/lib/orderDb";
import { sendDiscordMomoPaidNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

/**
 * POST /api/order/confirm-momo
 * Gọi khi khách bấm nút "Tôi đã chuyển tiền thành công" trên giao diện quét mã QR
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Mã đơn hàng không được để trống." },
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

    // Đánh dấu đã báo chuyển khoản trong DB
    await markMomoPaymentConfirmed(code.toUpperCase());

    // Bắn tin nhắn Discord thông báo cho nhân viên kiểm tra app MoMo
    sendDiscordMomoPaidNotification({
      orderCode: order.code,
      customerName: order.customer_name,
      phone: order.phone,
      total: order.total,
    }).catch((err) => console.warn("[Discord] Lỗi gửi thông báo MoMo paid:", err));

    return NextResponse.json({
      success: true,
      message: "Đã ghi nhận khách báo chuyển khoản MoMo.",
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/order/confirm-momo:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xác nhận chuyển khoản." },
      { status: 500 }
    );
  }
}
