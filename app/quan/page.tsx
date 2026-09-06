"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Bell,
  BellOff,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShoppingBag,
  TrendingUp,
  Lock,
  ChevronRight,
  Loader2,
  Calendar,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Flame,
  Check,
  X,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import { OrderRecord, OrderStatus } from "@/types/order";
import { MenuItem, Category, CATEGORIES, MENU_ITEMS } from "@/data/menu";
import { formatCurrency } from "@/lib/utils";
import { SHOP_CONFIG } from "@/config/shop";

export default function StoreDashboard() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");
  
  // Quản lý chế độ xem chính: "orders" (Đơn hàng) hoặc "menu" (Thực đơn)
  const [mainView, setMainView] = useState<"orders" | "menu">("orders");

  // State Đơn hàng
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState<"pending" | "processing" | "history">("pending");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundMutedTemporarily, setSoundMutedTemporarily] = useState(false);
  const prevOrderCodesRef = useRef<Set<string>>(new Set());

  // State Menu (Khởi tạo sẵn danh sách món mặc định)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // State Modal Thêm / Sửa Món
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formCategory, setFormCategory] = useState("nem-chinh");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formAvailable, setFormAvailable] = useState(true);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [menuFormError, setMenuFormError] = useState("");

  // Toast thông báo nhỏ
  const [toastMessage, setToastMessage] = useState("");

  // Modal xác nhận làm mới dữ liệu
  const [isReloadModalOpen, setIsReloadModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleConfirmReload = async () => {
    setIsReloadModalOpen(false);
    if (mainView === "orders") {
      await fetchOrders(false);
    } else {
      await fetchMenu();
    }
    showToast("Đã làm mới dữ liệu thành công");
  };

  // Âm thanh báo đơn hàng mới chuẩn nhà hàng (3 nốt Đô - Mi - Sol vang dội)
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, start: number, duration: number, vol = 0.35) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Đô (523Hz) -> Mi (659Hz) -> Sol (784Hz)
      playTone(523.25, 0.0, 0.28, 0.35);
      playTone(659.25, 0.14, 0.28, 0.35);
      playTone(783.99, 0.28, 0.55, 0.45);

    } catch (e) {
      console.warn("Không thể phát âm thanh thông báo:", e);
    }
  };

  // Chuông báo động lặp lại liên tục mỗi 4 giây cho đến khi bếp bấm nhận đơn
  useEffect(() => {
    if (!isAuthenticated || !soundEnabled || soundMutedTemporarily) return;

    const hasNew = orders.some((o) => o.status === "new");
    if (!hasNew) {
      setSoundMutedTemporarily(false);
      return;
    }

    const alarmInterval = setInterval(() => {
      playNewOrderSound();
    }, 4000);

    return () => clearInterval(alarmInterval);
  }, [isAuthenticated, soundEnabled, soundMutedTemporarily, orders]);

  // Khôi phục PIN từ sessionStorage
  useEffect(() => {
    const savedPin = sessionStorage.getItem("store_admin_pin");
    if (savedPin === SHOP_CONFIG.adminPin) {
      setPin(savedPin);
      setIsAuthenticated(true);
    }
  }, []);

  // Lấy danh sách đơn hàng
  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoadingOrders(true);
    try {
      const response = await fetch(`/api/admin/orders?pin=${pin}`);
      if (!response.ok) {
        throw new Error("Không thể tải đơn hàng. Mã PIN không đúng.");
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        const fetchedOrders: OrderRecord[] = data.orders;
        
        if (prevOrderCodesRef.current.size > 0) {
          const hasNewOrder = fetchedOrders.some(
            (o) => o.status === "new" && !prevOrderCodesRef.current.has(o.code)
          );
          if (hasNewOrder) {
            setSoundMutedTemporarily(false); // Bật lại chuông khi có đơn mới tinh
            playNewOrderSound();
          }
        }
        
        const currentCodes = new Set(fetchedOrders.map((o) => o.code));
        prevOrderCodesRef.current = currentCodes;

        setOrders(fetchedOrders);
        setPinError("");
      }
    } catch (err: any) {
      setPinError(err.message || "Đã xảy ra lỗi.");
      if (!silent) setIsAuthenticated(false);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Lấy danh sách thực đơn
  const fetchMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const activePin = pin || sessionStorage.getItem("store_admin_pin") || SHOP_CONFIG.adminPin;
      const response = await fetch(`/api/admin/menu?pin=${encodeURIComponent(activePin)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          if (Array.isArray(data.categories)) setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error("Lỗi tải menu:", err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Tự động tải đơn hàng mỗi 5 giây sau khi đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchOrders(false);
    fetchMenu();

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, pin]);

  // Đăng nhập
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === SHOP_CONFIG.adminPin) {
      setIsAuthenticated(true);
      setPinError("");
      sessionStorage.setItem("store_admin_pin", pin);
      playNewOrderSound();
    } else {
      setPinError("Mã PIN đăng nhập không chính xác!");
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    sessionStorage.removeItem("store_admin_pin");
    setIsAuthenticated(false);
    setPin("");
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async (code: string, nextStatus: OrderStatus) => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status: nextStatus, pin }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.code === code ? { ...o, status: nextStatus } : o))
        );
        showToast(`Đã cập nhật đơn #${code}`);
      } else {
        alert(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi cập nhật đơn");
    }
  };

  // Bật/tắt trạng thái Còn/Hết món nhanh
  const handleToggleItemAvailability = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Cập nhật UI ngay lập tức
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, available: newStatus } : item))
    );

    try {
      const response = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, available: newStatus, pin }),
      });
      const data = await response.json();
      if (data.success) {
        showToast(newStatus ? "Món ăn đã được bật BÁN LẠI" : "Món ăn đã chuyển sang HẾT HÀNG");
      } else {
        fetchMenu(); // Khôi phục lại nếu lỗi
      }
    } catch (err) {
      console.error(err);
      fetchMenu();
    }
  };

  // Mở modal Thêm món
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("nem-chinh");
    setFormDescription("");
    setFormImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80");
    setFormIsBestSeller(false);
    setFormAvailable(true);
    setMenuFormError("");
    setIsMenuModalOpen(true);
  };

  // Mở modal Sửa món
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormImage(item.image);
    setFormIsBestSeller(Boolean(item.isBestSeller));
    setFormAvailable(item.available);
    setMenuFormError("");
    setIsMenuModalOpen(true);
  };

  // Lưu món (Thêm hoặc Sửa)
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setMenuFormError("Vui lòng nhập tên món ăn");
      return;
    }
    if (formPrice === "" || Number(formPrice) < 0) {
      setMenuFormError("Vui lòng nhập giá bán hợp lệ");
      return;
    }

    setIsSavingMenu(true);
    setMenuFormError("");

    const payloadItem: MenuItem = {
      id: editingItem ? editingItem.id : `mon-${Date.now()}`,
      name: formName.trim(),
      price: Number(formPrice),
      description: formDescription.trim(),
      image: formImage.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      category: formCategory,
      available: formAvailable,
      isBestSeller: formIsBestSeller,
    };

    const method = editingItem ? "PUT" : "POST";

    try {
      const response = await fetch("/api/admin/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: payloadItem, pin }),
      });
      const data = await response.json();
      if (data.success) {
        showToast(editingItem ? "Đã cập nhật món ăn thành công!" : "Đã thêm món mới vào thực đơn!");
        setIsMenuModalOpen(false);
        fetchMenu();
      } else {
        setMenuFormError(data.error || "Không thể lưu món ăn");
      }
    } catch (err: any) {
      setMenuFormError(err.message || "Lỗi lưu dữ liệu");
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Xóa món ăn
  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${name}" khỏi thực đơn?`)) return;

    try {
      const response = await fetch(`/api/admin/menu?id=${id}&pin=${pin}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setMenuItems((prev) => prev.filter((item) => item.id !== id));
        showToast(`Đã xóa món "${name}"`);
      } else {
        alert(data.error || "Xóa thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi xóa món");
    }
  };

  // Phân loại đơn hàng
  const pendingOrders = orders.filter((o) => o.status === "new");
  const processingOrders = orders.filter((o) => o.status === "preparing" || o.status === "delivering");
  const historyOrders = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

  const todayRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  const displayedOrders = 
    activeOrderTab === "pending" ? pendingOrders :
    activeOrderTab === "processing" ? processingOrders : historyOrders;

  // Lọc món theo danh mục
  const filteredMenuItems = selectedCategoryFilter === "all" 
    ? menuItems 
    : menuItems.filter((i) => i.category === selectedCategoryFilter);

  // Màn hình khóa PIN
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-orange-600/10 text-orange-500 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">MÀN HÌNH BẾP & QUÁN</h1>
            <p className="text-xs text-slate-400 mt-1">
              Nhập mã PIN của quán để xem danh sách nhận đơn & quản lý thực đơn
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Nhập mã PIN (Mặc định: 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-black bg-slate-950 border border-slate-800 rounded-2xl py-3.5 focus:border-orange-500 focus:outline-none text-white focus:ring-2 focus:ring-orange-950/50"
            />
            {pinError && (
              <p className="text-xs font-bold text-rose-500">{pinError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-900/30 flex items-center justify-center gap-1.5"
            >
              <span>Vào màn hình Quản lý</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[11px] text-slate-500">
            Bạn có thể đổi mã PIN này bất cứ lúc nào trong file config/shop.ts
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in border border-emerald-400/40">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top Row on Mobile: Brand + Quick Actions */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-orange-600 text-white p-2 rounded-xl shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-sm sm:text-base leading-tight text-white tracking-tight truncate">
                  {SHOP_CONFIG.name}
                </h1>
                <span className="text-[10px] sm:text-xs text-orange-500 font-semibold tracking-wider uppercase block truncate">
                  Bảng điều khiển Bếp & Thực đơn
                </span>
              </div>
            </div>

            {/* Quick Actions on Mobile (Sound, Refresh, Logout) */}
            <div className="flex items-center gap-1.5 sm:hidden shrink-0">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) {
                    setTimeout(() => playNewOrderSound(), 100);
                  }
                }}
                className={`p-2 rounded-xl border transition-all ${
                  soundEnabled
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"}
              >
                {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsReloadModalOpen(true)}
                disabled={isLoadingOrders || isLoadingMenu}
                className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl"
                title="Làm mới"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingOrders || isLoadingMenu ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleLogout}
                className="text-xs bg-slate-800 text-rose-400 border border-slate-700 rounded-xl px-2.5 py-2 font-bold"
              >
                Thoát
              </button>
            </div>
          </div>

          {/* Bottom Row on Mobile / Right side on Desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Chuyển đổi View: Đơn hàng vs Thực đơn */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 flex-1 sm:flex-initial">
              <button
                onClick={() => setMainView("orders")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mainView === "orders"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Đơn hàng</span>
                {pendingOrders.length > 0 && (
                  <span className="bg-white text-orange-600 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setMainView("menu");
                  fetchMenu();
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mainView === "menu"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Menu</span>
              </button>
            </div>

            {/* Nút thử loa / kích hoạt âm thanh */}
            <button
              onClick={() => {
                playNewOrderSound();
                showToast("Đã kích hoạt & thử âm thanh chuông bếp!");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
              title="Nhấp để thử âm thanh loa bếp & mở quyền phát âm thanh"
            >
              <span>🔊 Thử chuông</span>
            </button>

            {/* Desktop-only buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) {
                    setTimeout(() => playNewOrderSound(), 100);
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  soundEnabled
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
                title={soundEnabled ? "Tắt âm báo đơn mới" : "Bật âm báo đơn mới"}
              >
                {soundEnabled ? <Bell className="w-4 h-4 animate-swing" /> : <BellOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsReloadModalOpen(true)}
                disabled={isLoadingOrders || isLoadingMenu}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl transition-all"
                title="Làm mới dữ liệu (Cần xác nhận)"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingOrders || isLoadingMenu ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleLogout}
                className="text-xs bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-700 rounded-xl px-3 py-2.5 font-bold transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ========================================================================= */}
        {/* BĂNG REO BÁO ĐỘNG BẾP: KHI CÓ ĐƠN MỚI CHƯA NHẬN (CẢNH BÁO TỨC THÌ) */}
        {/* ========================================================================= */}
        {pendingOrders.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-4 sm:p-5 rounded-2xl shadow-xl shadow-red-950/60 border border-red-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-red-700 text-[11px] font-black uppercase tracking-wider mb-1 shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" /> Báo Động Bếp Nóng
                </div>
                <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                  Có {pendingOrders.length} đơn hàng mới đang chờ nướng &amp; giao hỏa tốc!
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">
                  Chuông đang reo liên hồi. Bấm &quot;Xác nhận nhận đơn&quot; để tắt chuông và bắt đầu nướng nem.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => {
                  setSoundMutedTemporarily(true);
                  showToast("Đã tắt chuông tạm thời");
                }}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-black/25 hover:bg-black/40 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
              >
                Tắt chuông tạm
              </button>
              <button
                onClick={() => {
                  setActiveOrderTab("pending");
                  setMainView("orders");
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-orange-50 active:scale-95 text-orange-700 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Xem đơn ngay</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* ========================================================================= */}
        {/* VIEW 1: QUẢN LÝ ĐƠN HÀNG (LIVE ORDER FEED) */}
        {/* ========================================================================= */}
        {mainView === "orders" && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đơn mới</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-orange-500">{pendingOrders.length}</span>
                  <span className="text-[10px] text-orange-500/60 font-medium">Chờ duyệt</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang xử lý</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-500">{processingOrders.length}</span>
                  <span className="text-[10px] text-amber-500/60 font-medium">Đang làm/Giao</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đã hoàn tất</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-500">
                    {orders.filter((o) => o.status === "completed").length}
                  </span>
                  <span className="text-[10px] text-emerald-500/60 font-medium">Thành công</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Doanh thu hôm nay</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(todayRevenue)}</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Tab Filters */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveOrderTab("pending")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all relative ${
                  activeOrderTab === "pending"
                    ? "border-orange-500 text-orange-500 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Đơn mới chờ duyệt
                {pendingOrders.length > 0 && (
                  <span className="absolute top-2.5 right-2 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveOrderTab("processing")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all relative ${
                  activeOrderTab === "processing"
                    ? "border-amber-500 text-amber-500 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Bếp & Vận chuyển
                {processingOrders.length > 0 && (
                  <span className="absolute top-2.5 right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-950">
                    {processingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveOrderTab("history")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all ${
                  activeOrderTab === "history"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Lịch sử & Đã hủy
              </button>
            </div>

            {/* List of Orders */}
            {isLoadingOrders && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-xs text-slate-400">Đang tải danh sách đơn hàng...</p>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl py-20 text-center space-y-3 px-6">
                <div className="w-14 h-14 bg-slate-950 text-slate-600 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-300">Không có đơn hàng nào</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {activeOrderTab === "pending"
                    ? "Tuyệt vời, tất cả các đơn hàng mới đã được xác nhận!"
                    : activeOrderTab === "processing"
                    ? "Hiện tại không có đơn hàng nào đang chế biến hoặc giao."
                    : "Lịch sử giao dịch trống."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedOrders.map((order) => {
                  let statusLabel = "";
                  let statusBg = "";
                  let cardBorder = "border-slate-800";
                  let animationClass = "";

                  if (order.status === "new") {
                    statusLabel = "ĐƠN MỚI CHỜ DUYỆT";
                    statusBg = "bg-rose-500/20 text-rose-400 border-rose-500/30";
                    cardBorder = "border-rose-500/40 shadow-lg shadow-rose-950/10";
                    animationClass = "animate-pulse";
                  } else if (order.status === "preparing") {
                    statusLabel = "ĐANG CHẾ BIẾN BẾP";
                    statusBg = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                    cardBorder = "border-amber-500/30";
                  } else if (order.status === "delivering") {
                    statusLabel = "ĐANG GIAO HÀNG";
                    statusBg = "bg-sky-500/20 text-sky-400 border-sky-500/30";
                    cardBorder = "border-sky-500/30";
                  } else if (order.status === "completed") {
                    statusLabel = "ĐÃ HOÀN TẤT";
                    statusBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                  } else if (order.status === "cancelled") {
                    statusLabel = "ĐÃ HỦY ĐƠN";
                    statusBg = "bg-slate-800 text-slate-500 border-slate-700";
                  }

                  return (
                    <div
                      key={order.code}
                      className={`bg-slate-900 border ${cardBorder} rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4`}
                    >
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-2xl font-black text-white tracking-wider">
                              #{order.code}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${statusBg} ${animationClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {order.created_at
                                ? new Date(order.created_at).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }) +
                                  " - " +
                                  new Date(order.created_at).toLocaleDateString("vi-VN")
                                : "Vừa đặt"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-medium">Doanh thu</div>
                          <div className="text-base font-black text-emerald-400 mt-0.5">
                            {formatCurrency(order.total)}
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Khách hàng</div>
                            <div className="font-black text-slate-200 mt-0.5 text-sm">
                              {order.customer_name}
                            </div>
                          </div>
                          
                          <a
                            href={`tel:${order.phone}`}
                            className="inline-flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5 fill-current" />
                            <span>Gọi: {order.phone}</span>
                          </a>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Địa chỉ giao hàng
                          </div>
                          <div className="text-slate-300 mt-0.5 font-medium leading-relaxed">
                            {order.address}
                          </div>
                        </div>

                        {order.note && (
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-amber-500/90 italic">
                            <strong>Ghi chú:</strong> {order.note}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Chi tiết món ăn</div>
                          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-slate-300 text-[11px] sm:text-xs">
                                <span className="font-medium">
                                  <strong className="text-orange-500 font-bold">{item.qty}x</strong> {item.name}
                                </span>
                                <span className="font-mono text-slate-400">
                                  {formatCurrency(item.price * item.qty)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Thanh toán:</span>
                          <span
                            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${
                              order.payment_method === "momo"
                                ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {order.payment_method === "momo" ? "MoMo QR" : "COD (Tiền mặt)"}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                        {order.status === "new" && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.code, "preparing")}
                              className="flex-1 min-w-[120px] py-2.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Duyệt & Làm món</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn chắc chắn muốn hủy đơn hàng #${order.code}?`)) {
                                  handleUpdateOrderStatus(order.code, "cancelled");
                                }
                              }}
                              className="py-2.5 px-3.5 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition-all"
                            >
                              Hủy đơn
                            </button>
                          </>
                        )}

                        {order.status === "preparing" && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.code, "delivering")}
                              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <span>Giao hàng đi</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hủy đơn hàng #${order.code}?`)) {
                                  handleUpdateOrderStatus(order.code, "cancelled");
                                }
                              }}
                              className="py-2.5 px-3.5 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition-all"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {order.status === "delivering" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.code, "completed")}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận giao thành công</span>
                          </button>
                        )}

                        {order.status === "completed" && (
                          <div className="w-full text-center py-2 bg-emerald-950/30 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-900/20 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã giao hàng thành công</span>
                          </div>
                        )}

                        {order.status === "cancelled" && (
                          <div className="w-full text-center py-2 bg-slate-950 text-slate-500 text-xs font-bold rounded-xl border border-slate-850 flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Đơn đã bị hủy</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: QUẢN LÝ THỰC ĐƠN (MENU MANAGEMENT) */}
        {/* ========================================================================= */}
        {mainView === "menu" && (
          <div className="space-y-6">
            {/* Menu Header Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  Danh Sách Món Ăn Trong Thực Đơn
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bật/tắt món còn hoặc hết ngay tức thì, hoặc thêm món mới và chỉnh sửa giá bán.
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-lg shadow-orange-950/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm món mới</span>
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategoryFilter === "all"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Tất cả ({menuItems.length})
              </button>
              {categories.filter((c) => c.id !== "all").map((cat) => {
                const count = menuItems.filter((i) => i.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                      selectedCategoryFilter === cat.id
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Menu Items Grid */}
            {isLoadingMenu ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-xs text-slate-400">Đang tải danh sách món ăn...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-slate-900 border rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${
                      item.available ? "border-slate-800 hover:border-slate-700" : "border-rose-950/40 opacity-70 bg-slate-950"
                    }`}
                  >
                    {/* Image & Badges */}
                    <div className="relative w-full aspect-[16/10] bg-slate-950">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className={`object-cover ${!item.available ? "grayscale" : ""}`}
                        unoptimized
                      />

                      {/* Best Seller Badge */}
                      {item.isBestSeller && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Flame className="w-3 h-3 fill-current" /> Bán chạy
                        </div>
                      )}

                      {/* Quick Status Tag */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleToggleItemAvailability(item.id, item.available)}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md transition-all flex items-center gap-1 ${
                            item.available
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-rose-600 text-white hover:bg-rose-700"
                          }`}
                          title="Bấm để đổi trạng thái Còn/Hết món"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.available ? "bg-emerald-200 animate-ping" : "bg-white"}`} />
                          {item.available ? "Đang Bán" : "Hết Món"}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-snug line-clamp-1">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description || "Chưa có mô tả cho món ăn này."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Giá niêm yết</span>
                          <div className="text-base font-black text-orange-500">
                            {formatCurrency(item.price)}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
                            title="Chỉnh sửa món"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="p-2 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-700"
                            title="Xóa món"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA MÓN ĂN */}
      {/* ========================================================================= */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setIsMenuModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in text-slate-100">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-600 text-white p-2 rounded-xl">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base sm:text-lg">
                      {editingItem ? "Chỉnh sửa món ăn" : "Thêm món mới vào thực đơn"}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Cập nhật giá và ảnh hiển thị trực tiếp cho khách
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveMenuItem} className="p-4 sm:p-6 space-y-4">
                {menuFormError && (
                  <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{menuFormError}</span>
                  </div>
                )}

                {/* Tên món */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tên món ăn <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nem nướng phô mai kéo sợi"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:border-orange-500 focus:outline-none text-white transition-all"
                  />
                </div>

                {/* Giá tiền & Danh mục */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Giá bán (VNĐ) <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      placeholder="Ví dụ: 45000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:border-orange-500 focus:outline-none text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Danh mục món
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:border-orange-500 focus:outline-none text-white transition-all"
                    >
                      {categories.filter((c) => c.id !== "all").map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Link ảnh món & Preview */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Đường dẫn ảnh món (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:border-orange-500 focus:outline-none text-white transition-all"
                    />
                  </div>

                  {/* Ảnh preview */}
                  {formImage && (
                    <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <Image
                        src={formImage}
                        alt="Xem trước ảnh"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => {}}
                      />
                    </div>
                  )}
                </div>

                {/* Mô tả món */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mô tả nguyên liệu / hương vị
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nem nướng than hoa, kèm ram giòn, rau sống, sốt chấm gia truyền..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:border-orange-500 focus:outline-none text-white transition-all"
                  />
                </div>

                {/* Checkboxes: Best seller & Available */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsBestSeller}
                      onChange={(e) => setFormIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-200">Món Bán Chạy 🔥</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAvailable}
                      onChange={(e) => setFormAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-200">Còn Hàng 🟢</span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMenu}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSavingMenu ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>{editingItem ? "Cập nhật món" : "Thêm vào menu"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN LÀM MỚI DỮ LIỆU */}
      {/* ========================================================================= */}
      {isReloadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setIsReloadModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden p-6 text-slate-100 text-center">
              {/* Icon */}
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
                <RotateCw className="w-7 h-7" />
              </div>

              {/* Title & Description */}
              <h3 className="font-black text-white text-lg mb-2">
                Xác nhận làm mới dữ liệu?
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn tải lại dữ liệu không? Hệ thống sẽ cập nhật danh sách {mainView === "orders" ? "đơn hàng" : "thực đơn"} mới nhất từ máy chủ.
              </p>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReloadModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReload}
                  className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
