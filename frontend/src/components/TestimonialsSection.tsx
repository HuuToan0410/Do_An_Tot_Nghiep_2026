const TESTIMONIALS = [
  {
    id: 1,
    name: "Ta - Bình Phước",
    car: "Toyota Camry 2020",
    avatar: "https://picsum.photos/seed/avatar1/100/100",
    rating: 4,
    text: "Sau nhiều lần tham khảo các website, mình đã lựa chọn mua xe tại Siêu Thị Ô Tô Hà Nội. Giá cả rất hợp lí và dịch vụ chăm sóc, hậu cần, tư vấn cũng rất tốt.",
  },
  {
    id: 2,
    name: "Phong - TPHCM",
    car: "Mazda CX-5 2021",
    avatar: "https://picsum.photos/seed/avatar2/100/100",
    rating: 5,
    text: "Nhân viên tư vấn và chăm sóc mình rất nhiệt tình. Xe chất lượng tốt và giá cả hợp lí! Mình rất hài lòng với dịch vụ tại đây.",
  },
  {
    id: 3,
    name: "Nam - Thanh Hóa",
    car: "Honda CR-V 2020",
    avatar: "https://picsum.photos/seed/avatar3/100/100",
    rating: 5,
    text: "Giá xe rất tốt nên mình đã quyết định mua online qua web. Mình không ngờ chất lượng xe lại tốt hơn mong đợi. Chỉ 2 – 3 ngày là nhận được chiếc xe ưng ý.",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mt-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < count ? "text-yellow-400" : "text-gray-200"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-orange-50/30">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-1">
            About us
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase mb-2">
            Khách Hàng Nói Về Chúng Tôi
          </h2>
          <p className="text-gray-500 text-sm">
            Sự tin tưởng của khách hàng chính là thành công lớn nhất của chúng
            tôi
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Avatar + info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{t.car}</p>
                </div>
              </div>

              {/* Quote icon */}
              <div className="w-8 h-8 rounded-full border-2 border-red-200 flex items-center justify-center mb-3 shrink-0">
                <span className="text-red-500 font-black text-base leading-none">
                  "
                </span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">{t.text}</p>

              <Stars count={t.rating} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
