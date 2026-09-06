import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontDisplay = Fraunces({
  subsets: ["vietnamese", "latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nemnui.vn"),
  title: "Nem Núi - Chuyên Bán Nem Nướng Uy Tín Sỉ / Lẻ",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/logo-circle-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/assets/logo-circle-512.png",
    apple: "/assets/logo-circle-512.png",
  },
  description:
    "Chuyên cung cấp sỉ và bỏ mối nem nướng mật truyền thống chỉ từ 100 cây cho quán ăn, tiệm trà sữa, xe ăn vặt. Đậm vị nướng than hoa, mọng mật, bao đổi trả, hỗ trợ công thức kinh doanh.",
  keywords: [
    "nem nướng sỉ",
    "sỉ nem nướng từ 100 cây",
    "bỏ mối nem nướng",
    "nem núi",
    "nguồn sỉ nem nướng quán ăn",
    "nem nướng mật mía",
  ],
  openGraph: {
    title: "Nem Núi - Nguồn Sỉ Nem Nướng Tận Gốc Từ 100 Cây",
    description:
      "Cung cấp sỉ nem nướng mọng nước, chuẩn vị mật mía truyền thống từ 100 cây. Đăng ký nhận ngay Kit Mẫu Thử và trọn bộ công thức pha sốt chấm độc quyền.",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/assets/nem-nuong.jpg",
        width: 800,
        height: 600,
        alt: "Nem Núi - Nguồn Sỉ Nem Nướng",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`scroll-smooth ${fontDisplay.variable} ${fontSans.variable}`}>
      <body className="font-sans antialiased min-h-screen text-stone-800 bg-[#FFFBEB] selection:bg-orange-200 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
