"use client";

import React from "react";
import Image from "next/image";
import { Boxes, Flame, TrendingUp, Truck, ArrowRight, ShieldCheck } from "lucide-react";

export function UspGrid() {
  const usps = [
    {
      id: "flexible-quantity",
      icon: Boxes,
      iconColor: "text-orange-600 bg-orange-50 border-orange-200/70",
      badge: "Vốn nhỏ lợi lớn",
      badgeStyle: "text-orange-800 bg-orange-50/80 border-orange-200/60",
      title: "Sỉ linh hoạt từ 100 cây",
      desc: "Vốn khởi đầu chỉ từ vài trăm nghìn, không lo đọng vốn hay áp lực tồn kho. Cực kỳ tối ưu cho xe ăn vặt, tiệm trà sữa, quán bún mới mở hoặc tiệc gia đình.",
      image: "/assets/image3.jpg",
      imageAlt: "Que nem nướng chuẩn 60g nướng than hoa đóng gói hút chân không",
      imageTag: "Chuẩn 60g / cây • Hút chân không",
      footerNote: "Không ép doanh số theo tháng",
    },
    {
      id: "exclusive-recipe",
      icon: Flame,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200/70",
      badge: "Đậm vị mật mía",
      badgeStyle: "text-amber-900 bg-amber-50/80 border-amber-200/60",
      title: "Công thức độc quyền Nem Núi",
      desc: "Thịt nạc vai kết hợp mỡ tảng tỷ lệ 8:2 chuẩn vị, ướp mật mía gia truyền và nướng xém cạnh than hoa. Cắn ngập răng, giữ trọn độ ẩm mọng nước, không khô xác khi nguội.",
      image: "/assets/image6.jpg",
      imageAlt: "Cận cảnh thớ thịt nem nướng than hoa xém cạnh óng ả mọng nước tỷ lệ nạc mỡ 8:2",
      imageTag: "Cận cảnh thớ thịt 8:2 • Xém cạnh than hoa",
      footerNote: "Bao đổi trả 1:1 nếu khô xơ",
    },
    {
      id: "exclusive-sauce",
      icon: TrendingUp,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200/70",
      badge: "Biên lãi 60 - 65%",
      badgeStyle: "text-emerald-800 bg-emerald-50/80 border-emerald-200/60",
      title: "Tặng công thức sốt & Biên lãi cao",
      desc: "Chuyển giao miễn phí công thức pha 2 loại sốt chấm độc quyền (tương đậu phộng béo bùi & mắm kẹo mật mía). Tư vấn định lượng cost chuẩn giúp quán gia tăng biên lợi nhuận bền vững.",
      image: "/assets/image4.jpg",
      imageAlt: "Que nem nướng mật cùng chén sốt tương đậu phộng tỏi ớt thơm lừng",
      imageTag: "Tặng kèm công thức pha chuẩn vị",
      footerNote: "Hỗ trợ định lượng menu cho quán mới",
    },
    {
      id: "fast-delivery",
      icon: Truck,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200/70",
      badge: "Chuẩn VSATTP",
      badgeStyle: "text-blue-800 bg-blue-50/80 border-blue-200/60",
      title: "Giao nhanh 2h & Đóng đá gel gửi tỉnh",
      desc: "Sản xuất mới mỗi ngày, hút chân không sạch sẽ, bảo quản lạnh đúng quy chuẩn. Hỗ trợ giao hỏa tốc 2h tại TP.HCM và đóng thùng xốp lót đá gel giữ nhiệt gửi bến xe về các tỉnh miền Tây, miền Đông.",
      image: "/assets/image7.jpg",
      imageAlt: "Mẹt nem nướng than hoa nóng hổi cùng rau thơm thảo mộc và bánh tráng cuốn",
      imageTag: "Thành phẩm tươi ngon • Đóng đá gel gửi tỉnh",
      footerNote: "Cam kết đến nơi vẫn tươi ngon nguyên vị",
    },
  ];

  return (
    <section id="uu-diem" className="py-16 sm:py-24 bg-stone-50/70 border-b border-stone-200/60 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100/80 px-3 py-1 rounded-md mb-3 inline-block border border-orange-200/60">
            Lợi thế cạnh tranh
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-normal leading-snug">
            Bốn lợi thế giúp quán của bạn giữ khách và tăng lợi nhuận
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Giải quyết triệt để bài toán vốn nhập hàng, chất lượng sản phẩm đồng đều và tốc độ giao nhận.
          </p>
        </div>

        {/* 2x2 Clean Balanced Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {usps.map((usp) => {
            const Icon = usp.icon;
            return (
              <div
                key={usp.id}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${usp.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${usp.badgeStyle}`}
                    >
                      {usp.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-xl font-bold text-stone-900 mb-2.5 leading-snug group-hover:text-orange-600 transition-colors duration-200">
                    {usp.title}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed font-normal mb-5">
                    {usp.desc}
                  </p>

                  {/* Visual Image */}
                  <div className="relative rounded-xl overflow-hidden border border-stone-200/70 shadow-2xs aspect-[16/9] mb-4 bg-stone-50">
                    <Image
                      src={usp.image}
                      alt={usp.imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                    <span className="absolute bottom-2.5 left-2.5 text-[11px] font-medium text-white bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20 shadow-xs">
                      {usp.imageTag}
                    </span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{usp.footerNote}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
