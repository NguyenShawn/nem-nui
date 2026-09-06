import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, updateOrderStatusInDb, getOrderByCode } from "@/lib/orderDb";
import { SHOP_CONFIG } from "@/config/shop";
import { OrderStatus } from "@/types/order";
import {
  sendDiscordOrderCompletedNotification,
  sendDiscordOrderCancelledNotification,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

// Hàm helper xác thực mã PIN quản lý của quán
function verifyPin(req: NextRequest): boolean {
  // Lấy PIN từ Query Parameter hoặc từ Header
  const url = new URL(req.url);
  const pinParam = url.searchParams.get("pin");
  const pinHeader = req.headers.get("x-admin-pin");

  const providedPin = pinParam || pinHeader;
  return providedPin === SHOP_CONFIG.adminPin;
}

/**
 * GET /api/admin/orders
 * Lấy toàn bộ danh sách đơn hàng cho giao diện Bếp/Quản lý của quán
 */
export async function GET(req: NextRequest) {
  try {
    if (!verifyPin(req)) {
      return NextResponse.json(
        { error: "Mã PIN quản lý không chính xác hoặc đã hết hạn." },
        { status: 401 }
      );
    }

    const orders = await getAllOrders();
    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/orders:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách đơn hàng." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders
 * Cập nhật trạng thái đơn hàng (Mới -> Đang chuẩn bị -> Đang giao -> Hoàn tất/Hủy)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, status, pin, reason } = body;

    // Xác thực PIN từ body
    if (pin !== SHOP_CONFIG.adminPin) {
      return NextResponse.json(
        { error: "Mã PIN quản lý không chính xác." },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Mã đơn hàng không được để trống." },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = [
      "new",
      "preparing",
      "delivering",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const currentOrder = await getOrderByCode(code);
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng." },
        { status: 404 }
      );
    }

    const previousStatus = currentOrder.status;

    const success = await updateOrderStatusInDb(code, status, reason);
    if (!success) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng hoặc cập nhật thất bại." },
        { status: 404 }
      );
    }

    // Gửi thông báo Discord khi đơn hàng chuyển sang Hoàn tất / Giao thành công
    if (status === "completed" && previousStatus !== "completed") {
      sendDiscordOrderCompletedNotification({
        orderCode: currentOrder.code,
        customerName: currentOrder.customer_name,
        phone: currentOrder.phone,
        address: currentOrder.address,
        note: currentOrder.note,
        items: currentOrder.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
        total: currentOrder.total,
        paymentMethod: currentOrder.payment_method,
      }).catch((err) => console.warn("[Discord] Lỗi gửi thông báo hoàn tất đơn:", err));
    }

    // Gửi thông báo Discord khi đơn hàng bị hủy
    if (status === "cancelled" && previousStatus !== "cancelled") {
      const cancelReasonText =
        reason && String(reason).trim() ? String(reason).trim() : "Quán không nêu lý do cụ thể";
      sendDiscordOrderCancelledNotification({
        orderCode: currentOrder.code,
        customerName: currentOrder.customer_name,
        phone: currentOrder.phone,
        address: currentOrder.address,
        reason: cancelReasonText,
        note: currentOrder.note,
        items: currentOrder.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
        total: currentOrder.total,
        paymentMethod: currentOrder.payment_method,
      }).catch((err) => console.warn("[Discord] Lỗi gửi thông báo hủy đơn:", err));
    }

    return NextResponse.json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng #${code} thành công.`,
    });
  } catch (error: any) {
    console.error("Lỗi PATCH /api/admin/orders:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng." },
      { status: 500 }
    );
  }
}
