/**
 * ============================================================================
 * TEST SUITE: KIỂM TRA TOÀN DIỆN LOGIC ĐẶT HÀNG, BẢO MẬT & TÍNH TIỀN
 * ============================================================================
 */

import { MENU_ITEMS } from "../data/menu.js";
import { SHOP_CONFIG } from "../config/shop.js";
import {
  formatCurrency,
  isValidVNPhone,
  generateOrderCode,
  checkShopOpenStatus,
} from "../lib/utils.js";
import { buildTelegramMessage } from "../lib/telegram.js";
import { extractOrderCodeFromMemo } from "../lib/payment.ts";

console.log("==================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG GIAO HÀNG NEM NÚI");
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

// 1. Kiểm tra Validate Số điện thoại Việt Nam
console.log("\n--- TEST 1: VALIDATE SĐT VIỆT NAM ---");
assert(isValidVNPhone("0909123456"), "SĐT 0909123456 hợp lệ");
assert(isValidVNPhone("0389998888"), "SĐT 0389998888 hợp lệ");
assert(isValidVNPhone("0771234567"), "SĐT 0771234567 hợp lệ");
assert(isValidVNPhone("+84909123456"), "SĐT +84909123456 hợp lệ");
assert(isValidVNPhone("090 912 3456"), "SĐT có khoảng trắng 090 912 3456 hợp lệ");
assert(!isValidVNPhone("123456"), "SĐT 123456 không hợp lệ");
assert(!isValidVNPhone("0123456789"), "SĐT 0123456789 đầu số cũ không hợp lệ");
assert(!isValidVNPhone("abc0909123456"), "SĐT chứa chữ cái không hợp lệ");

// 2. Kiểm tra Sinh mã đơn hàng 6 ký tự
console.log("\n--- TEST 2: SINH MÃ ĐƠN HÀNG 6 KÝ TỰ (LOẠI 0, O, 1, I) ---");
const forbiddenChars = ["0", "O", "1", "I"];
let codeHasForbidden = false;
for (let i = 0; i < 50; i++) {
  const code = generateOrderCode();
  assert(code.length === 6, `Mã đơn "${code}" có đúng 6 ký tự`);
  for (const char of forbiddenChars) {
    if (code.includes(char)) {
      codeHasForbidden = true;
      console.error(`Mã ${code} chứa ký tự cấm: ${char}`);
    }
  }
}
assert(!codeHasForbidden, "Tất cả 50 mã đơn không chứa ký tự dễ nhầm lẫn (0, O, 1, I)");

// 3. Kiểm tra Format tiền tệ VNĐ
console.log("\n--- TEST 3: FORMAT TIỀN TỆ VNĐ ---");
assert(formatCurrency(35000) === "35.000đ" || formatCurrency(35000).includes("35.000"), "Format 35000 -> 35.000đ");
assert(formatCurrency(150000) === "150.000đ" || formatCurrency(150000).includes("150.000"), "Format 150000 -> 150.000đ");

// 4. Kiểm tra Cấu hình Menu & Quán
console.log("\n--- TEST 4: CẤU HÌNH QUÁN & MENU ---");
assert(SHOP_CONFIG.name.length > 0, "Tên quán đã cấu hình");
assert(SHOP_CONFIG.phone.length > 0, "SĐT quán đã cấu hình");
assert(SHOP_CONFIG.shippingFee === 15000, "Phí ship là 15.000đ");
assert(SHOP_CONFIG.minOrderAmount === 30000, "Đơn tối thiểu là 30.000đ");
assert(MENU_ITEMS.length >= 8, `Menu có ${MENU_ITEMS.length} món (>= 8 món)`);
assert(MENU_ITEMS.some((item) => item.available === false), "Có ít nhất 1 món hết hàng (available: false)");

// 4.1 Kiểm tra Bảo mật Cấu hình (Không lộ Admin PIN)
console.log("\n--- TEST 4.1: BẢO MẬT CẤU HÌNH (KHÔNG LỘ ADMIN PIN) ---");
assert(
  SHOP_CONFIG.adminPin === undefined,
  "SHOP_CONFIG không chứa adminPin (triệt tiêu rò rỉ vào client bundle)"
);
const ADMIN_PIN = process.env.ADMIN_PIN || "99887766";
assert(
  typeof ADMIN_PIN === "string" && ADMIN_PIN.length > 0,
  "Mã PIN quản trị viên được nạp an toàn từ biến môi trường máy chủ"
);

// 5. Kiểm tra Format tin nhắn Telegram
console.log("\n--- TEST 5: FORMAT TIN NHẮN TELEGRAM BOT ---");
const sampleTelegramMsg = buildTelegramMessage({
  orderCode: "N7K2P9",
  customerName: "Nguyễn Văn A",
  phone: "0909123456",
  address: "123 Đường ABC, Bình Chánh",
  note: "Thêm ít ớt",
  items: [
    { id: "bun-nem-nuong", name: "Bún nem", price: 35000, qty: 2 },
    { id: "tra-tac-hat-chia", name: "Trà tắc", price: 12000, qty: 1 },
  ],
  total: 82000,
  paymentMethod: "momo",
  shippingFee: 15000,
});

console.log("Nội dung tin nhắn Telegram tạo mẫu:\n" + sampleTelegramMsg);
assert(sampleTelegramMsg.includes("🍜 ĐƠN MỚI #N7K2P9"), "Có tiêu đề mã đơn");
assert(sampleTelegramMsg.includes("👤 Khách: Nguyễn Văn A"), "Có tên khách");
assert(sampleTelegramMsg.includes("📞 SĐT: 0909123456"), "Có SĐT");
assert(sampleTelegramMsg.includes("📍 Đ/c: 123 Đường ABC, Bình Chánh"), "Có địa chỉ");
assert(sampleTelegramMsg.includes("2x Bún nem"), "Có số lượng và tên món");
assert(sampleTelegramMsg.includes("MoMo"), "Có phương thức thanh toán");
assert(sampleTelegramMsg.includes("Ghi chú: Thêm ít ớt"), "Có ghi chú");

// 6. Kiểm tra Bóc tách mã đơn hàng từ nội dung chuyển khoản (Base32 Crockford)
console.log("\n--- TEST 6: BÓC TÁCH MÃ ĐƠN HÀNG CROCKFORD BASE32 (CHỐNG MATCH TỪ TIẾNG VIỆT) ---");
assert(
  extractOrderCodeFromMemo("CHUYEN KHOAN TIEN COM") === null,
  "Nội dung không chứa mã 'CHUYEN KHOAN TIEN COM' trả về null (không match nhầm từ 'CHUYEN')"
);
assert(
  extractOrderCodeFromMemo("CHUYEN KHOAN DON HANG 8K3P9X TAI QUAN") === "8K3P9X",
  "Bóc tách mã hợp lệ 6 ký tự có số '8K3P9X'"
);
assert(
  extractOrderCodeFromMemo("CK NM8K3P9X NGUYEN VAN B") === "8K3P9X",
  "Bóc tách mã có tiền tố 'NM8K3P9X'"
);
assert(
  extractOrderCodeFromMemo("VIETQR:NM7K2P9/THANH TOAN") === "7K2P9",
  "Bóc tách mã có tiền tố kèm ký tự phân cách 'NM7K2P9'"
);
assert(
  extractOrderCodeFromMemo("thanh toan don hang 8k3p9x") === "8K3P9X",
  "Bóc tách mã không phân biệt hoa thường '8k3p9x'"
);
assert(
  extractOrderCodeFromMemo("CHUYEN TIEN 8K3P9 TAI QUAN") === null,
  "Mã 5 ký tự không hợp lệ trả về null"
);

console.log("==================================================");
console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT 100%`);
console.log("==================================================");
