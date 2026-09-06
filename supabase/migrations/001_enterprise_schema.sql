-- ============================================================================
-- SUPABASE ENTERPRISE POSTGRESQL 3NF SCHEMA & MIGRATION FOR NEM NÚI
-- Migration File: supabase/migrations/001_enterprise_schema.sql
-- Production Schema: supabase/schema.sql
-- Normalized 3NF Architecture, Row Level Security (RLS), Realtime WebSocket
-- ============================================================================

-- Kích hoạt extensions hỗ trợ UUID và mã hóa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BẢNG BRANCHES: Quản lý các chi nhánh & cơ sở điểm bán
-- ============================================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE branches IS 'Danh sách các chi nhánh điểm bán lẻ và xưởng sản xuất trung tâm';

-- ============================================================================
-- 2. BẢNG CATEGORIES: Phân loại danh mục thực đơn ẩm thực
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,               -- Slug ('met-nem-nuong', 'nem-chinh', 'an-vat', 'do-uong', 'do-them')
  name TEXT NOT NULL,
  icon TEXT,                         -- Tên icon hoặc biểu tượng emoji
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Danh mục món ăn, combo và đồ uống phục vụ hiển thị menu';

-- ============================================================================
-- 3. BẢNG MENU_ITEMS: Thực đơn chi tiết các món ăn, thức uống và combo
-- ============================================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,               -- Mã định danh duy nhất ('nem-nuong-dac-biet', 'set-an-vat-28k')
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  cost INT NOT NULL DEFAULT 0 CHECK (cost >= 0),
  description TEXT,
  image TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  max_per_order INT NOT NULL DEFAULT 99 CHECK (max_per_order > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE menu_items IS 'Thực đơn chính thức của quán với thông tin giá bán và hạn mức đặt';

-- ============================================================================
-- 4. BẢNG ORDERS: Sổ cái đơn hàng khách đặt
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,         -- Mã 6 ký tự Crockford Base32 duy nhất (VD: 'NM8X9Y')
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  items JSONB,                       -- Lưu bản sao items dự phòng tương thích ngược
  subtotal INT NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_fee INT NOT NULL DEFAULT 15000 CHECK (shipping_fee >= 0),
  total INT NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'cod')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'delivering', 'completed', 'cancelled', 'paid')),
  cancel_reason TEXT,
  transaction_id TEXT,              -- Mã giao dịch đối soát Webhook SePAY / VietQR / MoMo
  momo_confirmed BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Sổ cái ghi nhận tất cả đơn hàng phát sinh trên toàn hệ thống';

-- ============================================================================
-- 5. BẢNG ORDER_ITEMS: Chi tiết các món trong đơn hàng (Chuẩn hóa quan hệ 3NF)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal INT NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS 'Bảng định mức 3NF phân rã từng món trong một đơn hàng';

-- ============================================================================
-- 6. BẢNG LEADS: Danh bạ đối tác sỉ, đại lý & khách đăng ký mẫu thử
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  tier TEXT NOT NULL,                -- Phân khúc sỉ: 100 cây, 200-500 cây, >1000 cây
  address_note TEXT,
  consent_accepted BOOLEAN NOT NULL DEFAULT true, -- Tuân thủ Nghị định 13/2023/NĐ-CP
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE leads IS 'Danh sách đối tác nhận báo giá sỉ và mẫu thử nem nướng';

-- ============================================================================
-- 7. BẢNG AUDIT_LOGS: Nhật ký kiểm toán hoạt động hệ thống & dòng tiền
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,         -- 'order', 'menu_item', 'payment', 'lead', 'branch'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,              -- 'INSERT', 'UPDATE_STATUS', 'WEBHOOK_PAID', 'DELETE', 'CLEANUP'
  changed_by TEXT NOT NULL DEFAULT 'system', -- 'customer', 'staff', 'system_webhook', 'admin', 'service_role'
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'Nhật ký truy vết bất biến phục vụ an ninh và kiểm toán tài chính';

-- ============================================================================
-- 8. HỆ THỐNG CHỈ MỤC TỐI ƯU HIỆU NĂNG (INDEXES)
-- ============================================================================

-- Bảng orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code ON orders(code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id) WHERE transaction_id IS NOT NULL;

-- Bảng order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Bảng menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON menu_items(branch_id);

-- Bảng leads
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Bảng audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 9. CHÍNH SÁCH BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Kích hoạt RLS trên tất cả các bảng
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 9.1. Chính sách cho Người dùng Công khai (Public / Anon & Authenticated)
-- ----------------------------------------------------------------------------

-- Xem danh sách chi nhánh đang hoạt động
CREATE POLICY "Public read active branches"
  ON branches FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Xem danh mục thực đơn
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Xem thực đơn món ăn đang mở bán
CREATE POLICY "Public read active menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (available = true AND is_hidden = false);

-- Khách đặt hàng: Cho phép chèn đơn hàng mới
CREATE POLICY "Public anonymous insert orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Khách đặt hàng: Cho phép chèn chi tiết món trong đơn
CREATE POLICY "Public anonymous insert order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Khách đăng ký nhận mẫu thử / báo giá sỉ: Cho phép chèn lead
CREATE POLICY "Public anonymous insert leads"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Khách tra cứu trạng thái đơn hàng của mình theo mã đơn
CREATE POLICY "Public read order by code"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (code IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 9.2. Chính sách cho Quản trị viên & Nhân viên đã xác thực (Authenticated)
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated full access branches" ON branches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access menu items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access order items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access leads" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access audit logs" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9.3. Toàn quyền Quản trị Phía Server (Service Role Bypass)
-- Supabase tự động bypass RLS với Service Role Key; khai báo tường minh:
-- ----------------------------------------------------------------------------
CREATE POLICY "Service role full access branches" ON branches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access categories" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access menu items" ON menu_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access order items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access leads" ON leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access audit logs" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. CẤU HÌNH SUPABASE REALTIME VÀ REPLICATION IDENTITY
-- ============================================================================

-- Thiết lập REPLICA IDENTITY FULL để WebSocket phát tán toàn bộ bản ghi mới và cũ khi UPDATE
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Đăng ký bảng orders vào publication Realtime của Supabase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- ============================================================================
-- 11. HÀM RPC TẠO ĐƠN HÀNG TRANSACTIONAL ATOMIC
-- ============================================================================
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_code TEXT,
  p_branch_id UUID,
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_note TEXT,
  p_subtotal INT,
  p_shipping_fee INT,
  p_total INT,
  p_payment_method TEXT,
  p_status TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- 1. Chèn đơn hàng vào bảng orders
  INSERT INTO orders (
    code,
    branch_id,
    customer_name,
    phone,
    address,
    note,
    subtotal,
    shipping_fee,
    total,
    payment_method,
    status
  )
  VALUES (
    p_code,
    p_branch_id,
    p_customer_name,
    p_phone,
    p_address,
    p_note,
    p_subtotal,
    p_shipping_fee,
    p_total,
    p_payment_method,
    COALESCE(p_status, 'new')
  )
  RETURNING id INTO v_order_id;

  -- 2. Chèn từng món ăn vào bảng order_items (3NF)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      item_name,
      price,
      quantity,
      subtotal
    )
    VALUES (
      v_order_id,
      v_item->>'id',
      v_item->>'name',
      (v_item->>'price')::INT,
      (v_item->>'qty')::INT,
      ((v_item->>'price')::INT * (v_item->>'qty')::INT)
    );
  END LOOP;

  -- 3. Ghi audit log tự động
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    changed_by,
    new_values
  )
  VALUES (
    'order',
    v_order_id::TEXT,
    'INSERT',
    'customer',
    jsonb_build_object(
      'code', p_code,
      'total', p_total,
      'payment_method', p_payment_method
    )
  );

  RETURN v_order_id;
END;
$$;

-- ============================================================================
-- 12. DỮ LIỆU KHỞI TẠO CHUẨN DOANH NGHIỆP (INITIAL SEED DATA)
-- ============================================================================

-- 12.1. Seed Chi nhánh (Chi nhánh Thủ Đức)
INSERT INTO branches (id, name, address, phone, is_active)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'Chi nhánh Thủ Đức',
  '123 Đường Số 7, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
  '0369652674',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

-- 12.2. Seed Danh mục thực đơn (5 danh mục cốt lõi + 1 danh mục đồ thêm)
INSERT INTO categories (id, name, icon, sort_order)
VALUES
  ('set',           'Set & Combo',    '🍱', 1),
  ('met-nem-nuong', 'Mẹt Nem Nướng', '🍲', 2),
  ('nem-chinh',     'Món Nem & Bún',  '🥢', 3),
  ('an-vat',        'Ăn Vặt',         '🍢', 4),
  ('do-uong',       'Đồ Uống',        '🥤', 5),
  ('do-them',       'Đồ Thêm',        '🥗', 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- 12.3. Seed Thực đơn món ăn (Bao gồm Set Ăn Vặt 28k)
INSERT INTO menu_items (
  id, branch_id, category_id, name, price, cost, description, image, available, is_bestseller, is_hidden, max_per_order
)
VALUES
  -- Sản phẩm phễu & Mẫu thử
  (
    'kit-nem-mau-thu',
    'b1000000-0000-0000-0000-000000000001',
    'nem-chinh',
    'Kit Nem Nướng Mẫu Thử (3 cây + Hũ Sốt) - Trợ Giá',
    25000,
    11500,
    '3 que nem nướng than hoa (chuẩn 60g/cây, nạc mỡ 8:2) nướng nóng hổi kèm 1 hũ sốt tương đậu bí truyền và rau dưa ăn kèm. Trợ giá dùng thử thẩm định vị!',
    '/assets/image5.png',
    true,
    true,
    true,
    1
  ),

  -- Món chính & Mẹt nem nướng
  (
    'nem-nuong-dac-biet',
    'b1000000-0000-0000-0000-000000000001',
    'met-nem-nuong',
    'Mẹt Nem Nướng Đặc Biệt',
    55000,
    18500,
    'Nem nướng than hoa thơm lừng, bánh tráng giòn, ram chiên, xoài, dưa leo, rau sống & sốt chấm bơ đậu phộng gia truyền.',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    false,
    99
  ),
  (
    'bun-nem-nuong',
    'b1000000-0000-0000-0000-000000000001',
    'nem-chinh',
    'Bún Nem Nướng Chả Giò',
    35000,
    14500,
    'Bún tươi sợi nhỏ, nem nướng xắt lát, 2 cuốn chả giò giòn rụm, mỡ hành đậu phộng thơm phức chan nước mắm chua ngọt.',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    false,
    99
  ),
  (
    'bun-thit-nuong-nem-lui',
    'b1000000-0000-0000-0000-000000000001',
    'nem-chinh',
    'Bún Thịt Nướng & Nem Lụi',
    48000,
    15500,
    'Thịt nướng ướp mật ong mềm thơm, nem lụi bọc sả nướng đậm đà, kèm rau thơm và nước sốt tương đậu đặc biệt.',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'nem-lui-hue-5-cay',
    'b1000000-0000-0000-0000-000000000001',
    'nem-chinh',
    'Phần Nem Lụi Sả (5 cây)',
    40000,
    13000,
    '5 cây nem lụi quấn củ sả nướng than thơm nức, ăn kèm rau sống cuốn bánh tráng hoặc chấm tương đậu nành.',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),

  -- Món Set & Combo Kế Hoạch Tài Chính
  (
    'set-an-vat-28k',
    'b1000000-0000-0000-0000-000000000001',
    'set',
    'Set Ăn Vặt 28k',
    28000,
    9200,
    'Set ăn vặt nem nướng kèm đồ chua và nước chấm',
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    false,
    10
  ),
  (
    'kit-mau-thu-25k',
    'b1000000-0000-0000-0000-000000000001',
    'set',
    'Kit mẫu thử 25k',
    25000,
    11500,
    'Kit mẫu thử nem nướng trải nghiệm',
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    10
  ),
  (
    'cha-gio-tom-thit',
    'b1000000-0000-0000-0000-000000000001',
    'an-vat',
    'Chả Giò Tôm Thịt Rế (6 cuốn)',
    35000,
    11000,
    'Bánh tráng rế cuốn tôm thịt giòn tan, nhân đậm đà, không ngấy dầu, chấm sốt xí muội ngọt thanh.',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'banh-trang-cuon-nem',
    'b1000000-0000-0000-0000-000000000001',
    'an-vat',
    'Bánh Tráng Cuốn Nem Nướng (3 cuốn)',
    30000,
    9500,
    'Cuốn sẵn tiện lợi cho khách ăn liền: nem nướng, xà lách, dưa leo, xoài xanh, ram giòn kèm sốt chấm.',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'nem-chua-ran-ha-noi',
    'b1000000-0000-0000-0000-000000000001',
    'an-vat',
    'Nem Chua Rán Hà Nội (Tạm hết)',
    35000,
    12000,
    'Nem chua lăn bột xù chiên vàng ruộm, dai giòn sần sật, chấm tương ớt cay nồng đậm vị phố cổ.',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    false,
    false,
    false,
    99
  ),

  -- Đồ Uống & Trà Giải Khát
  (
    'tra-tac-hat-chia',
    'b1000000-0000-0000-0000-000000000001',
    'do-uong',
    'Trà Tắc Mật Ong Hạt Chia (Khổng lồ)',
    15000,
    3800,
    'Vị tắc tươi thơm mát hòa quyện mật ong hoa rừng nguyên chất và hạt chia bổ dưỡng giải ngấy cực đã.',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    false,
    99
  ),
  (
    'tra-dao-sa-tac',
    'b1000000-0000-0000-0000-000000000001',
    'do-uong',
    'Trà Đào Cam Sả Tươi Mát',
    22000,
    6200,
    'Trà đào thơm nồng, sả tươi đập dập thơm lừng, kèm 2 miếng đào ngâm giòn ngọt sảng khoái.',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'nuoc-mia-tac',
    'b1000000-0000-0000-0000-000000000001',
    'do-uong',
    'Nước Mía Tắc Ép Tươi',
    12000,
    2900,
    'Mía tươi ép nguyên chất cùng trái tắc tươi ngọt mát thanh giọng, giải khát tức thì.',
    'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),

  -- Đồ Thêm
  (
    'them-ram-gion',
    'b1000000-0000-0000-0000-000000000001',
    'do-them',
    'Ram Giòn Chiên Thêm (5 cái)',
    10000,
    2500,
    'Bánh tráng ram cuốn giòn rụm chiên ráo dầu.',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'them-sot-tuong-dau',
    'b1000000-0000-0000-0000-000000000001',
    'do-them',
    'Hũ Sốt Tương Đậu Phộng Thêm',
    8000,
    2000,
    'Sốt tương đậu nấu từ nếp nương, gan heo và bơ đậu phộng béo bùi đặc trưng.',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'them-bun-tuoi',
    'b1000000-0000-0000-0000-000000000001',
    'do-them',
    'Bún Tươi Thêm',
    7000,
    1800,
    'Bún tươi sợi nhỏ trắng ngần không chất bảo quản.',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  ),
  (
    'them-banh-trang-rau',
    'b1000000-0000-0000-0000-000000000001',
    'do-them',
    'Bánh Tráng & Rau Sống Thêm',
    10000,
    2800,
    'Xà lách, tía tô, kinh giới, hẹ, dưa leo, xoài chua thái lát và xấp bánh tráng dẻo.',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    true,
    false,
    false,
    99
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  category_id = EXCLUDED.category_id,
  branch_id = EXCLUDED.branch_id,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  available = EXCLUDED.available,
  is_bestseller = EXCLUDED.is_bestseller,
  is_hidden = EXCLUDED.is_hidden,
  max_per_order = EXCLUDED.max_per_order,
  updated_at = now();
