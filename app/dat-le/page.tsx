"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { FoodCard } from "@/components/FoodCard";
import { CartDrawer } from "@/components/CartDrawer";
import { StickyCartBar } from "@/components/StickyCartBar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { MomoPaymentModal } from "@/components/MomoPaymentModal";
import { ThankYouModal } from "@/components/ThankYouModal";
import { ToastContainer } from "@/components/Toast";
import { CATEGORIES, MENU_ITEMS, MenuItem, Category } from "@/data/menu";
import { CartItem, OrderApiResponse, PaymentMethod } from "@/types/order";
import { checkShopOpenStatus } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";
import { UtensilsCrossed, Sparkles } from "lucide-react";

const CART_STORAGE_KEY = "nem_nui_cart_v1";

interface CompletedOrderData extends OrderApiResponse {
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  itemsSnapshot: CartItem[];
}

export default function RetailOrderPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Quản lý trạng thái mở/đóng các modal
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);

  // Lưu thông tin đơn vừa đặt thành công
  const [lastOrder, setLastOrder] = useState<CompletedOrderData | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<
    { id: string; type: "success" | "error" | "info"; message: string }[]
  >([]);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Trạng thái mở cửa
  const [shopStatus, setShopStatus] = useState({
    isOpen: true,
    message: "",
  });

  // Khởi tạo từ client (localStorage & giờ mở cửa)
  useEffect(() => {
    setIsClientLoaded(true);
    setShopStatus(checkShopOpenStatus());

    // Cập nhật trạng thái mở cửa mỗi phút
    const interval = setInterval(() => {
      setShopStatus(checkShopOpenStatus());
    }, 60000);

    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Lỗi đọc giỏ hàng từ localStorage", e);
    }

    // Tải thực đơn động mới nhất từ quán
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      })
      .catch((err) => console.error("Lỗi tải thực đơn:", err));

    return () => clearInterval(interval);
  }, []);

  // Tự động lưu giỏ hàng vào localStorage khi có thay đổi
  useEffect(() => {
    if (!isClientLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Lỗi ghi giỏ hàng vào localStorage", e);
    }
  }, [cart, isClientLoaded]);

  // Tự động thêm món nếu có query parameter ?item= (ví dụ: ?item=kit-nem-mau-thu)
  useEffect(() => {
    if (!isClientLoaded || menuItems.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetItemId = urlParams.get("item");
      if (targetItemId) {
        const found = menuItems.find((i) => i.id === targetItemId);
        if (found && found.available) {
          setCart((prev) => {
            if (prev.some((i) => i.id === found.id)) return prev;
            return [
              ...prev,
              {
                id: found.id,
                name: found.name,
                price: found.price,
                quantity: 1,
                image: found.image,
              },
            ];
          });
          showToast("success", `Đã chọn "${found.name}" vào giỏ hàng!`);
          setIsCartOpen(true);
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc query parameter:", e);
    }
  }, [isClientLoaded, menuItems]);

  // Thêm món vào giỏ
  const handleAddToCart = (item: MenuItem) => {
    if (!item.available || !shopStatus.isOpen) return;

    const maxQty = item.maxPerOrder || (item.id === "kit-nem-mau-thu" ? 1 : 99);
    const existing = cart.find((i) => i.id === item.id);
    if (existing && existing.quantity >= maxQty) {
      showToast(
        "error",
        `Món "${item.name}" là sản phẩm trợ giá, tối đa ${maxQty} phần mỗi đơn hàng!`
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ];
    });

    showToast("success", `Đã thêm "${item.name}" vào giỏ hàng`);
  };

  // Thay đổi số lượng món
  const handleUpdateQty = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const menuItem = menuItems.find((m) => m.id === id);
            const maxQty = menuItem?.maxPerOrder || (id === "kit-nem-mau-thu" ? 1 : 99);
            if (delta > 0 && item.quantity >= maxQty) {
              showToast(
                "error",
                `Kit Mẫu Thử trợ giá chỉ áp dụng tối đa ${maxQty} phần mỗi đơn hàng để đảm bảo quyền lợi dùng thử của quán!`
              );
              return item;
            }
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Xóa 1 món khỏi giỏ
  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("info", "Đã xóa món khỏi giỏ hàng");
  };

  // Xóa toàn bộ giỏ
  const handleClearCart = () => {
    setCart([]);
    showToast("info", "Đã dọn sạch giỏ hàng");
  };

  // Mở màn hình Checkout từ Cart Drawer
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Xử lý khi đặt hàng thành công từ API
  const handleOrderSuccess = (orderData: OrderApiResponse & {
    customerName: string;
    phone: string;
    address: string;
    note?: string;
  }) => {
    setIsCheckoutOpen(false);

    const completedOrder: CompletedOrderData = {
      ...orderData,
      itemsSnapshot: [...cart],
    };
    setLastOrder(completedOrder);

    if (orderData.paymentMethod === "momo") {
      // Nếu MoMo -> Mở màn quét mã MoMo
      setIsMomoOpen(true);
    } else {
      // Nếu COD -> Đi thẳng tới màn cảm ơn
      setIsThankYouOpen(true);
      // Xóa giỏ hàng khi hoàn tất COD
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  // Khi khách bấm "Tôi đã chuyển tiền" trên màn MoMo
  const handleMomoPaidConfirmed = () => {
    setIsMomoOpen(false);
    setIsThankYouOpen(true);
    // Xóa giỏ hàng khi đã xong MoMo
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // Khi khách bấm "Đặt đơn mới"
  const handleResetOrder = () => {
    setIsThankYouOpen(false);
    setLastOrder(null);
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("info", "Chào bạn, hãy chọn món ăn mới nhé!");
  };

  // Map số lượng món trong giỏ để hiển thị trên FoodCard
  const inCartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((item) => {
      map[item.id] = item.quantity;
    });
    return map;
  }, [cart]);

  // Danh sách món hiển thị công khai trên thực đơn bán lẻ (loại trừ món ẩn / kit mẫu thử trợ giá)
  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => !item.hidden);
  }, [menuItems]);

  // Đếm số lượng món theo từng danh mục (chỉ đếm các món công khai)
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: visibleMenuItems.length,
    };
    visibleMenuItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [visibleMenuItems]);

  // Lọc danh sách món ăn công khai theo danh mục đang chọn
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === "all") return visibleMenuItems;
    return visibleMenuItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, visibleMenuItems]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-28">
      {/* Thông báo Toast */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header quán */}
      <Header
        isOpen={shopStatus.isOpen}
        statusMessage={shopStatus.message}
      />

      {/* Bộ lọc danh mục món */}
      <CategoryTabs
        categories={categories}
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        itemCounts={itemCounts}
      />

      {/* Danh sách thực đơn */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {categories.find((c) => c.id === selectedCategory)?.name || "Thực đơn món ngon"}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
            {filteredMenuItems.length} món
          </span>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              inCartQty={inCartQtyMap[item.id] || 0}
              onAddToCart={handleAddToCart}
              onUpdateQty={handleUpdateQty}
              isShopOpen={shopStatus.isOpen}
            />
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto px-4 mt-8 pt-8 pb-12 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-700">
          {SHOP_CONFIG.name} • {SHOP_CONFIG.slogan}
        </p>
        <p>Địa chỉ: {SHOP_CONFIG.address}</p>
        <p>Hotline phục vụ: {SHOP_CONFIG.displayPhone}</p>
        <p className="text-slate-400 text-[11px] pt-2">
          © 2026 {SHOP_CONFIG.name}. Tất cả các quyền được bảo lưu.
        </p>
      </footer>

      {/* Thanh giỏ hàng Sticky cố định ở đáy */}
      <StickyCartBar
        totalItems={totalCartItems}
        subtotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        isShopOpen={shopStatus.isOpen}
      />

      {/* Drawer Giỏ hàng */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        isShopOpen={shopStatus.isOpen}
      />

      {/* Modal Form Điền thông tin đặt hàng */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderSuccess={handleOrderSuccess}
        showToast={showToast}
      />

      {/* Modal Thanh toán MoMo */}
      {lastOrder && (
        <MomoPaymentModal
          isOpen={isMomoOpen}
          orderCode={lastOrder.code || ""}
          total={lastOrder.total || 0}
          onPaidConfirmed={handleMomoPaidConfirmed}
          showToast={showToast}
        />
      )}

      {/* Modal Cảm ơn & Tóm tắt đơn hàng */}
      {lastOrder && (
        <ThankYouModal
          isOpen={isThankYouOpen}
          orderCode={lastOrder.code || ""}
          total={lastOrder.total || 0}
          customerName={lastOrder.customerName}
          phone={lastOrder.phone}
          address={lastOrder.address}
          note={lastOrder.note}
          paymentMethod={lastOrder.paymentMethod || "momo"}
          cartItems={lastOrder.itemsSnapshot || []}
          onResetOrder={handleResetOrder}
        />
      )}
    </main>
  );
}
