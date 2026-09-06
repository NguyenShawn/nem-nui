import { NextRequest, NextResponse } from "next/server";
import {
  readLocalMenu,
  saveMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
} from "@/lib/menuDb";
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/auth";
import { MenuItem } from "@/data/menu";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/menu
 * Lấy danh sách menu chi tiết cho chủ quán.
 * Xác thực an toàn qua Header (Authorization, x-admin-key, x-admin-pin).
 * Không chấp nhận URL query parameter ?pin=.
 */
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return createUnauthorizedResponse();
    }

    const menuData = readLocalMenu();
    return NextResponse.json({
      success: true,
      categories: menuData.categories,
      items: menuData.items,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/menu:", error);
    return NextResponse.json({ error: "Lỗi tải thực đơn." }, { status: 500 });
  }
}

/**
 * POST /api/admin/menu
 * Thêm món ăn mới vào thực đơn
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item, pin } = body;

    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN không chính xác.");
    }

    if (!item || !item.name || typeof item.price !== "number" || item.price < 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên món và giá bán hợp lệ." },
        { status: 400 }
      );
    }

    const newItem: MenuItem = {
      id: item.id || `mon-${Date.now()}`,
      name: String(item.name).trim(),
      price: Math.round(Number(item.price)),
      description: item.description ? String(item.description).trim() : "",
      image: item.image ? String(item.image).trim() : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      category: item.category || "nem-chinh",
      available: typeof item.available === "boolean" ? item.available : true,
      isBestSeller: Boolean(item.isBestSeller),
    };

    const result = saveMenuItem(newItem);
    return NextResponse.json({
      success: true,
      message: `Đã thêm món "${newItem.name}" thành công!`,
      item: result.item,
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/admin/menu:", error);
    return NextResponse.json({ error: "Lỗi thêm món mới." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/menu
 * Chỉnh sửa món ăn đã có
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { item, pin } = body;

    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN không chính xác.");
    }

    if (!item || !item.id || !item.name || typeof item.price !== "number" || item.price < 0) {
      return NextResponse.json(
        { error: "Thông tin món ăn cần sửa không hợp lệ." },
        { status: 400 }
      );
    }

    const updatedItem: MenuItem = {
      id: String(item.id),
      name: String(item.name).trim(),
      price: Math.round(Number(item.price)),
      description: item.description ? String(item.description).trim() : "",
      image: item.image ? String(item.image).trim() : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      category: item.category || "nem-chinh",
      available: typeof item.available === "boolean" ? item.available : true,
      isBestSeller: Boolean(item.isBestSeller),
    };

    const result = saveMenuItem(updatedItem);
    return NextResponse.json({
      success: true,
      message: `Đã cập nhật món "${updatedItem.name}" thành công!`,
      item: result.item,
    });
  } catch (error: any) {
    console.error("Lỗi PUT /api/admin/menu:", error);
    return NextResponse.json({ error: "Lỗi cập nhật món ăn." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/menu
 * Bật / tắt nhanh trạng thái Còn món / Hết món (available)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, available, pin } = body;

    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN không chính xác.");
    }

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID món ăn." }, { status: 400 });
    }

    const success = toggleItemAvailability(id, available);
    if (!success) {
      return NextResponse.json({ error: "Không tìm thấy món ăn." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật trạng thái món ăn!",
    });
  } catch (error: any) {
    console.error("Lỗi PATCH /api/admin/menu:", error);
    return NextResponse.json({ error: "Lỗi cập nhật trạng thái." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/menu
 * Xóa món ăn khỏi thực đơn
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    let id = idParam;
    let bodyPin: string | undefined;

    try {
      const body = await req.json();
      if (!id) id = body.id;
      bodyPin = body.pin;
    } catch {}

    // Xác thực qua Header hoặc body PIN (Không nhận PIN qua Query URL)
    if (!verifyAdminAuth(req, bodyPin)) {
      return createUnauthorizedResponse("Mã PIN không chính xác.");
    }

    if (!id) {
      return NextResponse.json({ error: "Vui lòng chỉ định món ăn cần xóa." }, { status: 400 });
    }

    const success = deleteMenuItem(id);
    if (!success) {
      return NextResponse.json({ error: "Không tìm thấy món ăn để xóa." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa món ăn khỏi thực đơn!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/menu:", error);
    return NextResponse.json({ error: "Lỗi xóa món ăn." }, { status: 500 });
  }
}
