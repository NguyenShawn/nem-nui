import fs from "fs";
import path from "path";
import { MENU_ITEMS, CATEGORIES, MenuItem, Category } from "@/data/menu";

const LOCAL_MENU_PATH = path.join(process.cwd(), "data", "menu_db.json");

export interface MenuDatabaseStructure {
  categories: Category[];
  items: MenuItem[];
}

// Đảm bảo thư mục tồn tại
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Đọc toàn bộ dữ liệu menu từ JSON local
export function readLocalMenu(): MenuDatabaseStructure {
  try {
    ensureDirectoryExistence(LOCAL_MENU_PATH);
    if (!fs.existsSync(LOCAL_MENU_PATH)) {
      const initialData: MenuDatabaseStructure = {
        categories: CATEGORIES,
        items: MENU_ITEMS,
      };
      fs.writeFileSync(LOCAL_MENU_PATH, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const data = fs.readFileSync(LOCAL_MENU_PATH, "utf-8");
    const parsed = JSON.parse(data || "{}");
    return {
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : CATEGORIES,
      items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : MENU_ITEMS,
    };
  } catch (error) {
    console.error("Lỗi đọc menu database:", error);
    return {
      categories: CATEGORIES,
      items: MENU_ITEMS,
    };
  }
}

// Ghi dữ liệu menu vào JSON local
export function writeLocalMenu(data: MenuDatabaseStructure) {
  try {
    ensureDirectoryExistence(LOCAL_MENU_PATH);
    fs.writeFileSync(LOCAL_MENU_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Lỗi ghi menu database:", error);
  }
}

// Lấy danh sách tất cả món ăn
export function getMenuItems(): MenuItem[] {
  const menuData = readLocalMenu();
  return menuData.items;
}

// Lấy danh sách danh mục
export function getCategories(): Category[] {
  const menuData = readLocalMenu();
  return menuData.categories;
}

// Thêm hoặc cập nhật món ăn
export function saveMenuItem(item: MenuItem): { success: boolean; item: MenuItem } {
  const menuData = readLocalMenu();
  const existingIndex = menuData.items.findIndex((i) => i.id === item.id);

  if (existingIndex !== -1) {
    // Cập nhật món đã có
    menuData.items[existingIndex] = {
      ...menuData.items[existingIndex],
      ...item,
    };
  } else {
    // Thêm món mới
    const newItem: MenuItem = {
      ...item,
      id: item.id || `mon-${Date.now()}`,
    };
    menuData.items.push(newItem);
  }

  writeLocalMenu(menuData);
  return { success: true, item };
}

// Bật/tắt trạng thái Còn món / Hết món
export function toggleItemAvailability(id: string, newStatus?: boolean): boolean {
  const menuData = readLocalMenu();
  const itemIndex = menuData.items.findIndex((i) => i.id === id);

  if (itemIndex === -1) return false;

  const currentAvailable = menuData.items[itemIndex].available;
  menuData.items[itemIndex].available = typeof newStatus === "boolean" ? newStatus : !currentAvailable;

  writeLocalMenu(menuData);
  return true;
}

// Xóa món ăn
export function deleteMenuItem(id: string): boolean {
  const menuData = readLocalMenu();
  const initialLength = menuData.items.length;
  menuData.items = menuData.items.filter((i) => i.id !== id);

  if (menuData.items.length !== initialLength) {
    writeLocalMenu(menuData);
    return true;
  }
  return false;
}
