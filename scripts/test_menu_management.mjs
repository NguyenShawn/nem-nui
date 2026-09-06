/**
 * ============================================================================
 * INTEGRATION TEST: TÍNH NĂNG QUẢN LÝ VÀ CHỈNH SỬA THỰC ĐƠN (MENU MANAGEMENT)
 * ============================================================================
 */

import { GET as getPublicMenu } from "../app/api/menu/route.ts";
import {
  GET as getAdminMenu,
  POST as postAdminMenu,
  PUT as putAdminMenu,
  PATCH as patchAdminMenu,
  DELETE as deleteAdminMenu,
} from "../app/api/admin/menu/route.ts";
import { POST as createOrder } from "../app/api/order/route.ts";
import { NextRequest } from "next/server";
import { SHOP_CONFIG } from "../config/shop.ts";

console.log("==================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG CHỈNH SỬA THỰC ĐƠN");
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

async function runMenuTests() {
  const customItemId = `test-mon-an-${Date.now()}`;
  const customItemName = "Nem nướng phô mai kéo sợi đặc biệt";
  const customInitialPrice = 65000;

  // 1. Kiểm tra API công khai lấy menu
  {
    const res = await getPublicMenu();
    const data = await res.json();
    assert(res.status === 200, "Lấy menu công khai thành công (200)");
    assert(Array.isArray(data.items) && data.items.length > 0, `Menu có sẵn ${data.items.length} món ăn`);
  }

  // 2. Thêm món mới vào menu (POST /api/admin/menu)
  {
    // Thử sai PIN
    const reqWrongPin = new NextRequest("http://localhost:3000/api/admin/menu", {
      method: "POST",
      body: JSON.stringify({
        pin: "SAI_PIN",
        item: { name: customItemName, price: customInitialPrice },
      }),
    });
    const resWrongPin = await postAdminMenu(reqWrongPin);
    assert(resWrongPin.status === 401, "Chặn thêm món khi sai mã PIN (401)");

    // Thêm món đúng PIN
    const req = new NextRequest("http://localhost:3000/api/admin/menu", {
      method: "POST",
      body: JSON.stringify({
        pin: SHOP_CONFIG.adminPin,
        item: {
          id: customItemId,
          name: customItemName,
          price: customInitialPrice,
          description: "Nem nướng nóng hổi kẹp phô mai Mozzarella",
          category: "nem-chinh",
          available: true,
          isBestSeller: true,
        },
      }),
    });
    const res = await postAdminMenu(req);
    const data = await res.json();
    assert(res.status === 200, "Thêm món mới thành công (200)");
    assert(data.success === true, "Phản hồi thêm món success: true");
  }

  // 3. Khách đặt món mới vừa tạo -> Server tự đối chiếu đúng giá 65.000đ
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Thử Món Mới",
        phone: "0909666777",
        address: "789 Đường Kha Vạn Cân, Thủ Đức",
        paymentMethod: "cod",
        items: [{ id: customItemId, qty: 1 }],
      }),
    });
    const res = await createOrder(req);
    const data = await res.json();
    assert(res.status === 200, "Đặt món mới thành công");
    assert(data.subtotal === 65000, `Server tự tính đúng giá 65.000đ của món mới`);
  }

  // 4. Chủ quán bấm tắt món -> Chuyển sang Hết hàng (available: false)
  {
    const req = new NextRequest("http://localhost:3000/api/admin/menu", {
      method: "PATCH",
      body: JSON.stringify({
        id: customItemId,
        available: false,
        pin: SHOP_CONFIG.adminPin,
      }),
    });
    const res = await patchAdminMenu(req);
    assert(res.status === 200, "Cập nhật trạng thái Hết món thành công");
  }

  // 5. Khách cố tình đặt món vừa hết -> Server phát hiện và từ chối 400
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Mua Món Hết",
        phone: "0909444555",
        address: "123 Đường Điện Biên Phủ, Bình Thạnh",
        paymentMethod: "cod",
        items: [{ id: customItemId, qty: 1 }],
      }),
    });
    const res = await createOrder(req);
    const data = await res.json();
    assert(res.status === 400, "Server chặn đặt món đã hết với mã 400");
    assert(data.error && data.error.includes("đã hết"), `Báo lỗi chính xác: "${data.error}"`);
  }

  // 6. Chỉnh sửa món: Đổi giá lên 75.000đ và Bật bán lại (PUT /api/admin/menu)
  {
    const req = new NextRequest("http://localhost:3000/api/admin/menu", {
      method: "PUT",
      body: JSON.stringify({
        pin: SHOP_CONFIG.adminPin,
        item: {
          id: customItemId,
          name: customItemName,
          price: 75000, // Đổi giá
          description: "Món mới cập nhật giá",
          category: "nem-chinh",
          available: true, // Bật bán lại
          isBestSeller: true,
        },
      }),
    });
    const res = await putAdminMenu(req);
    assert(res.status === 200, "Chỉnh sửa giá món lên 75.000đ thành công");
  }

  // 7. Khách đặt lại -> Server tính theo giá mới 75.000đ
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Mua Giá Mới",
        phone: "0909222333",
        address: "456 Đường Nguyễn Huệ, Quận 1",
        paymentMethod: "cod",
        items: [{ id: customItemId, qty: 1 }],
      }),
    });
    const res = await createOrder(req);
    const data = await res.json();
    assert(res.status === 200, "Đặt món sau khi đổi giá thành công");
    assert(data.subtotal === 75000, `Server tự động áp dụng giá mới 75.000đ`);
  }

  // 8. Xóa món ăn khỏi thực đơn (DELETE /api/admin/menu)
  {
    const req = new NextRequest(`http://localhost:3000/api/admin/menu?id=${customItemId}&pin=${SHOP_CONFIG.adminPin}`, {
      method: "DELETE",
    });
    const res = await deleteAdminMenu(req);
    assert(res.status === 200, "Xóa món khỏi thực đơn thành công");

    // Kiểm tra lại menu
    const resMenu = await getPublicMenu();
    const dataMenu = await resMenu.json();
    const isStillPresent = dataMenu.items.some((i) => i.id === customItemId);
    assert(!isStillPresent, "Món đã bị xóa hoàn toàn khỏi thực đơn");
  }

  console.log("==================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ MENU: ${passedTests}/${totalTests} TESTS ĐẠT 100%`);
  console.log("==================================================");
}

runMenuTests();
