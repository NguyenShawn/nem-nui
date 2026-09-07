import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/admin/upload
 * Endpoint tải ảnh món ăn từ thiết bị dành cho nhân viên / chủ quán.
 * Bảo mật: Yêu cầu mã PIN quản trị viên (qua x-admin-pin header hoặc formData).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pin = (formData.get("pin") as string | null) || undefined;

    // 1. Xác thực quyền quản trị viên
    if (!verifyAdminAuth(req, pin)) {
      return createUnauthorizedResponse("Mã PIN không chính xác.");
    }

    // 2. Kiểm tra tệp đính kèm
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Vui lòng chọn một tệp ảnh để tải lên." },
        { status: 400 }
      );
    }

    // 3. Kiểm tra định dạng MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Định dạng tệp không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF." },
        { status: 400 }
      );
    }

    // 4. Kiểm tra kích thước tệp (Tối đa 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dung lượng ảnh vượt quá giới hạn 5MB. Vui lòng nén hoặc chọn ảnh nhỏ hơn." },
        { status: 400 }
      );
    }

    // 5. Chuẩn hóa tên tệp chống trùng lặp và tấn công đường dẫn
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
        ? "gif"
        : "jpg";
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `dish-${Date.now()}-${randomSuffix}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Thử lưu lên Supabase Storage (nếu đã cấu hình)
    let remoteUrl: string | null = null;
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("menu_images")
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("menu_images")
            .getPublicUrl(filename);
          if (publicUrlData?.publicUrl) {
            remoteUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        // Tự động dự phòng về lưu trữ local mà không làm gián đoạn người dùng
      }
    }

    // 7. Luôn lưu bản sao vào Local Storage (public/uploads/menu/) để đảm bảo hoạt động độc lập
    const uploadDir = path.join(process.cwd(), "public", "uploads", "menu");
    await fs.mkdir(uploadDir, { recursive: true });
    const localFilePath = path.join(uploadDir, filename);
    await fs.writeFile(localFilePath, buffer);

    const relativeLocalUrl = `/uploads/menu/${filename}`;
    const finalUrl = remoteUrl || relativeLocalUrl;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      filename,
      size: file.size,
      mimeType: file.type,
      message: "Tải ảnh lên thành công!",
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/admin/upload:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải ảnh lên máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
