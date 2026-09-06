# 📖 SỔ TAY KỸ THUẬT & HƯỚNG DẪN PHÁT TRIỂN HỆ THỐNG TRONG TƯƠNG LAI
## (NEM NÚI ENTERPRISE ENGINEERING PLAYBOOK & ROADMAP)

> **Tài liệu dành cho:** Senior Software Architects, Lead Developers, DevOps & Backend/Frontend Engineers.  
> **Áp dụng cho:** Hệ thống F&B "Nem Núi" (`c:/Users/ADMIN/Desktop/bussiness/Nem Núi`).  
> **Phiên bản kiến trúc:** 2.0 (Enterprise Production-Ready).  
> **Mục tiêu:** Định hướng tiêu chuẩn kỹ thuật, các nguyên tắc kiến trúc bất biến, và hướng dẫn chi tiết từng bước khi mở rộng nghiệp vụ trong tương lai (thêm chi nhánh, tích hợp cổng thanh toán, đơn vị vận chuyển 3PL, quản trị kho định lượng, thẻ thành viên...).

---

## 📑 MỤC LỤC
1. [Triết Lý Kiến Trúc & Các Nguyên Tắc Bất Biến (Invariants)](#1-triết-lý-kiến-trúc--các-nguyên-tắc-bất-biến-invariants)
2. [Sơ Đồ Kiến Trúc Toàn Hệ Thống](#2-sơ-đồ-kiến-trúc-toàn-hệ-thống)
3. [Cấu Trúc Thư Mục & Phân Tầng Trách Nhiệm](#3-cấu-trúc-thư-mục--phân-tầng-trách-nhiệm)
4. [Playbook 1: Mở Rộng Thêm Chi Nhánh Mới (Multi-Branch Scaling)](#4-playbook-1-mở-rộng-thêm-chi-nhánh-mới-multi-branch-scaling)
5. [Playbook 2: Tích Hợp Thêm Cổng Thanh Toán (VNPay, ZaloPay, PayOS)](#5-playbook-2-tích-hợp-thêm-cổng-thanh-toán-vnpay-zalopay-payos)
6. [Playbook 3: Tích Hợp Đơn Vị Vận Chuyển Thứ 3 (Ahamove, GrabExpress, Lalamove)](#6-playbook-3-tích-hợp-đơn-vị-vận-chuyển-thứ-3-ahamove-grabexpress-lalamove)
7. [Playbook 4: Quản Lý Tồn Kho & Công Thức Định Lượng (BOM - Bill of Materials)](#7-playbook-4-quản-lý-tồn-kho--công-thức-định-lượng-bom---bill-of-materials)
8. [Playbook 5: Hệ Thống Khách Hàng Thân Thiết & Tích Điểm (Loyalty & CRM)](#8-playbook-5-hệ-thống-khách-hàng-thân-thiết--tích-điểm-loyalty--crm)
9. [Quy Chuẩn Bảo Mật & Tuân Thủ Pháp Lý (Security & Compliance)](#9-quy-chuẩn-bảo-mật--tuân-thủ-pháp-lý-security--compliance)
10. [Quy Trình Kiểm Thử & Tiêu Chuẩn Nghiệm Thu Code Mới (Quality Gate Protocol)](#10-quy-trình-kiểm-thử--tiêu-chuẩn-nghiệm-thu-code-mới-quality-gate-protocol)

---

## 1. Triết Lý Kiến Trúc & Các Nguyên Tắc Bất Biến (Invariants)

Bất kỳ kỹ sư nào khi chỉnh sửa hoặc phát triển thêm tính năng mới **bắt buộc phải tuân thủ 5 nguyên tắc bất biến sau**:

### 🔴 Nguyên tắc 1: Zero Secrets in Client Bundle (Triệt tiêu bí mật ở Client)
- **CẤM:** Tuyệt đối không đặt mật khẩu, mã PIN, API key nhạy cảm hoặc secret webhook trong các file nạp vào trình duyệt (như `config/shop.ts`, `config/landing.ts`, components, client hooks).
- **QUY CHUẨN:** Mọi secret chỉ được nạp từ biến môi trường máy chủ (`process.env.*`) và chỉ được sử dụng trong thư mục `app/api/` hoặc `lib/db/` (server-side only).

### 🔴 Nguyên tắc 2: Zero Synchronous File I/O (Tuyệt đối không dùng file JSON lưu dữ liệu)
- **CẤM:** Không sử dụng `fs.readFileSync`, `fs.writeFileSync` để lưu đơn hàng hay menu.
- **QUY CHUẨN:** Mọi tương tác dữ liệu phải thông qua lớp Data Access Layer (`lib/db/`) kết nối Supabase PostgreSQL 3NF.

### 🔴 Nguyên tắc 3: Fail-Closed Security (Thất bại ở trạng thái đóng)
- **CẤM:** Không dùng chuỗi fallback bí mật (ví dụ: `secret || "default-secret"`).
- **QUY CHUẨN:** Nếu môi trường thiếu key xác thực hoặc chữ ký sai lệch, hệ thống phải **lập tức từ chối** (trả về HTTP 500 Server Unconfigured hoặc HTTP 401/403 Unauthorized).

### 🔴 Nguyên tắc 4: Server-Authoritative Calculations (Máy chủ quyết định giá trị đơn)
- **CẤM:** Không bao giờ tin tưởng giá tiền tổng (`total`) do trình duyệt gửi lên.
- **QUY CHUẨN:** Khi nhận đơn tại `POST /api/order`, máy chủ luôn đọc giá gốc từ CSDL (`menu_items`), cộng dồn số lượng và phí ship để tự tính toán lại tổng tiền.

### 🔴 Nguyên tắc 5: Idempotency & Concurrency Safety (Chống trùng lặp & xung đột)
- **QUY CHUẨN:** Mọi giao dịch tài chính (webhook thanh toán, hoàn tiền) phải ghi vết `transactionId` vào bảng `audit_logs`. Nếu nhận lại cùng một `transactionId`, hệ thống phải trả về kết quả thành công ngay lập tức mà không cộng trừ tiền hay đổi trạng thái hai lần.

---

## 2. Sơ Đồ Kiến Trúc Toàn Hệ Thống

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│  [Khách đặt hàng: / ]    [Bếp điều hành: /quan]    [Trang lẻ: /dat-le]      │
└───────────────────────┬─────────────────────────────▲───────────────────────┘
                        │ HTTP / JSON                 │ WebSocket (CDC)
                        ▼                             │
┌─────────────────────────────────────────────────────┴───────────────────────┐
│                           NEXT.JS 14 BACKEND                                │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │    Order Creation     │  │   Payment Webhook    │  │  Admin & Leads   │  │
│  │   /api/order (POST)   │  │ /api/payment/webhook │  │ /api/leads (GET) │  │
│  │ • Honeypot check      │  │ • HMAC-SHA256 verify │  │ • Bearer Auth    │  │
│  │ • 60s phone rate-limit│  │ • 300s Replay check  │  │ • 401 Protection │  │
│  │ • Crockford Base32    │  │ • Base32 Regex parser│  └──────────────────┘  │
│  │ • COD Deposit >150k   │  │ • Audit Idempotency  │                        │
│  └───────────┬───────────┘  └──────────┬───────────┘                        │
│              │                         │                                    │
│              ▼                         ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 DATA ACCESS LAYER (lib/db/ - Zero fs)                 │  │
│  │   orders.ts        menu.ts        leads.ts        audit.ts            │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ SQL / RPC
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL 3NF                              │
│                                                                             │
│  [branches]  ──< [orders] ──< [order_items] >── [menu_items] >── [categories]│
│                     │                                                       │
│               [audit_logs]                       [leads]                    │
│                                                                             │
│  • Row Level Security (RLS)              • Realtime CDC Replication         │
│  • Unique Order Code Retry (23505)       • Atomic Stored Procedures         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cấu Trúc Thư Mục & Phân Tầng Trách Nhiệm

Khi bổ sung tính năng mới, hãy đặt code vào đúng tầng quy định:

```
Nem Núi/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # Serverless Endpoints (Server-only logic)
│   │   ├── admin/                # API quản trị (yêu cầu Bearer Token)
│   │   ├── order/                # API tạo và tra cứu đơn hàng
│   │   ├── payment/webhook/      # Webhook tiếp nhận thanh toán từ ngân hàng
│   │   └── leads/                # API quản lý khách sỉ (bảo vệ PII)
│   ├── quan/                     # Màn hình quản lý bếp thời gian thực (KDS)
│   └── (chinh-sach-*)/           # Các trang tĩnh công bố pháp lý TMĐT
├── components/                   # React UI Components
│   ├── CheckoutModal.tsx         # Form thanh toán & Checkbox Nghị định 13
│   ├── MomoPaymentModal.tsx      # Quét mã QR MoMo & VietQR
│   ├── PrivacyConsentCheckbox.tsx# Reusable Consent Checkbox
│   ├── RealtimeStatusBadge.tsx   # Badge trạng thái WebSocket kết nối
│   └── landing/                  # Components trang chủ & Footer pháp lý
├── config/                       # Master Data & Single Source of Truth
│   ├── shop.ts                   # Cấu hình cửa hàng (không chứa secret)
│   └── landing.ts                # Cấu hình nội dung trang chủ
├── data/                         # Dữ liệu tĩnh dự phòng (Menu SSOT)
│   └── menu.ts                   # Danh mục món ăn, giá tiền chuẩn
├── lib/                          # Core Business Logic & Helpers
│   ├── auth.ts                   # Xác thực token quản trị (timingSafeEqual)
│   ├── payment.ts                # HMAC-SHA256, Regex Crockford Base32
│   ├── supabase.ts               # Supabase Client (Anon & Service Role)
│   ├── utils.ts                  # Format tiền tệ VNĐ, sinh mã 6 ký tự
│   └── db/                       # DATA ACCESS LAYER (Tương tác CSDL 3NF)
│       ├── orders.ts             # Thao tác bảng orders, order_items
│       ├── menu.ts               # Thao tác bảng menu_items, categories
│       ├── leads.ts              # Thao tác bảng leads
│       └── audit.ts              # Ghi nhật ký tài chính bất biến audit_logs
├── supabase/
│   └── schema.sql                # 3NF Database Schema, RLS, Indexes, Triggers
└── tests/                        # HẠ TẦNG KIỂM THỬ ĐỘC LẬP
    └── e2e/                      # Bộ kiểm thử 4 tầng (344 assertions)
        ├── tier1_features.mjs    # Kiểm tra 28 tính năng
        ├── tier2_boundary.mjs    # Kiểm tra biên & tấn công giả lập
        ├── tier3_combinations.mjs# Kiểm tra phối hợp chéo tính năng
        ├── tier4_scenarios.mjs   # Kiểm tra kịch bản nghiệp vụ thực tế
        └── run_all.mjs           # Master runner chạy toàn bộ test
```

---

## 4. Playbook 1: Mở Rộng Thêm Chi Nhánh Mới (Multi-Branch Scaling)

Khi công ty mở thêm cửa hàng / chi nhánh tại quận khác hoặc tỉnh khác:

### Bước 1: Thêm chi nhánh vào CSDL
Chạy lệnh SQL trên Supabase:
```sql
INSERT INTO public.branches (id, name, slug, address, phone, is_active)
VALUES (
  'branch-binh-tan',
  'Chi Nhánh Nem Núi Bình Tân',
  'nem-nui-binh-tan',
  '456 Đường Tên Lửa, P. An Lạc A, Q. Bình Tân, TP. Hồ Chí Minh',
  '0369652674',
  true
);
```

### Bước 2: Cập nhật `config/shop.ts`
Thêm chi nhánh vào mảng danh sách chi nhánh phục vụ:
```typescript
export const BRANCHES = [
  {
    id: "branch-binh-chanh",
    name: "Xưởng Nem Núi Bình Chánh (Trụ sở chính)",
    address: "KCN Vĩnh Lộc, Xã Vĩnh Lộc A, Huyện Bình Chánh, TP.HCM",
    phone: "0369 652 674",
    isDefault: true,
  },
  {
    id: "branch-binh-tan",
    name: "Chi Nhánh Bình Tân",
    address: "456 Đường Tên Lửa, Q. Bình Tân, TP.HCM",
    phone: "0369 652 674",
    isDefault: false,
  }
];
```

### Bước 3: Lọc Realtime WebSocket theo Chi Nhánh tại Màn Hình Bếp `/quan`
Tại `app/quan/page.tsx`, thêm dropdown chọn chi nhánh. Khi nhân viên chọn chi nhánh `branchId`, cập nhật bộ lắng nghe Supabase Realtime:
```typescript
// Chỉ lắng nghe đơn hàng của chi nhánh đang chọn
const channel = supabase
  .channel(`orders-branch-${selectedBranchId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `branch_id=eq.${selectedBranchId}`, // Lọc trực tiếp từ Postgres CDC
    },
    (payload) => handleOrderEvent(payload)
  )
  .subscribe();
```

---

## 5. Playbook 2: Tích Hợp Thêm Cổng Thanh Toán (VNPay, ZaloPay, PayOS)

Khi mở rộng thêm các kênh chuyển khoản / cổng thanh toán trực tuyến:

### Bước 1: Khai báo Gateway mới vào Whitelist
Mở `Nem Núi/app/api/payment/webhook/route.ts`:
```typescript
// Bổ sung cổng mới vào Set
const SUPPORTED_GATEWAYS = new Set([
  "vietqr", "sepay", "momo", "vnpay", "zalopay", "payos", "bank_transfer", "internal"
]);
```

### Bước 2: Thêm hàm Verify chữ ký điện tử tương ứng trong `lib/payment.ts`
```typescript
export function verifyGatewaySignature(
  gateway: string,
  rawBody: string,
  headers: Headers
): boolean {
  switch (gateway) {
    case "payos": {
      const checksum = headers.get("x-payos-signature");
      const secret = process.env.PAYOS_CHECKSUM_KEY;
      if (!secret) return false;
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return timingSafeCompare(checksum || "", expected);
    }
    case "vnpay": {
      // Logic kiểm tra VNPay Secure Hash SHA512
      return verifyVnPaySecureHash(rawBody, process.env.VNPAY_HASH_SECRET);
    }
    default:
      return verifyWebhookSignature({ headers } as any, rawBody);
  }
}
```

### Bước 3: Đảm bảo tính Bất biến & Idempotency
- Không bao giờ thay đổi logic tại Bước 9 của webhook route: Mọi cổng thanh toán đều phải truyền qua `reconcileOrderPayment(resolvedOrderCode, transactionId, amount, metadata)`.
- Giao dịch trùng mã `transactionId` sẽ tự động trả về `idempotent: true` nhờ bảng `audit_logs`.

---

## 6. Playbook 3: Tích Hợp Đơn Vị Vận Chuyển Thứ 3 (Ahamove, GrabExpress, Lalamove)

Khi lượng đơn tăng cao và cần kết nối tự động gọi tài xế:

### Luồng nghiệp vụ chuẩn:
1. Đơn hàng được tạo (`orders.status = 'new'`).
2. Khách thanh toán xong hoặc chọn COD xác thực -> Đơn chuyển sang `preparing` (Bếp đang nướng nem).
3. **Hook kích hoạt**: Hệ thống tự động gọi API sang đơn vị vận chuyển để tìm tài xế.

### Thiết kế file kết nối (`lib/shipping/ahamove.ts`):
```typescript
export async function createAhamoveDeliveryOrder(order: OrderRecord) {
  const apiKey = process.env.AHAMOVE_API_KEY;
  if (!apiKey) throw new Error("Ahamove API Key unconfigured");

  const payload = {
    order_id: order.code,
    pickup: {
      address: order.branchAddress,
      mobile: "0369652674",
    },
    dropoff: {
      address: order.customerAddress,
      mobile: order.customerPhone,
      name: order.customerName,
      cod: order.paymentMethod === 'cod' ? order.total : 0,
    },
    items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
  };

  const res = await fetch("https://api.ahamove.com/v1/order/create", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return await res.json();
}
```

### Tiếp nhận Webhook từ tài xế:
Tạo route `POST /api/shipping/webhook`:
- Khi tài xế nhận đơn: Cập nhật `orders.status = 'delivering'` kèm thông tin tài xế (Tên, Biển số xe, SĐT).
- Khi giao xong: Cập nhật `orders.status = 'completed'`.
- Toàn bộ trạng thái này tự động đẩy về màn hình khách hàng thông qua Supabase Realtime CDC.

---

## 7. Playbook 4: Quản Lý Tồn Kho & Công Thức Định Lượng (BOM - Bill of Materials)

Để mở rộng thành chuỗi nhượng quyền hoặc chuỗi nhà hàng lớn kiểm soát thất thoát:

### Bước 1: Mở rộng Schema CSDL trong `supabase/schema.sql`
```sql
-- 1. Bảng nguyên vật liệu
CREATE TABLE IF NOT EXISTS public.ingredients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(32) NOT NULL,       -- kg, cây, gói, lít
  stock_quantity NUMERIC(12, 3) DEFAULT 0,
  min_alert_threshold NUMERIC(12, 3) DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng định lượng món ăn (BOM - Recipe)
CREATE TABLE IF NOT EXISTS public.recipe_items (
  menu_item_id VARCHAR(64) REFERENCES public.menu_items(id),
  ingredient_id VARCHAR(64) REFERENCES public.ingredients(id),
  quantity_required NUMERIC(12, 3) NOT NULL, -- VD: 1 đĩa nem cần 0.25kg nem sống
  PRIMARY KEY (menu_item_id, ingredient_id)
);
```

### Bước 2: Trigger tự động trừ kho và cảnh báo hết hàng
Tạo Stored Procedure trên PostgreSQL: Khi trạng thái đơn hàng chuyển sang `preparing`, hệ thống tự động trừ kho nguyên liệu. Nếu `stock_quantity <= 0`, tự động chuyển cờ `menu_items.is_available = false` để tránh việc khách đặt món không còn nguyên liệu.

---

## 8. Playbook 5: Hệ Thống Khách Hàng Thân Thiết & Tích Điểm (Loyalty & CRM)

### Nguyên tắc tuân thủ Nghị định 13/2023/NĐ-CP:
- Số điện thoại khách hàng phải được lưu trữ có sự đồng thuận rõ ràng (thông qua `PrivacyConsentCheckbox`).
- Cho phép khách hàng yêu cầu xóa dữ liệu cá nhân (`Right to Erasure`).

### Bảng tích điểm đề xuất:
```sql
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  phone_hash VARCHAR(64) PRIMARY KEY, -- SHA-256(phone + salt) để ẩn danh hóa PII
  customer_name VARCHAR(255),
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  membership_tier VARCHAR(32) DEFAULT 'standard', -- standard, silver, gold, diamond
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Quy Chuẩn Bảo Mật & Tuân Thủ Pháp Lý (Security & Compliance)

Mỗi khi phát hành bản cập nhật mới, kỹ sư phụ trách phải kiểm tra lại các yêu cầu pháp lý tại Việt Nam:

1. **Nghị định 52/2013/NĐ-CP & Nghị định 85/2021/NĐ-CP (Thương Mại Điện Tử)**:
   - Phần chân trang (`LandingFooter.tsx`) phải luôn hiển thị đầy đủ:
     * Tên đơn vị kinh doanh: **Hộ Kinh Doanh Nem Núi** (Chủ hộ: Nguyễn Trường Sơn).
     * Mã số thuế: **8492048291** do Chi cục Thuế Huyện Bình Chánh cấp.
     * Địa chỉ trụ sở sản xuất và số hotline cố định.
     * 3 liên kết chính sách: Giao hàng (`/chinh-sach-giao-hang`), Đổi trả kiểm hàng (`/chinh-sach-doi-tra`), Bảo mật thông tin (`/chinh-sach-bao-mat`).
2. **Nghị định 13/2023/NĐ-CP (Bảo Vệ Dữ Liệu Cá Nhân - PII)**:
   - Mọi form thu thập dữ liệu (đặt hàng, để lại số điện thoại khách sỉ) phải chứa `PrivacyConsentCheckbox`.
   - Checkbox **không được phép tích sẵn** (`defaultChecked = false`).
   - Khóa nút gửi form nếu khách chưa bấm đồng thuận.
3. **Chống Tấn Công Dò Quét & Brute-Force**:
   - Duy trì cơ chế Rate-Limit 60 giây giữa các lần đặt đơn trên cùng một số điện thoại (HTTP 429).
   - Duy trì trường ẩn Honeypot (`website_url`) để bẫy bot tự động.

---

## 10. Quy Trình Kiểm Thử & Tiêu Chuẩn Nghiệm Thu Code Mới (Quality Gate Protocol)

Trước khi merge bất kỳ tính năng mới nào vào nhánh `main` hoặc deploy lên Production, **bắt buộc phải thực hiện đủ 5 bước kiểm định sau**:

```
[BƯỚC 1: Static Analysis] ──► [BƯỚC 2: Unit Tests] ──► [BƯỚC 3: Master E2E Suite] ──► [BƯỚC 4: Build Check] ──► [BƯỚC 5: Secret Scan]
```

### Lệnh thực thi chi tiết:

```bash
# 1. Kiểm tra không còn hàm đọc/ghi file đồng bộ nào trong lớp DAL:
node scripts/verify_zero_fs.mjs
# Yêu cầu: "✅ STATIC CHECK PASSED: 0 occurrences"

# 2. Chạy bộ Unit & Integration tests cơ bản:
npm test
# Yêu cầu: "🎉 KẾT QUẢ KIỂM THỬ: 82/82 TESTS ĐẠT 100%"

# 3. Chạy toàn bộ 344 E2E Test Assertions (4 Tiers):
node tests/e2e/run_all.mjs
# Yêu cầu: "Total Passed: 344, Total Failed: 0, Pass Rate: 100.0%"

# 4. Kiểm tra biên dịch Production:
npm run build
# Yêu cầu: "Exit code 0, ✓ Compiled successfully"

# 5. Quét tìm secret bị rò rỉ vào bundle trình duyệt:
rg "adminPin" .next/static/
# Yêu cầu: 0 kết quả
```

> **Quy Tắc Thêm Test Cho Tính Năng Mới**: Khi bạn tạo thêm một tính năng mới (ví dụ Feature 29: Quét mã QR VNPay), bạn **bắt buộc** phải bổ sung ít nhất:
> - 5 assertions vào `tests/e2e/tier1_features.mjs`
> - 5 assertions vào `tests/e2e/tier2_boundary.mjs`
> - 1 kịch bản tích hợp vào `tests/e2e/tier4_scenarios.mjs`
> 
> Tuyệt đối không xóa bỏ các test cũ để đảm bảo không phát sinh lỗi hồi quy (Regression Bugs).
