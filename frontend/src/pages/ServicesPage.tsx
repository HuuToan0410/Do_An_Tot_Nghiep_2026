import MainLayout from "../layouts/MainLayout";
import ServicesSection from "../components/ServicesSection";
import { Shield, Clock, Star, Phone, ArrowRight, CheckCircle } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────

const COMMITMENTS = [
  {
    icon:  <Shield size={32} className="text-white" />,
    bg:    "bg-red-500",
    title: "Bảo hành toàn diện",
    desc:  "Cam kết bảo hành 6 tháng hoặc 10.000 km cho mọi xe được bán tại showroom.",
    stat:  "6 tháng",
  },
  {
    icon:  <Clock size={32} className="text-white" />,
    bg:    "bg-orange-500",
    title: "Hỗ trợ 7 ngày / tuần",
    desc:  "Đội ngũ tư vấn luôn sẵn sàng hỗ trợ từ 7:00 đến 19:00 tất cả các ngày.",
    stat:  "7/7",
  },
  {
    icon:  <Star size={32} className="text-white" />,
    bg:    "bg-amber-500",
    title: "Kiểm định chất lượng",
    desc:  "Mỗi xe đều được kiểm định 100+ hạng mục trước khi đưa ra thị trường.",
    stat:  "100+",
  },
  {
    icon:  <Phone size={32} className="text-white" />,
    bg:    "bg-blue-500",
    title: "Tư vấn vay vốn",
    desc:  "Kết nối với 10+ ngân hàng để hỗ trợ vay mua xe lãi suất ưu đãi nhất.",
    stat:  "10+ NH",
  },
];

const HIGHLIGHTS = [
  "Xe kiểm định kỹ lưỡng trước khi bán",
  "Hỗ trợ thủ tục sang tên, đăng ký",
  "Minh bạch giá cả, không phụ thu",
  "Hỗ trợ vay vốn lãi suất tốt nhất",
  "Đội ngũ kỹ thuật chuyên nghiệp",
  "Chính sách đổi trả linh hoạt",
];

// ── Component ──────────────────────────────────────────────────

export default function ServicesPage() {
  return (
    <MainLayout>

      {/* ── Hero ── */}
      <section className="relative bg-[#111] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(https://picsum.photos/seed/services/1600/500)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Dịch vụ
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Dịch Vụ Của Chúng Tôi
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-base leading-relaxed mb-8">
            Cung cấp đầy đủ dịch vụ mua bán xe ô tô đã qua sử dụng chất lượng cao,
            minh bạch và uy tín tại TP. Hồ Chí Minh.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:0987654321"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              <Phone size={18} /> Tư vấn miễn phí
            </a>
            <a
              href="#commitments"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Xem cam kết <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-red-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+",  label: "Xe đã bán"          },
            { value: "5000+", label: "Khách hài lòng"     },
            { value: "10+",   label: "Năm kinh nghiệm"    },
            { value: "100%",  label: "Xe kiểm định"       },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-red-200 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services section ── */}
      <ServicesSection />

      {/* ── Commitments ── */}
      <section id="commitments" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">

          <div className="text-center mb-14">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">
              Cam kết
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Cam Kết Của Chúng Tôi
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm">
              Mỗi xe, mỗi giao dịch đều được thực hiện với tiêu chuẩn cao nhất
              để đảm bảo sự hài lòng của khách hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {COMMITMENTS.map((c) => (
              <div
                key={c.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`w-16 h-16 ${c.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {c.icon}
                </div>

                {/* Stat badge */}
                <div className="inline-block bg-gray-100 text-gray-700 text-xs font-black px-3 py-1 rounded-full mb-3">
                  {c.stat}
                </div>

                <h3 className="font-black text-gray-900 mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Highlights grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">
                  Tại sao chọn chúng tôi?
                </p>
                <h3 className="text-2xl font-black text-gray-900 mb-4">
                  Hơn 10 Năm Uy Tín Trên Thị Trường
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Chúng tôi tự hào là một trong những đơn vị mua bán xe ô tô đã qua
                  sử dụng uy tín nhất tại TP. Hồ Chí Minh, với hàng nghìn khách hàng
                  hài lòng và tin tưởng.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HIGHLIGHTS.map((h) => (
                    <div key={h} className="flex items-center gap-2.5">
                      <CheckCircle size={16} className="text-green-600 shrink-0" />
                      <span className="text-gray-700 text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image placeholder */}
              <div className="relative rounded-2xl overflow-hidden h-80 bg-gray-100 shadow-inner">
                <img
                  src="https://picsum.photos/seed/showroom/600/400"
                  alt="Showroom"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center">
                  <p className="font-bold text-gray-900 text-sm">AUTO Leng Art</p>
                  <p className="text-gray-500 text-xs">Showroom tiêu chuẩn 5 sao</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-3">Sẵn Sàng Mua Xe?</h2>
          <p className="text-red-200 mb-8 text-sm leading-relaxed">
            Liên hệ ngay để được tư vấn miễn phí, xem xe và lái thử.
            Đội ngũ chuyên viên của chúng tôi luôn sẵn sàng phục vụ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:0987654321"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Phone size={18} /> Gọi: 0987 654 321
            </a>
            <a
              href="/vehicles"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Xem xe ngay <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}