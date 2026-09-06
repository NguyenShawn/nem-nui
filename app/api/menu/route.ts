import { NextResponse } from "next/server";
import { readLocalMenu } from "@/lib/menuDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/menu
 * API công khai lấy danh sách danh mục và thực đơn món ăn cho khách hàng
 */
export async function GET() {
  try {
    const menuData = readLocalMenu();
    return NextResponse.json({
      success: true,
      categories: menuData.categories,
      items: menuData.items,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/menu:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách món ăn." },
      { status: 500 }
    );
  }
}
