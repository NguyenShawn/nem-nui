import { NextRequest, NextResponse } from "next/server";
import { sendDiscordLeadNotification } from "@/lib/discord";
import { sendLeadToGoogleSheets } from "@/lib/googleSheets";
import { saveNewLead, readLocalLeads } from "@/lib/leadDb";
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/auth";

// Bộ nhớ đệm tạm thời để chống spam theo số điện thoại (Rate limit 60 giây)
const lastLeadTimeMap = new Map<string, number>();

// Tự động dọn dẹp cache sau mỗi 10 phút để tránh rò rỉ bộ nhớ
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  lastLeadTimeMap.forEach((timestamp, phoneKey) => {
    if (now - timestamp > 10 * 60 * 1000) {
      lastLeadTimeMap.delete(phoneKey);
    }
  });
}, 10 * 60 * 1000);
if (typeof cleanupInterval === "object" && typeof cleanupInterval?.unref === "function") {
  cleanupInterval.unref();
}

/**
 * GET /api/leads
 * Protected endpoint requiring administrative credentials:
 * - Authorization: Bearer <ADMIN_SECRET>
 * - x-admin-key: <ADMIN_SECRET>
 * Returns 401 Unauthorized if missing or invalid credentials.
 */
export async function GET(req: Request) {
  if (!verifyAdminAuth(req)) {
    return createUnauthorizedResponse();
  }

  try {
    const leads = readLocalLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, tier, tierLabel, addressNote, submittedAt, website_url, honeypot } = body;

    // 1. CHỐNG BOT SPAM BẰNG HONEYPOT
    // Nếu bot tự điền trường honeypot ẩn (website_url), trả về decoy 200 giả vờ thành công nhưng không ghi nhận
    const rawHoneypot = website_url || honeypot;
    if (rawHoneypot && String(rawHoneypot).trim().length > 0) {
      console.warn("[Anti-Spam Lead] Bot detected via honeypot field:", rawHoneypot);
      return NextResponse.json({
        success: true,
        message: "Nem Núi đã nhận thông tin, chúng tôi sẽ gọi lại trong 10 phút!",
      });
    }

    // 2. VALIDATE THÔNG TIN ĐẦU VÀO
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Họ và tên là bắt buộc" },
        { status: 400 }
      );
    }

    const cleanedPhone = (phone || "").replace(/\s+/g, "").replace(/\./g, "").replace(/-/g, "");
    const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!vnPhoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        { success: false, error: "Số điện thoại Việt Nam 10 chữ số không hợp lệ" },
        { status: 400 }
      );
    }

    // 3. CHỐNG SPAM: KIỂM TRA GỬI LEAD TRÙNG LẶP TRONG 60 GIÂY (HTTP 429)
    const now = Date.now();
    const lastLeadTime = lastLeadTimeMap.get(cleanedPhone);
    if (lastLeadTime && now - lastLeadTime < 60 * 1000) {
      const remainingSecs = Math.ceil((60 * 1000 - (now - lastLeadTime)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Bạn vừa gửi yêu cầu tư vấn sỉ. Vui lòng đợi ${remainingSecs} giây trước khi gửi tiếp hoặc liên hệ trực tiếp hotline quán.`,
        },
        { status: 429 }
      );
    }

    const timeString = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // 1. Lưu dự phòng vào database local để không bao giờ bị mất khách
    const savedLead = saveNewLead({
      fullName: fullName.trim(),
      phone: cleanedPhone,
      tier: tierLabel || tier || "100 cây",
      addressNote: addressNote ? addressNote.trim() : "",
      submittedAt: timeString,
    });

    // 2. Tự động đẩy vào Google Sheets
    sendLeadToGoogleSheets({
      fullName: fullName.trim(),
      phone: cleanedPhone,
      tier: tier,
      tierLabel: tierLabel || tier || "100 cây",
      addressNote: addressNote ? addressNote.trim() : "",
      submittedAt: timeString,
    }).catch((sheetErr) => {
      console.warn("[Google Sheets] Lỗi gửi lead sang Sheets:", sheetErr);
    });

    // 3. Gửi thông báo lead sỉ mới qua Discord Webhook
    sendDiscordLeadNotification({
      fullName: fullName.trim(),
      phone: cleanedPhone,
      tier: tier,
      tierLabel: tierLabel || tier || "100 cây",
      addressNote: addressNote ? addressNote.trim() : "",
      submittedAt: timeString,
    }).catch((discordErr) => {
      console.warn("[Discord] Lỗi gửi lead sang Discord:", discordErr);
    });

    // Cập nhật timestamp để giới hạn tần suất SĐT 60 giây
    lastLeadTimeMap.set(cleanedPhone, now);

    return NextResponse.json({
      success: true,
      message: "Nem Núi đã nhận thông tin, chúng tôi sẽ gọi lại trong 10 phút!",
      lead: {
        id: savedLead.id,
        fullName: fullName.trim(),
        phone: cleanedPhone,
        tier: tierLabel || tier,
      },
    });
  } catch (error: any) {
    console.error("Lỗi xử lý lead sỉ:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi xử lý yêu cầu báo giá" },
      { status: 500 }
    );
  }
}
