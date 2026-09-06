/**
 * Cấu hình Landing Page Nem Núi - Sỉ Nem Nướng Tận Gốc
 * Tuân thủ quy chuẩn UI/UX Pro Max
 */

// URL đặt lẻ trỏ trực tiếp đến trang đặt lẻ nội bộ /dat-le
export const RETAIL_ORDER_URL = "/dat-le";

export const LANDING_CONFIG = {
  brand: {
    name: "Nem Núi",
    badge: "Sỉ từ 100 cây",
    tagline: "Hương vị đậm đà, kết nối kinh doanh",
    description:
      "Chuyên cung cấp sỉ và bỏ mối nem nướng mật truyền thống từ 100 cây cho quán ăn, tiệm trà sữa, xe ăn vặt và tiệc nhóm.",
    hotline: "0369652674",
    hotlineDisplay: "0369 652 674",
    zalo: "https://zalo.me/0369652674",
    address: "Kho Tổng & Xưởng Sản Xuất: Đường số 7, KCN Vĩnh Lộc, Bình Chánh, TP.HCM",
    provinceDelivery: "Đóng thùng xốp đá gel gửi bến xe Miền Tây & Miền Đông đi các tỉnh",
    operatingHours: "06:00 - 22:00 (Thứ 2 - Chủ Nhật)",
  },
  
  // 4 USP cạnh tranh bỏ mối
  usps: [
    {
      id: "flexible-quantity",
      title: "Sỉ linh hoạt từ 100 cây",
      desc: "Vốn khởi đầu chỉ từ vài trăm nghìn, không lo đọng vốn hay tồn kho. Cực kỳ tối ưu cho xe ăn vặt, tiệm trà sữa, quán bún mới mở hoặc tiệc gia đình.",
      icon: "Boxes",
      badge: "Vốn nhỏ lợi lớn",
    },
    {
      id: "exclusive-recipe",
      title: "Công thức độc quyền Nem Núi",
      desc: "Thịt nạc vai kết hợp mỡ tảng tỷ lệ 8:2 chuẩn vị, ướp mật mía gia truyền và nướng xém cạnh. Cắn ngập răng, giữ độ ẩm mọng nước, không hề khô xác.",
      icon: "Flame",
      badge: "Đậm vị mật mía",
    },
    {
      id: "exclusive-sauce-margin",
      title: "Tặng công thức sốt & Biên lãi 65%",
      desc: "Chuyển giao miễn phí công thức pha 2 loại sốt chấm độc quyền (tương đậu béo bùi & mắm kẹo mật mía). Hướng dẫn tối ưu cost giúp quán đạt biên lợi nhuận tới 65%.",
      icon: "TrendingUp",
      badge: "Biên lãi 60-65%",
    },
    {
      id: "fast-hygiene",
      title: "Giao nhanh & Chuẩn vệ sinh",
      desc: "Sản xuất trong ngày, hút chân không sạch sẽ, bảo quản lạnh đúng quy chuẩn VSATTP. Hỗ trợ giao hỏa tốc 2h nội thành TP.HCM, đóng đá gel gửi tỉnh.",
      icon: "ShieldCheck",
      badge: "Chuẩn VSATTP",
    },
  ],

  // Chính sách ưu đãi đối tác mới & Kit mẫu thử
  specialDeal: {
    badge: "Chính Sách Đối Tác Mới",
    headline: "Đăng Ký Nhận Kit Mẫu Thử & Báo Giá Sỉ Tận Gốc",
    subheadline: "Trải nghiệm trực tiếp chất lượng nem nướng mật than hoa mọng nước trước khi nhập sỉ",
    limitNotice: "Ưu đãi gửi mẫu thử miễn phí cho 50 đối tác đăng ký tuần này",
    remainingSlots: 18,
    totalSlots: 50,
    items: [
      {
        name: "Kit 3 cây nem nướng mẫu thử hút chân không (Trợ giá)",
        highlight: "Chuẩn 60g/cây",
        desc: "Thịt nạc vai mỡ tảng 8:2 nướng than hoa xém cạnh, chuẩn vị nguyên bản",
      },
      {
        name: "Hũ sốt chấm tương đậu phộng bí truyền pha sẵn",
        highlight: "Tặng kèm trọn bộ",
        desc: "Sốt chấm đậm đà, thơm béo bùi ngậy gia truyền của xưởng Nem Núi",
      },
    ],
  },

  // Các gói nhập sỉ
  wholesaleTiers: [
    {
      id: "tier_100",
      label: "100 cây (Khởi nghiệp / Thử quán)",
      description: "Phù hợp quán thử nghiệm menu, xe ăn vặt, tiệm trà sữa",
      popular: false,
    },
    {
      id: "tier_200_500",
      label: "200 - 500 cây (Bán chạy nhất)",
      description: "Mức giá sỉ ưu đãi tốt, hỗ trợ cước vận chuyển và tặng kèm sốt chấm",
      popular: true,
    },
    {
      id: "tier_1000",
      label: "Trên 1.000 cây (Đại lý / Chuỗi quán)",
      description: "Mức chiết khấu đại lý cao nhất, hỗ trợ biển hiệu và khay nướng",
      popular: false,
    },
    {
      id: "tier_event",
      label: "Đặt tiệc nhóm / Sự kiện",
      description: "Nướng sẵn giao nóng tận nơi theo giờ tiệc yêu cầu",
      popular: false,
    },
  ],

  // 4 Câu hỏi thường gặp theo đề bài
  faqs: [
    {
      question: "100 cây có được bảo quản đá gel gửi tỉnh không?",
      answer:
        "Hoàn toàn có! Với các đơn gửi tỉnh (Miền Tây, Miền Đông, Tây Nguyên), xưởng Nem Núi sẽ đóng thùng xốp lót đá gel giữ nhiệt tiêu chuẩn âm sâu. Nem được hút chân không kỹ càng, đảm bảo đến nơi vẫn tươi ngon nguyên vị trong vòng 24 - 36 giờ.",
    },
    {
      question: "Có được ăn thử mẫu trước khi nhập số lượng lớn không?",
      answer:
        "Có! Nem Núi có chương trình gửi Kit Mẫu Thử tận nơi cho các chủ quán, chủ xe ăn vặt trước khi quyết định nhập số lượng lớn. Bạn chỉ cần điền thông tin vào form trên trang, nhân viên tư vấn sẽ liên hệ gửi mẫu thử kèm nước chấm trong vòng 24h.",
    },
    {
      question: "Chính sách chiết khấu và đổi trả cho quán mới như thế nào?",
      answer:
        "Nem Núi áp dụng bảng giá sỉ minh bạch tận gốc từ 100 cây không qua trung gian. Đặc biệt, chúng tôi cam kết bảo hiểm chất lượng 100%: bao đổi trả 1:1 tận nơi nếu nem bị khô xác hay không đúng vị ngọt mọng mật mía gia truyền đã cam kết.",
    },
    {
      question: "Quán mới mở có được hướng dẫn cách pha nước chấm và nướng lại không?",
      answer:
        "Chắc chắn rồi! Chúng tôi chuyển giao toàn bộ cẩm nang quy trình: cách bảo quản tủ đông đến 30 ngày, mẹo nướng than/chiên nồi chiên không dầu giữ trọn vị mềm mọng không khô xác, và công thức pha chế 2 loại nước chấm vạn người mê (tương béo & mắm kẹo).",
    },
  ],
};
