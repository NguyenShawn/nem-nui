import { NextRequest, NextResponse } from "next/server";
import { sendDiscordLeadNotification } from "@/lib/discord";
import { sendLeadToGoogleSheets } from "@/lib/googleSheets";
import { saveNewLead, readLocalLeads } from "@/lib/leadDb";

export async function GET() {
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
    const { fullName, phone, tier, tierLabel, addressNote, submittedAt } = body;

    // Validate
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
