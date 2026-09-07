import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getAllOrders,
  updateOrderStatusInDb,
  getOrderByCode,
  deleteOrderFromDb,
  clearOrderHistoryFromDb,
} from "@/lib/orderDb";
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/auth";
import { OrderStatus } from "@/types/order";
import {
  sendDiscordOrderCompletedNotification,
  sendDiscordOrderCancelledNotification,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders
 * Lấy danh sách đơn hàng cho giao diện Bếp/Quản lý của quán (hỗ trợ lọc ?branchId=).
 * Xác thực an toàn qua Header (Authorization: Bearer <token>, x-admin-key, hoặc x-admin-pin).
 * Tham số URL query ?pin= bị loại bỏ hoàn toàn.
 * Đối chiếu với process.env.ADMIN_PIN (mặc định: "99887766") hoặc ADMIN_SECRET.
 * Trả về 401 Unauthorized nếu không có hoặc sai quyền quản trị.
 */
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return createUnauthorizedResponse();
    }

    const branchId =
      req.nextUrl.searchParams.get("branchId") ||
      req.nextUrl.searchParams.get("branch_id") ||
      undefined;
    const orders = await getOrders(branchId);
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

    // Xác thực PIN từ header hoặc body
    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN quản lý không chính xác.");
    }

    const cleanCode = code ? String(code).trim().toUpperCase().replace(/^#/, "") : "";
    if (!cleanCode) {
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

    const currentOrder = await getOrderByCode(cleanCode);
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng." },
        { status: 404 }
      );
    }

    const previousStatus = currentOrder.status;

    const success = await updateOrderStatusInDb(cleanCode, status, reason);
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

/**
 * DELETE /api/admin/orders
 * Xóa vĩnh viễn 1 đơn hàng theo mã đơn hoặc dọn dẹp sạch toàn bộ lịch sử đơn
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, clearAllHistory, pin } = body;

    // Xác thực PIN từ header hoặc body
    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN quản lý không chính xác.");
    }

    if (clearAllHistory) {
      await clearOrderHistoryFromDb();
      return NextResponse.json({
        success: true,
        message: "Đã dọn dẹp sạch toàn bộ lịch sử đơn hàng đã giao và đã hủy.",
      });
    }

    const cleanCode = code ? String(code).trim().toUpperCase().replace(/^#/, "") : "";
    if (!cleanCode) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã đơn hàng cần xóa." },
        { status: 400 }
      );
    }

    const success = await deleteOrderFromDb(cleanCode);
    if (!success) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng cần xóa hoặc xóa thất bại." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa vĩnh viễn đơn hàng #${cleanCode}.`,
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/orders:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa đơn hàng." },
      { status: 500 }
    );
  }
}

