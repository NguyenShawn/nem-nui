import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { MENU_ITEMS, CATEGORIES, MenuItem, Category } from "@/data/menu";

export interface MenuDatabaseStructure {
  categories: Category[];
  items: MenuItem[];
}

// In-Memory Cache khởi tạo từ dữ liệu chuẩn định nghĩa trong data/menu.ts
let cachedCategories: Category[] = [...CATEGORIES];
let cachedMenuItems: MenuItem[] = [...MENU_ITEMS];
let isCacheSynchronized = false;

/**
 * Đồng bộ hóa dữ liệu danh mục và món ăn từ Supabase PostgreSQL vào Cache
 */
async function syncMenuFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  try {
    const [categoriesRes, itemsRes] = await Promise.all([
      supabaseAdmin.from("categories").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("menu_items").select("*").order("created_at", { ascending: true }),
    ]);

    if (!categoriesRes.error && categoriesRes.data && categoriesRes.data.length > 0) {
      cachedCategories = categoriesRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || undefined,
      }));
    }

    if (!itemsRes.error && itemsRes.data && itemsRes.data.length > 0) {
      cachedMenuItems = itemsRes.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        description: m.description || "",
        image: m.image || "",
        category: m.category_id || "nem-chinh",
        available: Boolean(m.available),
        isBestSeller: Boolean(m.is_bestseller),
      }));
    }

    isCacheSynchronized = true;
  } catch (error) {
    console.warn("[MenuDb] Cảnh báo lỗi đồng bộ menu từ Supabase, sử dụng catalog mặc định:", error);
  }
}

// Khởi chạy đồng bộ hóa không chặn (Non-blocking background sync)
if (isSupabaseConfigured) {
  syncMenuFromSupabase().catch(() => {});
}

/**
 * Đọc toàn bộ cấu trúc Menu (Tương thích ngược với các endpoint hiện hành)
 */
export function readLocalMenu(): MenuDatabaseStructure {
  return {
    categories: cachedCategories.length > 0 ? cachedCategories : CATEGORIES,
    items: cachedMenuItems.length > 0 ? cachedMenuItems : MENU_ITEMS,
  };
}

/**
 * Lấy danh sách toàn bộ món ăn.
 * Trả về Dual-Mode Thenable Array: Cho phép vừa 'await getMenuItems()' vừa gọi đồng bộ 'getMenuItems().map(...)'.
 */
export function getMenuItems(activeOnly = false): Promise<MenuItem[]> & MenuItem[] {
  const source = cachedMenuItems.length > 0 ? cachedMenuItems : MENU_ITEMS;
  const filtered = activeOnly ? source.filter((item) => item.available) : source;

  // Khởi tạo Promise bất đồng bộ truy vấn Supabase
  const asyncPromise = (async () => {
    if (isSupabaseConfigured && !isCacheSynchronized) {
      await syncMenuFromSupabase();
    }
    const freshSource = cachedMenuItems.length > 0 ? cachedMenuItems : MENU_ITEMS;
    return activeOnly ? freshSource.filter((item) => item.available) : freshSource;
  })();

  // Đính kèm các phương thức Array và Promise Thenable để tương thích đồng bộ & bất đồng bộ 100%
  const result: any = [...filtered];
  result.then = asyncPromise.then.bind(asyncPromise);
  result.catch = asyncPromise.catch.bind(asyncPromise);
  result.finally = asyncPromise.finally.bind(asyncPromise);
  result.categories = cachedCategories;
  result.items = filtered;

  return result;
}

/**
 * Lấy toàn bộ Catalog gồm Categories và Menu Items (PROJECT.md Interface Contract 2)
 */
export async function getMenuCatalog(
  activeOnly = false
): Promise<{ categories: Category[]; items: MenuItem[] }> {
  if (isSupabaseConfigured && !isCacheSynchronized) {
    await syncMenuFromSupabase();
  }

  const items = activeOnly ? cachedMenuItems.filter((i) => i.available) : cachedMenuItems;
  return {
    categories: cachedCategories,
    items: items,
  };
}

/**
 * Lấy danh sách danh mục
 */
export function getCategories(): Category[] {
  return cachedCategories.length > 0 ? cachedCategories : CATEGORIES;
}

/**
 * Thêm mới hoặc cập nhật món ăn vào Supabase và Cache
 */
export function saveMenuItem(item: MenuItem): { success: boolean; item: MenuItem } {
  const targetId = item.id || `mon-${Date.now()}`;
  const preparedItem: MenuItem = {
    ...item,
    id: targetId,
  };

  // Cập nhật local cache ngay lập tức
  const existingIdx = cachedMenuItems.findIndex((i) => i.id === targetId);
  if (existingIdx !== -1) {
    cachedMenuItems[existingIdx] = preparedItem;
  } else {
    cachedMenuItems.push(preparedItem);
  }

  // Ghi vào Supabase bất đồng bộ
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = {
      id: targetId,
      category_id: preparedItem.category,
      name: preparedItem.name,
      price: preparedItem.price,
      description: preparedItem.description || "",
      image: preparedItem.image || "",
      available: preparedItem.available,
      is_bestseller: Boolean(preparedItem.isBestSeller),
    };

    (async () => {
      try {
        const { error } = await supabaseAdmin.from("menu_items").upsert(dbPayload);
        if (error) console.error("[MenuDb] Lỗi lưu món ăn lên Supabase:", error);
      } catch (ex) {
        console.error("[MenuDb] Ngoại lệ khi lưu món lên Supabase:", ex);
      }
    })();
  }

  return { success: true, item: preparedItem };
}

/**
 * Bật/tắt trạng thái Còn món / Hết món (available)
 */
export function toggleItemAvailability(id: string, newStatus?: boolean): boolean {
  const itemIdx = cachedMenuItems.findIndex((i) => i.id === id);
  if (itemIdx === -1) return false;

  const currentStatus = cachedMenuItems[itemIdx].available;
  const targetStatus = typeof newStatus === "boolean" ? newStatus : !currentStatus;
  cachedMenuItems[itemIdx].available = targetStatus;

  if (isSupabaseConfigured && supabaseAdmin) {
    (async () => {
      try {
        const { error } = await supabaseAdmin
          .from("menu_items")
          .update({ available: targetStatus })
          .eq("id", id);
        if (error) console.error("[MenuDb] Lỗi toggle trạng thái món trên Supabase:", error);
      } catch (ex) {
        console.error("[MenuDb] Ngoại lệ khi toggle trạng thái:", ex);
      }
    })();
  }

  return true;
}

/**
 * Xóa món ăn khỏi thực đơn
 */
export function deleteMenuItem(id: string): boolean {
  const initialLength = cachedMenuItems.length;
  cachedMenuItems = cachedMenuItems.filter((i) => i.id !== id);
  const localSuccess = cachedMenuItems.length !== initialLength;

  if (isSupabaseConfigured && supabaseAdmin) {
    (async () => {
      try {
        const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", id);
        if (error) console.error("[MenuDb] Lỗi xóa món trên Supabase:", error);
      } catch (ex) {
        console.error("[MenuDb] Ngoại lệ khi xóa món trên Supabase:", ex);
      }
    })();
  }

  return localSuccess;
}
