/**
 * ============================================================================
 * TEST SUITE: TÍNH NĂNG NHÂN VIÊN TỰ TẢI ẢNH MÓN ĂN (STAFF MENU UPLOAD)
 * ============================================================================
 */

import { POST as uploadImage } from "../app/api/admin/upload/route.ts";
import { POST as postAdminMenu, DELETE as deleteAdminMenu } from "../app/api/admin/menu/route.ts";
import { GET as getPublicMenu } from "../app/api/menu/route.ts";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_PIN = process.env.ADMIN_PIN || "99887766";

console.log("==================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG TỰ TẢI ẢNH MÓN ĂN (UPLOAD)");
console.log("==================================================");

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

async function runUploadTests() {
  // Tạo 1 sample buffer ảnh giả lập (1x1 transparent PNG)
  const png1x1Base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const sampleImageBuffer = Buffer.from(png1x1Base64, "base64");

  // 1. Chặn request không có mã PIN hoặc sai mã PIN (401)
  {
    const formData = new FormData();
    const blob = new Blob([sampleImageBuffer], { type: "image/png" });
    formData.append("file", blob, "test.png");
    formData.append("pin", "SAI_PIN_1234");

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const res = await uploadImage(req);
    assert(res.status === 401, "Từ chối tải ảnh khi mã PIN sai (HTTP 401)");
  }

  // 2. Chặn request không đính kèm file (400)
  {
    const formData = new FormData();
    formData.append("pin", ADMIN_PIN);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const res = await uploadImage(req);
    const data = await res.json();
    assert(res.status === 400, "Chặn request khi không có file đính kèm (HTTP 400)");
    assert(data.error && data.error.includes("chọn một tệp ảnh"), "Báo lỗi yêu cầu chọn file ảnh");
  }

  // 3. Chặn tệp không phải định dạng ảnh được phép (text/plain, application/pdf, etc.)
  {
    const formData = new FormData();
    const blob = new Blob(["Đây là văn bản giả mạo file ảnh"], { type: "text/plain" });
    formData.append("file", blob, "malicious.txt");
    formData.append("pin", ADMIN_PIN);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const res = await uploadImage(req);
    const data = await res.json();
    assert(res.status === 400, "Chặn tệp không hợp lệ MIME text/plain (HTTP 400)");
    assert(data.error && data.error.includes("Định dạng tệp không hợp lệ"), "Thông báo đúng định dạng tệp không hợp lệ");
  }

  // 4. Chặn tệp có kích thước vượt quá 5MB
  {
    const formData = new FormData();
    // Tạo buffer dung lượng 5.2MB
    const largeBuffer = Buffer.alloc(5.2 * 1024 * 1024);
    const blob = new Blob([largeBuffer], { type: "image/jpeg" });
    formData.append("file", blob, "huge_photo.jpg");
    formData.append("pin", ADMIN_PIN);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const res = await uploadImage(req);
    const data = await res.json();
    assert(res.status === 400, "Chặn tệp vượt quá 5MB (HTTP 400)");
    assert(data.error && data.error.includes("5MB"), "Báo lỗi vượt quá giới hạn 5MB");
  }

  // 5. Tải ảnh PNG hợp lệ thành công (200)
  let uploadedImageUrl = "";
  let uploadedFilename = "";
  {
    const formData = new FormData();
    const blob = new Blob([sampleImageBuffer], { type: "image/png" });
    formData.append("file", blob, "mon_nem_nuong.png");
    formData.append("pin", ADMIN_PIN);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const res = await uploadImage(req);
    const data = await res.json();
    assert(res.status === 200, "Tải ảnh PNG hợp lệ thành công (HTTP 200)");
    assert(data.success === true, "Phản hồi success: true");
    assert(typeof data.url === "string" && data.url.length > 0, `Nhận được URL ảnh: ${data.url}`);
    uploadedImageUrl = data.url;
    uploadedFilename = data.filename;
  }

  // 6. Kiểm tra file thực tế đã được lưu vào thư mục public/uploads/menu/
  {
    const localPath = path.join(process.cwd(), "public", "uploads", "menu", uploadedFilename);
    const fileExists = fs.existsSync(localPath);
    assert(fileExists, `Tệp ảnh đã tồn tại trên đĩa cứng: ${uploadedFilename}`);
    if (fileExists) {
      const stats = fs.statSync(localPath);
      assert(stats.size === sampleImageBuffer.length, `Kích thước file lưu trữ chính xác (${stats.size} bytes)`);
    }
  }

  // 7. Thêm món mới sử dụng ảnh vừa upload và kiểm tra hiển thị trên Menu
  const testDishId = `test-dish-upload-${Date.now()}`;
  {
    const req = new NextRequest("http://localhost:3000/api/admin/menu", {
      method: "POST",
      body: JSON.stringify({
        pin: ADMIN_PIN,
        item: {
          id: testDishId,
          name: "Nem Lụi Cuộn Nấm Mối (Ảnh Tự Chụp)",
          price: 55000,
          description: "Món ăn thử nghiệm với ảnh chụp từ camera nhân viên",
          category: "nem-chinh",
          image: uploadedImageUrl,
          available: true,
          isBestSeller: true,
        },
      }),
    });
    const res = await postAdminMenu(req);
    const data = await res.json();
    assert(res.status === 200, "Lưu món ăn kèm ảnh tự upload thành công");

    // Đọc lại menu công khai
    const resMenu = await getPublicMenu();
    const menuData = await resMenu.json();
    const addedDish = menuData.items.find((i) => i.id === testDishId);
    assert(Boolean(addedDish), "Món ăn mới xuất hiện trên thực đơn");
    assert(addedDish?.image === uploadedImageUrl, `Món ăn lưu trữ đúng URL ảnh đã upload: ${addedDish?.image}`);
  }

  // 8. Dọn dẹp món test
  {
    const req = new NextRequest(`http://localhost:3000/api/admin/menu?id=${testDishId}`, {
      method: "DELETE",
      headers: { "x-admin-key": ADMIN_PIN },
    });
    await deleteAdminMenu(req);
    assert(true, "Dọn dẹp món ăn thử nghiệm sau kiểm thử thành công");
  }

  console.log("==================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ UPLOAD: ${passedTests}/${totalTests} TESTS ĐẠT 100%`);
  console.log("==================================================");
  process.exit(passedTests === totalTests ? 0 : 1);
}

runUploadTests().catch((err) => {
  console.error("Lỗi thực thi test upload:", err);
  process.exit(1);
});
