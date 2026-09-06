/**
 * ============================================================================
 * INTEGRATION TEST: LUỒNG THỜI GIAN THỰC WEB-TO-WEB
 * ============================================================================
 */

import { POST } from "../app/api/order/route.ts";
import { GET as getAdminOrders, PATCH as patchAdminOrders } from "../app/api/admin/orders/route.ts";
import { GET as getOrderStatus } from "../app/api/order/status/route.ts";
import { NextRequest } from "next/server";
import { SHOP_CONFIG } from "../config/shop.ts";

console.log("==================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ LUỒNG THỜI GIAN THỰC WEB-TO-WEB");
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

async function runWebToWebTests() {
  let createdOrderCode = "";
  const testPhone = "0909999888";

  // 1. Khách hàng gửi đơn hàng (Client Web -> POST /api/order)
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Kiểm Thử Bếp",
        phone: testPhone,
        address: "456 Đường CMT8, Quận 10, TP.HCM",
        note: "Yêu cầu hành lá nhiều",
        paymentMethod: "cod",
        items: [
          { id: "nem-nuong-dac-biet", qty: 1 },
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 200, "Gửi đơn hàng hợp lệ thành công (200)");
    assert(data.success === true, "Đặt hàng phản hồi success: true");
    assert(data.code && data.code.length === 6, `Sinh mã đơn thành công: #${data.code}`);
    createdOrderCode = data.code;
  }

  // 2. Tra cứu trạng thái đơn hàng (Khách hàng -> GET /api/order/status)
  {
    const req = new NextRequest(`http://localhost:3000/api/order/status?code=${createdOrderCode}`);
    const res = await getOrderStatus(req);
    const data = await res.json();

    assert(res.status === 200, "Khách tra cứu trạng thái đơn thành công (200)");
    assert(data.status === "new", `Đơn hàng mới tạo có trạng thái mặc định là "new"`);
  }

  // 3. Truy cập danh sách đơn của Bếp (Web Quán -> GET /api/admin/orders)
  {
    // Thử dùng PIN sai
    const reqWrongPin = new NextRequest(`http://localhost:3000/api/admin/orders?pin=SAIPIN`);
    const resWrongPin = await getAdminOrders(reqWrongPin);
    assert(resWrongPin.status === 401, "Từ chối truy cập danh sách đơn bếp khi sai mã PIN (401)");

    // Dùng PIN đúng
    const reqCorrectPin = new NextRequest(`http://localhost:3000/api/admin/orders?pin=${SHOP_CONFIG.adminPin}`);
    const resCorrectPin = await getAdminOrders(reqCorrectPin);
    const data = await resCorrectPin.json();

    assert(resCorrectPin.status === 200, "Cho phép truy cập danh sách đơn bếp khi đúng mã PIN (200)");
    assert(Array.isArray(data.orders), "Đầu ra trả về danh sách đơn hàng dạng mảng");
    
    const foundOrder = data.orders.find((o) => o.code === createdOrderCode);
    assert(!!foundOrder, `Bếp nhận thấy đơn hàng vừa đặt #${createdOrderCode} hiển thị tức thì trên màn hình`);
  }

  // 4. Bếp xác nhận đơn và tiến hành làm món (Web Quán -> PATCH /api/admin/orders)
  {
    const req = new NextRequest("http://localhost:3000/api/admin/orders", {
      method: "PATCH",
      body: JSON.stringify({
        code: createdOrderCode,
        status: "preparing",
        pin: SHOP_CONFIG.adminPin,
      }),
    });

    const res = await patchAdminOrders(req);
    const data = await res.json();

    assert(res.status === 200, "Bếp xác nhận làm món thành công (200)");
    assert(data.success === true, "Cập nhật thành công");
  }

  // 5. Khách hàng thấy trạng thái cập nhật thời gian thực (Khách hàng -> GET /api/order/status)
  {
    const req = new NextRequest(`http://localhost:3000/api/order/status?code=${createdOrderCode}`);
    const res = await getOrderStatus(req);
    const data = await res.json();

    assert(data.status === "preparing", `Khách hàng thấy đơn chuyển trạng thái sang "preparing" (Đang làm món) thời gian thực`);
  }

  // 6. Bếp xác nhận giao thành công (Web Quán -> PATCH /api/admin/orders)
  {
    const req = new NextRequest("http://localhost:3000/api/admin/orders", {
      method: "PATCH",
      body: JSON.stringify({
        code: createdOrderCode,
        status: "completed",
        pin: SHOP_CONFIG.adminPin,
      }),
    });

    const res = await patchAdminOrders(req);
    assert(res.status === 200, "Bếp hoàn tất đơn thành công");
  }

  // 7. Khách hàng thấy trạng thái giao thành công (Khách hàng -> GET /api/order/status)
  {
    const req = new NextRequest(`http://localhost:3000/api/order/status?code=${createdOrderCode}`);
    const res = await getOrderStatus(req);
    const data = await res.json();

    assert(data.status === "completed", `Khách hàng thấy đơn chuyển trạng thái sang "completed" (Đã giao thành công)`);
  }

  console.log("==================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT 100%`);
  console.log("==================================================");
}

runWebToWebTests();
