# 🍜 Web App Đặt Món Ăn Một Trang - Giao Hàng Nem Núi

Ứng dụng đặt món ăn trực tuyến một trang (Single-Page Order) chuẩn **Mobile-First**, tối ưu cho các quán ăn nhỏ tại Việt Nam.

> 📘 **Sổ Tay Kỹ Thuật & Hướng Dẫn Phát Triển Tương Lai:** Xem chi tiết tại [DEVELOPMENT_GUIDE.md](file:///c:/Users/ADMIN/Desktop/bussiness/Nem%20Núi/DEVELOPMENT_GUIDE.md) để nắm các nguyên tắc bất biến (Zero Secrets, Zero fs, Fail-Closed), playbooks mở rộng chi nhánh, tích hợp cổng thanh toán mới, đơn vị vận chuyển 3PL và quản lý kho định lượng (BOM).

---

## ✨ Tính Năng Nổi Bật

- **Menu Trực Quan (Mobile-First):** Lọc món theo danh mục, hiển thị ảnh món, giá tiền VNĐ rõ ràng, gắn nhãn món bán chạy và tự động làm mờ món hết hàng (`available: false`).
- **Kiểm Tra Giờ Mở Cửa Tự Động:** Tự động phát hiện theo giờ Việt Nam (GMT+7). Ngoài giờ mở cửa sẽ hiển thị banner cảnh báo và khóa nút đặt hàng.
- **Giỏ Hàng & Sticky Bar:** Lưu giỏ hàng vào `localStorage` không sợ mất khi tải lại trang; tự động cộng phí ship; chặn đặt nếu chưa đạt đơn hàng tối thiểu.
- **Form Đặt Hàng & Bảo Mật:** Validate tiếng Việt chuẩn (Họ tên, SĐT Việt Nam, Địa chỉ chi tiết), tích hợp bẫy **Honeypot** chống bot spam.
- **Tính Tiền Phía Server (Anti-Cheat):** Server tự động đối chiếu giá từ `data/menu.ts`, không tin giá từ client gửi lên.
- **Thanh Toán MoMo QR & COD:** Tự động tạo mã đơn ngẫu nhiên 6 ký tự (bỏ ký tự dễ nhầm lẫn như `0`, `O`, `1`, `I`), sinh mã QR MoMo và hướng dẫn chuyển khoản.
- **Gửi Đơn Telegram Tức Thì:** Gửi thông báo chi tiết đơn hàng trực tiếp về Telegram của chủ quán/nhóm nhân viên.
- **Lưu Database Supabase:** Lưu đơn hàng vào bảng `orders` an toàn với Row Level Security (RLS).

---

## 🛠️ Cấu Trúc Dự Án

```
Giao hàng Nem Núi/
├── config/
│   └── shop.ts               # Cấu hình thông tin quán, SĐT, giờ mở cửa, phí ship, MoMo...
├── data/
│   └── menu.ts               # Danh mục & 10 món ăn mẫu (Nem nướng, bún, trà tắc...)
├── types/
│   └── order.ts              # Type definitions
├── lib/
│   ├── supabase.ts           # Supabase client (Service Role)
│   ├── telegram.ts           # Gửi thông báo Telegram Bot
│   └── utils.ts              # Format VNĐ, validate SĐT, tạo mã đơn, kiểm tra giờ mở cửa
├── components/
│   ├── Header.tsx            # Header quán, hotline, giờ phục vụ
│   ├── CategoryTabs.tsx      # Thanh lọc danh mục trượt ngang
│   ├── FoodCard.tsx          # Card món ăn kèm nút thêm giỏ
│   ├── CartDrawer.tsx        # Drawer giỏ hàng, tăng/giảm số lượng
│   ├── StickyCartBar.tsx     # Thanh giỏ hàng dính đáy màn hình
│   ├── CheckoutModal.tsx     # Form thông tin giao hàng & Honeypot
│   ├── MomoPaymentModal.tsx  # Màn thanh toán MoMo QR + mã đơn
│   ├── ThankYouModal.tsx     # Màn cảm ơn & tóm tắt đơn
│   └── Toast.tsx             # Thông báo nhanh
├── app/
│   ├── layout.tsx            # Layout gốc & viewport mobile
│   ├── page.tsx              # Trang chính tích hợp toàn bộ luồng
│   ├── globals.css           # Cấu hình Tailwind CSS & hiệu ứng
│   └── api/
│       └── order/
│           └── route.ts      # Serverless API POST /api/order
├── supabase/
│   └── schema.sql            # Script SQL tạo bảng orders trên Supabase
├── public/
│   └── momo-qr.png           # Ảnh QR MoMo mẫu
├── .env.example              # Mẫu biến môi trường
└── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Local)

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Thiết lập biến môi trường
Tạo file `.env.local` từ mẫu `.env.example`:
```env
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 3. Chạy môi trường Development
```bash
npm run dev
```
Truy cập `http://localhost:3000` trên trình duyệt hoặc chế độ Responsive Mobile (375px) để trải nghiệm.

### 4. Build kiểm tra sản phẩm
```bash
npm run build
```

---

## ⚙️ Hướng Dẫn Tùy Chỉnh

### 1. Đổi thông tin quán, Hotline & MoMo
Mở file `config/shop.ts` để sửa:
- `name`: Tên quán
- `slogan`: Câu slogan quán
- `phone`: Số điện thoại hotline (khách bấm gọi)
- `openingHours`: Giờ mở cửa / đóng cửa
- `shippingFee`: Phí giao hàng (VNĐ)
- `minOrderAmount`: Giá trị đơn tối thiểu
- `momo`: Số điện thoại & tên chủ tài khoản MoMo

### 2. Đổi món ăn và giá
Mở file `data/menu.ts` để thêm, sửa, xóa món ăn hoặc danh mục.
- Đặt `available: false` nếu món ăn đó tạm hết.

### 3. Tạo bảng trên Supabase
1. Vào Supabase Dashboard -> **SQL Editor**.
2. Sao chép toàn bộ nội dung trong file `supabase/schema.sql` và nhấn **Run**.
3. Vào **Project Settings -> API** để lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Lấy Telegram Bot Token & Chat ID
1. Chat với `@BotFather` trên Telegram -> gõ `/newbot` để tạo bot và nhận `TELEGRAM_BOT_TOKEN`.
2. Tạo 1 nhóm Telegram (hoặc chat trực tiếp với bot) rồi thêm bot vào nhóm.
3. Chat với `@userinfobot` hoặc `@RawDataBot` để lấy `TELEGRAM_CHAT_ID` của nhóm.

---

## 🌐 Triển Khai Lên Vercel
1. Đẩy mã nguồn lên GitHub.
2. Truy cập [Vercel](https://vercel.com) -> New Project -> Import Repository.
3. Trong phần **Environment Variables**, thêm 4 biến môi trường:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Bấm **Deploy**.
