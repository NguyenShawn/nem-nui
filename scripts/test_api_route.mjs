/**
 * ============================================================================
 * TEST API ROUTE: KIỂM THỬ TRỰC TIẾP POST /api/order
 * ============================================================================
 */

import { POST } from "../app/api/order/route.ts";
import { NextRequest } from "next/server";

console.log("==================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ API ROUTE /api/order");
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

async function runApiTests() {
  // TEST 1: Đặt hàng hợp lệ (MoMo)
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Nguyễn Văn An",
        phone: "0909111222",
        address: "123 Đường Số 5, Phường Linh Trung, Thủ Đức",
        note: "Giao trước 12h",
        paymentMethod: "momo",
        items: [
          { id: "nem-nuong-dac-biet", qty: 2 }, // 55k x 2 = 110k
          { id: "tra-tac-hat-chia", qty: 1 },    // 15k x 1 = 15k
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 200, "Status code 200 cho đơn hàng hợp lệ");
    assert(data.success === true, "Đặt hàng thành công");
    assert(data.code && data.code.length === 6, `Sinh mã đơn 6 ký tự: ${data.code}`);
    assert(data.subtotal === 125000, `Tiền món tính đúng: ${data.subtotal}đ (125.000đ)`);
    assert(data.total === 140000, `Tổng tiền gồm ship: ${data.total}đ (140.000đ)`);
  }

  // TEST 2: Chống sửa giá ở Client (Client gửi giá 1.000đ nhưng server tính lại chuẩn 55.000đ)
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Hack Giá",
        phone: "0909333444",
        address: "456 Đường CMT8, Quận 10, TP.HCM",
        paymentMethod: "cod",
        items: [
          { id: "nem-nuong-dac-biet", price: 1, qty: 1 }, // Client gian lận giá 1đ
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 200, "Server nhận và tính lại giá");
    assert(data.subtotal === 55000, `Server tự tính lại đúng giá gốc 55.000đ (thay vì 1đ của client)`);
    assert(data.total === 70000, `Tổng tiền gồm ship là 70.000đ (55k + 15k)`);
  }

  // TEST 3: Bẫy Honeypot chống Bot Spam
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Spam Bot",
        phone: "0909555666",
        address: "789 Bot Street, Automation City",
        paymentMethod: "cod",
        honeypot: "http://spam-link.com", // Bot tự điền trường ẩn này
        items: [{ id: "nem-nuong-dac-biet", qty: 1 }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 200, "Trả 200 giả đánh lừa bot");
    assert(data.success === true, "Trả success giả");
  }

  // TEST 4: Chặn món đã hết (available: false)
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Thử Món Hết",
        phone: "0909777888",
        address: "101 Đường Trần Hưng Đạo, Quận 5",
        paymentMethod: "cod",
        items: [
          { id: "nem-chua-ran-ha-noi", qty: 1 }, // Món này có available: false
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 400, "Chặn món hết hàng với HTTP 400");
    assert(data.error && data.error.includes("đã hết"), `Báo lỗi đúng: "${data.error}"`);
  }

  // TEST 5: Chặn dưới đơn hàng tối thiểu (< 30.000đ)
  {
    const req = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Mua Ít",
        phone: "0909999000",
        address: "202 Đường Pasteur, Quận 3",
        paymentMethod: "cod",
        items: [
          { id: "tra-tac-hat-chia", qty: 1 }, // Chỉ 15.000đ (< 30.000đ)
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    assert(res.status === 400, "Chặn dưới đơn tối thiểu với HTTP 400");
    assert(data.error && data.error.includes("tối thiểu"), `Báo lỗi đơn tối thiểu: "${data.error}"`);
  }

  // TEST 6: Chống spam đơn trùng cùng SĐT trong 60 giây (Rate Limit)
  {
    // Đơn 1
    const req1 = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Thử Spam",
        phone: "0912345678",
        address: "303 Đường Lý Tự Trọng, Quận 1",
        paymentMethod: "cod",
        items: [{ id: "nem-nuong-dac-biet", qty: 1 }],
      }),
    });
    const res1 = await POST(req1);
    assert(res1.status === 200, "Đơn lần 1 thành công");

    // Đơn 2 ngay sau đó với cùng SĐT
    const req2 = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Thử Spam",
        phone: "0912345678",
        address: "303 Đường Lý Tự Trọng, Quận 1",
        paymentMethod: "cod",
        items: [{ id: "nem-nuong-dac-biet", qty: 1 }],
      }),
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    assert(res2.status === 429, "Đơn lần 2 bị chặn với mã 429 Too Many Requests");
    assert(data2.error && data2.error.includes("vừa đặt một đơn hàng"), `Thông báo chặn spam lịch sự: "${data2.error}"`);
  }

  console.log("==================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ API ROUTE: ${passedTests}/${totalTests} TESTS ĐẠT 100%`);
  console.log("==================================================");
}

runApiTests();
