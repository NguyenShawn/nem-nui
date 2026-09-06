-- ============================================================================
-- SQL SCHEMA CHO SUPABASE DATABASE (CHẠY 1 LẦN TRONG SUPABASE SQL EDITOR)
-- ============================================================================

-- 1. Tạo bảng orders lưu trữ đơn hàng
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  note text,
  items jsonb not null,          -- Cấu trúc: [{id: string, name: string, price: number, qty: number}]
  total int not null,
  payment_method text not null,  -- 'momo' | 'cod'
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- 2. Tạo chỉ mục (Index) tăng tốc tìm kiếm theo mã đơn và thời gian tạo
create index if not exists idx_orders_code on orders(code);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_phone on orders(phone);

-- 3. Bật Row Level Security (RLS) để bảo vệ dữ liệu
-- Lưu ý: Không tạo policy nào cho anonymous role (anon)
-- Chỉ có Server thông qua SUPABASE_SERVICE_ROLE_KEY mới có quyền INSERT / SELECT
alter table orders enable row level security;
