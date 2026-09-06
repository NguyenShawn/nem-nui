/**
 * Gửi thông báo đơn hàng mới tới kênh Discord qua Webhook
 */

export interface DiscordOrderData {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
}

export async function sendDiscordOrderNotification(order: DiscordOrderData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) return;

  try {
    const itemsList = order.items
      .map((i) => `• **${i.qty}x** ${i.name} - ${new Intl.NumberFormat("vi-VN").format(i.price * i.qty)}đ`)
      .join("\n");
    const paymentText = order.paymentMethod === "momo" ? "🟣 MoMo (Chuyển khoản)" : "💵 COD (Tiền mặt)";

    const body = {
      content: `🚨 **CÓ ĐƠN HÀNG MỚI!** Mã đơn: \`#${order.orderCode}\``,
      embeds: [
        {
          title: `Đơn Hàng Mới: #${order.orderCode}`,
          color: 0xea580c,
          fields: [
            { name: "Khách hàng", value: order.customerName, inline: true },
            { name: "Số điện thoại", value: `[${order.phone}](tel:${order.phone})`, inline: true },
            { name: "Thanh toán", value: paymentText, inline: true },
            { name: "Địa chỉ giao hàng", value: order.address, inline: false },
            { name: "Món đã đặt", value: itemsList || "Không có", inline: false },
            {
              name: "Tổng thanh toán",
              value: `**${new Intl.NumberFormat("vi-VN").format(order.total)}đ**`,
              inline: true,
            },
            ...(order.note ? [{ name: "Ghi chú của khách", value: order.note, inline: false }] : []),
          ],
          footer: { text: "Nem Núi • Bếp nướng than hoa" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[Discord] Lỗi gửi thông báo Discord:", err);
  }
}

/**
 * Gửi thông báo đơn hàng đã hoàn tất / giao thành công tới kênh Discord qua Webhook
 */
export async function sendDiscordOrderCompletedNotification(order: DiscordOrderData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) return;

  try {
    const itemsList = order.items
      .map((i) => `• **${i.qty}x** ${i.name} - ${new Intl.NumberFormat("vi-VN").format(i.price * i.qty)}đ`)
      .join("\n");
    const paymentText = order.paymentMethod === "momo" ? "🟣 MoMo (Đã thanh toán)" : "💵 COD (Đã thu tiền mặt)";

    const body = {
      content: `🎉 **ĐƠN HÀNG GIAO THÀNH CÔNG!** Mã đơn: \`#${order.orderCode}\``,
      embeds: [
        {
          title: `✅ ĐÃ HOÀN TẤT ĐƠN HÀNG #${order.orderCode}`,
          description: `Đơn hàng đã được giao thành công tới khách hàng và chốt doanh thu!`,
          color: 0x22c55e, // Xanh lá cây (Emerald Green)
          fields: [
            { name: "Khách hàng", value: order.customerName, inline: true },
            { name: "Số điện thoại", value: `[${order.phone}](tel:${order.phone})`, inline: true },
            { name: "Hình thức TT", value: paymentText, inline: true },
            { name: "Địa chỉ nhận hàng", value: order.address, inline: false },
            { name: "Món đã giao", value: itemsList || "Không có", inline: false },
            {
              name: "💰 Doanh thu thực thu",
              value: `**${new Intl.NumberFormat("vi-VN").format(order.total)}đ**`,
              inline: true,
            },
            ...(order.note ? [{ name: "Ghi chú", value: order.note, inline: false }] : []),
          ],
          footer: { text: "Nem Núi • Bếp nướng than hoa | Đơn đã hoàn tất" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[Discord] Lỗi gửi thông báo hoàn tất đơn:", err);
  }
}

/**
 * Gửi thông báo yêu cầu báo giá sỉ (Lead) tới kênh Discord qua Webhook
 */
export interface DiscordLeadData {
  fullName: string;
  phone: string;
  tier?: string;
  tierLabel?: string;
  addressNote?: string;
  submittedAt?: string;
}

export async function sendDiscordLeadNotification(lead: DiscordLeadData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) return;

  try {
    const body = {
      content: `🔥 **YÊU CẦU BÁO GIÁ SỈ MỚI - NEM NÚI** 🔥`,
      embeds: [
        {
          title: `Khách Hàng Đối Tác Sỉ Mới`,
          color: 0xf59e0b,
          fields: [
            { name: "Họ tên đối tác", value: lead.fullName, inline: true },
            { name: "Số điện thoại", value: `[${lead.phone}](tel:${lead.phone}) (Zalo)`, inline: true },
            { name: "Gói sỉ dự kiến", value: lead.tierLabel || lead.tier || "100 cây", inline: true },
            ...(lead.addressNote ? [{ name: "Ghi chú / Khu vực", value: lead.addressNote, inline: false }] : []),
            ...(lead.submittedAt ? [{ name: "Thời gian", value: lead.submittedAt, inline: false }] : []),
          ],
          footer: { text: "Nem Núi • Vui lòng gọi lại trong 10 phút để chốt đơn sỉ!" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[Discord] Lỗi gửi thông báo Lead:", err);
  }
}

