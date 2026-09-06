import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kiểm tra xem đã cấu hình Supabase chưa
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

/**
 * Supabase client sử dụng Service Role Key (Chỉ chạy trên Server)
 * Có toàn quyền bypass RLS để ghi dữ liệu đơn hàng an toàn.
 */
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
