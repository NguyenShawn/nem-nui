/**
 * ============================================================================
 * DANH SÁCH MÓN ĂN & DANH MỤC (MENU DATA)
 * ============================================================================
 * Menu được quản lý cố định tại đây (KHÔNG lưu trong database để tối ưu tốc độ).
 * Server sẽ đối chiếu giá trực tiếp từ file này khi nhận đơn hàng để chống gian lận.
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number; // Đơn vị: VNĐ
  description: string;
  image: string;
  category: string;
  available: boolean; // true = còn món, false = hết món
  isBestSeller?: boolean;
  hidden?: boolean; // Nếu true, ẩn khỏi thực đơn bán lẻ thông thường (chỉ đặt qua link đặc biệt)
  maxPerOrder?: number; // Giới hạn số lượng tối đa trên 1 đơn hàng (chống lạm dụng trợ giá)
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", name: "Tất cả món" },
  { id: "nem-chinh", name: "Món Nem & Bún" },
  { id: "an-vat", name: "Ăn vặt & Cuốn" },
  { id: "do-uong", name: "Trà & Giải khát" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "kit-nem-mau-thu",
    name: "Kit Nem Nướng Mẫu Thử (3 cây + Hũ Sốt) - Trợ Giá",
    price: 25000,
    description: "3 que nem nướng than hoa (chuẩn 60g/cây, nạc mỡ 8:2) nướng nóng hổi kèm 1 hũ sốt tương đậu bí truyền và rau dưa ăn kèm. Trợ giá dùng thử thẩm định vị!",
    image: "/assets/image5.png",
    category: "nem-chinh",
    available: true,
    isBestSeller: true,
    hidden: true, // Ẩn khỏi danh mục bán lẻ thông thường
    maxPerOrder: 1, // Tối đa 1 phần / đơn hàng
  },
  {
    id: "nem-nuong-dac-biet",
    name: "Mẹt Nem Nướng Đặc Biệt",
    price: 55000,
    description: "Nem nướng than hoa thơm lừng, bánh tráng giòn, ram chiên, xoài, dưa leo, rau sống & sốt chấm bơ đậu phộng gia truyền.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
    category: "nem-chinh",
    available: true,
    isBestSeller: true,
  },
  {
    id: "bun-nem-nuong",
    name: "Bún Nem Nướng Chả Giò",
    price: 45000,
    description: "Bún tươi sợi nhỏ, nem nướng xắt lát, 2 cuốn chả giò giòn rụm, mỡ hành đậu phộng thơm phức chan nước mắm chua ngọt.",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80",
    category: "nem-chinh",
    available: true,
    isBestSeller: true,
  },
  {
    id: "bun-thit-nuong-nem-lui",
    name: "Bún Thịt Nướng & Nem Lụi",
    price: 48000,
    description: "Thịt nướng ướp mật ong mềm thơm, nem lụi bọc sả nướng đậm đà, kèm rau thơm và nước sốt tương đậu đặc biệt.",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80",
    category: "nem-chinh",
    available: true,
  },
  {
    id: "nem-lui-hue-5-cay",
    name: "Phần Nem Lụi Sả (5 cây)",
    price: 40000,
    description: "5 cây nem lụi quấn củ sả nướng than thơm nức, ăn kèm rau sống cuốn bánh tráng hoặc chấm tương đậu nành.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    category: "nem-chinh",
    available: true,
  },
  {
    id: "cha-gio-tom-thit",
    name: "Chả Giò Tôm Thịt Rế (6 cuốn)",
    price: 35000,
    description: "Bánh tráng rế cuốn tôm thịt giòn tan, nhân đậm đà, không ngấy dầu, chấm sốt xí muội ngọt thanh.",
    image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80",
    category: "an-vat",
    available: true,
  },
  {
    id: "banh-trang-cuon-nem",
    name: "Bánh Tráng Cuốn Nem Nướng (3 cuốn)",
    price: 30000,
    description: "Cuốn sẵn tiện lợi cho khách ăn liền: nem nướng, xà lách, dưa leo, xoài xanh, ram giòn kèm sốt chấm.",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
    category: "an-vat",
    available: true,
  },
  {
    id: "nem-chua-ran-ha-noi",
    name: "Nem Chua Rán Hà Nội (Đã hết)",
    price: 35000,
    description: "Nem chua lăn bột xù chiên vàng ruộm, dai giòn sần sật, chấm tương ớt cay nồng đậm vị phố cổ.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    category: "an-vat",
    available: false, // Món hết để test hiển thị mờ + badge Hết món
  },
  {
    id: "tra-tac-hat-chia",
    name: "Trà Tắc Mật Ong Hạt Chia (Khổng lồ)",
    price: 15000,
    description: "Vị tắc tươi thơm mát hòa quyện mật ong hoa rừng nguyên chất và hạt chia bổ dưỡng giải ngấy cực đã.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
    category: "do-uong",
    available: true,
    isBestSeller: true,
  },
  {
    id: "tra-dao-sa-tac",
    name: "Trà Đào Cam Sả Tươi Mát",
    price: 22000,
    description: "Trà đào thơm nồng, sả tươi đập dập thơm lừng, kèm 2 miếng đào ngâm giòn ngọt sảng khoái.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
    category: "do-uong",
    available: true,
  },
  {
    id: "nuoc-mia-tac",
    name: "Nước Mía Tắc Ép Tươi",
    price: 12000,
    description: "Mía tươi ép nguyên chất cùng trái tắc tươi ngọt mát thanh giọng, giải khát tức thì.",
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&auto=format&fit=crop&q=80",
    category: "do-uong",
    available: true,
  },
];
