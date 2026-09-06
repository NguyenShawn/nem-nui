import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Resilient Supabase Client Provider
 * Supports Service Role Client (Server-side bypass) and Anon Public Client (Client-side / Realtime)
 */
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kiểm tra tính khả dụng của cấu hình Supabase
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
);

/**
 * Supabase Admin Client sử dụng Service Role Key (Chỉ chạy trên Server-side).
 * Bypasses Row Level Security (RLS) để ghi đơn hàng, quản lý menu, leads, audit logs.
 */
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * Supabase Public Client sử dụng Anon Key (Sử dụng cho Realtime WebSockets và client-side).
 */
export const supabaseClient: SupabaseClient | null =
  supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey)
    ? createClient(supabaseUrl, (supabaseAnonKey || supabaseServiceRoleKey)!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      })
    : null;

/**
 * Helper an toàn để lấy Supabase Client
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin Client chưa được cấu hình. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong biến môi trường."
    );
  }
  return supabaseAdmin;
}

let browserClient: SupabaseClient | null = null;

/**
 * Singleton Supabase client for browser-side Realtime subscriptions.
 * Safely initializes or returns a browser Supabase client using
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Returns null safely during SSR or when public credentials are not set.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && anonKey) {
      browserClient = createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } else if (supabaseClient) {
      browserClient = supabaseClient;
    }
  }
  return browserClient;
}

