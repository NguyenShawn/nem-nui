import { NextRequest, NextResponse } from "next/server";
import { getMenuItems } from "@/lib/menuDb";
import { SHOP_CONFIG } from "@/config/shop";
import { generateOrderCode, isValidVNPhone } from "@/lib/utils";
import { saveNewOrder } from "@/lib/orderDb";
import { sendOrderToGoogleSheets } from "@/lib/googleSheets";
import { sendDiscordOrderNotification } from "@/lib/discord";
import { OrderItemPayload, PaymentMethod } from "@/types/order";

// Bộ nhớ đệm tạm thời để chống spam theo số điện thoại (In-memory rate limit)
// SĐT -> timestamp đơn cuối cùng
const lastOrderTimeMap = new Map<string, number>();

// Tự động dọn dẹp cache sau mỗi 10 phút để tránh rò rỉ bộ nhớ
setInterval(() => {
  const now = Date.now();
  lastOrderTimeMap.forEach((timestamp, phone) => {
    if (now - timestamp > 10 * 60 * 1000) {
      lastOrderTimeMap.delete(phone);
    }
  });
}, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      address,
      note,
      items,
      paymentMethod,
      honeypot,
    } = body;

    // 1. CHỐNG BOT SPAM BẰNG HONEYPOT
    // Nếu bot tự điền trường honeypot ẩn, trả về 200 giả vờ thành công nhưng không ghi nhận
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn("[Anti-Spam] Bot detected via honeypot field:", honeypot);
      return NextResponse.json({
        success: true,
        code: generateOrderCode(),
        total: 100000,
        message: "Đặt hàng thành công",
      });
    }

    // 2. VALIDATE THÔNG TIN ĐẦU VÀO
    if (!customerName || typeof customerName !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên của bạn." },
        { status: 400 }
      );
    }

    const cleanName = customerName.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json(
        { error: "Họ tên phải có độ dài từ 2 đến 50 ký tự." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !isValidVNPhone(phone)) {
      return NextResponse.json(
        { error: "Số điện thoại không đúng định dạng Việt Nam (VD: 0909123456)." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[\s.-]/g, "");

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ giao hàng cụ thể." },
        { status: 400 }
      );
    }

    const cleanAddress = address.trim();
    if (cleanAddress.length < 10 || cleanAddress.length > 200) {
      return NextResponse.json(
        { error: "Địa chỉ giao hàng phải chi tiết từ 10 đến 200 ký tự (số nhà, đường, phường/xã)." },
        { status: 400 }
      );
    }

    const validPaymentMethods: PaymentMethod[] = ["momo", "cod"];
    const selectedPaymentMethod: PaymentMethod = validPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : "momo";

    // 3. CHỐNG SPAM: KIỂM TRA ĐƠN TRÙNG LẶP TRONG 60 GIÂY
    const now = Date.now();
    const lastOrderTime = lastOrderTimeMap.get(cleanPhone);
    if (lastOrderTime && now - lastOrderTime < 60 * 1000) {
      const remainingSecs = Math.ceil((60 * 1000 - (now - lastOrderTime)) / 1000);
      return NextResponse.json(
        {
          error: `Bạn vừa đặt một đơn hàng. Vui lòng đợi ${remainingSecs} giây trước khi đặt tiếp hoặc gọi trực tiếp số ${SHOP_CONFIG.displayPhone} để đổi món.`,
        },
        { status: 429 }
      );
    }

    // 4. KIỂM TRA VÀ TÍNH TOÁN GIÁ TIỀN SERVER-SIDE (KHÔNG TIN GIÁ CLIENT GỬI)
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Giỏ hàng của bạn đang trống. Vui lòng chọn ít nhất 1 món." },
        { status: 400 }
      );
    }

    // Tạo bản đồ tra cứu menu items từ database động
    const currentMenuItems = getMenuItems();
    const menuMap = new Map(currentMenuItems.map((item) => [item.id, item]));
    const verifiedOrderItems: OrderItemPayload[] = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      if (!item || !item.id) continue;
      const menuItem = menuMap.get(item.id);

      if (!menuItem) {
        return NextResponse.json(
          { error: `Món ăn có mã "${item.id}" không tồn tại trong thực đơn quán.` },
          { status: 400 }
        );
      }

      if (!menuItem.available) {
        return NextResponse.json(
          { error: `Món "${menuItem.name}" hiện tại đã hết, bạn vui lòng chọn món khác nhé!` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.qty || item.quantity, 10);
      if (isNaN(qty) || qty <= 0 || qty > 99) {
        return NextResponse.json(
          { error: `Số lượng cho món "${menuItem.name}" không hợp lệ.` },
          { status: 400 }
        );
      }

      // VÁ LỖ HỔNG KINH TẾ: Giới hạn số lượng tối đa với món trợ giá dùng thử
      const maxAllowed = (menuItem as any).maxPerOrder || (menuItem.id === "kit-nem-mau-thu" ? 1 : 99);
      if (qty > maxAllowed) {
        return NextResponse.json(
          {
            error: `Món "${menuItem.name}" là sản phẩm trợ giá thẩm định vị của xưởng, mỗi đơn hàng chỉ được phép đặt tối đa ${maxAllowed} suất.`,
          },
          { status: 400 }
        );
      }

      calculatedSubtotal += menuItem.price * qty;
      verifiedOrderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price, // Lấy giá chính xác từ server
        qty: qty,
      });
    }

    if (verifiedOrderItems.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất 1 món ăn hợp lệ." },
        { status: 400 }
      );
    }

    // Kiểm tra đơn tối thiểu:
    // Đơn thông thường tối thiểu 30.000đ.
    // Nếu có Kit mẫu thử trợ giá (kit-nem-mau-thu) thì cho phép mức tối thiểu đặc thù 25.000đ.
    const hasSampleKit = verifiedOrderItems.some((i) => i.id === "kit-nem-mau-thu");
    const requiredMinOrder = hasSampleKit ? 25000 : SHOP_CONFIG.minOrderAmount;

    if (calculatedSubtotal < requiredMinOrder) {
      return NextResponse.json(
        {
          error: `Đơn hàng tối thiểu là ${new Intl.NumberFormat("vi-VN").format(
            requiredMinOrder
          )}đ. Quý khách vui lòng chọn thêm món.`,
        },
        { status: 400 }
      );
    }

    const shippingFee = SHOP_CONFIG.shippingFee;
    const finalTotal = calculatedSubtotal + shippingFee;

    // 5. SINH MÃ ĐƠN HÀNG 6 KÝ TỰ NGẪU NHIÊN
    const orderCode = generateOrderCode();

    // 6. LƯU ĐƠN HÀNG VÀO HỆ THỐNG DỮ LIỆU (SUPABASE + LOCAL BACKUP)
    await saveNewOrder({
      code: orderCode,
      customer_name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      note: note ? String(note).slice(0, 500).trim() : null,
      items: verifiedOrderItems,
      total: finalTotal,
      payment_method: selectedPaymentMethod,
      status: "new",
    });

    // 7. GỬI TIN NHẮN VÀ LƯU DỮ LIỆU ĐA KÊNH
    // 7.1. Gửi vào Google Sheets tự động (Lớp 2 - Sổ sách & Email)
    sendOrderToGoogleSheets({
      orderCode,
      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      note: note ? String(note).trim() : undefined,
      items: verifiedOrderItems,
      total: finalTotal,
      paymentMethod: selectedPaymentMethod,
    }).catch((err) => console.warn("[Google Sheets] Lỗi gửi đơn hàng:", err));

    // 7.2. Gửi vào Discord Webhook nếu có cấu hình
    sendDiscordOrderNotification({
      orderCode,
      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      note: note ? String(note).trim() : undefined,
      items: verifiedOrderItems,
      total: finalTotal,
      paymentMethod: selectedPaymentMethod,
    }).catch((err) => console.warn("[Discord] Lỗi gửi đơn hàng:", err));

    // Cập nhật timestamp để chống spam số điện thoại này trong 60 giây
    lastOrderTimeMap.set(cleanPhone, now);

    // 8. TRẢ KẾT QUẢ VỀ CHO CLIENT
    return NextResponse.json({
      success: true,
      code: orderCode,
      total: finalTotal,
      subtotal: calculatedSubtotal,
      shippingFee: shippingFee,
      paymentMethod: selectedPaymentMethod,
      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
    });
  } catch (error: any) {
    console.error("[API Order Exception]", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại hoặc gọi hotline quán." },
      { status: 500 }
    );
  }
}
