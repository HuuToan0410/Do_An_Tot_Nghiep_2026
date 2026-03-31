import MainLayout from "../layouts/MainLayout";
import {
  Phone,
  MapPin,
  Clock,
  Mail,
  Facebook,
  Youtube,
  ArrowRight,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const CONTACT_ITEMS = [
  {
    icon: <Phone size={22} className="text-red-600" />,
    bg: "bg-red-50",
    title: "Hotline",
    content: (
      <a
        href="tel:0987654321"
        className="text-red-600 font-black text-xl hover:underline"
      >
        0987 654 321
      </a>
    ),
    sub: "Gọi ngay để được tư vấn miễn phí",
  },
  {
    icon: <MapPin size={22} className="text-blue-600" />,
    bg: "bg-blue-50",
    title: "Địa chỉ showroom",
    content: (
      <p className="text-gray-800 font-semibold">
        123 An Phú Đông, Quận 12, TP. Hồ Chí Minh
      </p>
    ),
    sub: "Mở cửa tất cả các ngày trong tuần",
  },
  {
    icon: <Clock size={22} className="text-green-600" />,
    bg: "bg-green-50",
    title: "Giờ làm việc",
    content: <p className="text-gray-800 font-semibold">7:00 – 19:00</p>,
    sub: "Thứ 2 đến Chủ nhật, kể cả lễ",
  },
  {
    icon: <Mail size={22} className="text-purple-600" />,
    bg: "bg-purple-50",
    title: "Email",
    content: (
      <a
        href="mailto:info@Auto.la.vn"
        className="text-purple-600 font-semibold hover:underline"
      >
        info@Auto.la.vn
      </a>
    ),
    sub: "Phản hồi trong vòng 24 giờ",
  },
];

export default function ContactPage() {
  return (
    <MainLayout>
      {/* ── Hero ── */}
      <section className="relative bg-[#111] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url(https://picsum.photos/seed/contact/1600/400)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Liên hệ
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-gray-300 max-w-lg mx-auto text-base leading-relaxed mb-8">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 7 ngày trong tuần. Hãy liên hệ
            ngay để được tư vấn miễn phí.
          </p>
          <a
            href="tel:0987654321"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            <Phone size={18} /> Gọi ngay: 0987 654 321
          </a>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONTACT_ITEMS.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  {item.icon}
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {item.title}
                </p>
                <div className="mb-1">{item.content}</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map + Info ── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Info panel — 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-1">
                Tìm chúng tôi
              </p>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                Đến Tham Quan
                <br />
                Showroom Của Chúng Tôi
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Đội ngũ chuyên viên luôn sẵn sàng tư vấn và hỗ trợ bạn chọn được
                chiếc xe ưng ý nhất.
              </p>
            </div>

            {/* Address detail */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              {[
                {
                  icon: (
                    <MapPin
                      size={16}
                      className="text-red-600 shrink-0 mt-0.5"
                    />
                  ),
                  label: "Địa chỉ",
                  value: "123 An Phú Đông, Quận 12, TP. Hồ Chí Minh",
                },
                {
                  icon: (
                    <Clock
                      size={16}
                      className="text-green-600 shrink-0 mt-0.5"
                    />
                  ),
                  label: "Giờ mở cửa",
                  value: "7:00 – 19:00 · Tất cả các ngày",
                },
                {
                  icon: (
                    <Phone
                      size={16}
                      className="text-blue-600 shrink-0 mt-0.5"
                    />
                  ),
                  label: "Hotline",
                  value: "0987 654 321",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  {row.icon}
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      {row.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <a
                href="tel:0987654321"
                className="flex items-center justify-between bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3.5 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Phone size={18} />
                  <span>Gọi ngay: 0987 654 321</span>
                </div>
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>

              <a
                href="https://zalo.me/0987654321"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-3.5 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle size={18} />
                  <span>Nhắn Zalo</span>
                </div>
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
            </div>

            {/* Social + Quick links */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">
                Theo dõi chúng tôi
              </p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Facebook size={16} /> Facebook
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Youtube size={16} /> Youtube
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-bold text-gray-700 mb-3">
                Liên kết nhanh
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/vehicles", label: "Xem xe đang bán" },
                  { to: "/sell", label: "Đăng ký bán xe" },
                  { to: "/services", label: "Dịch vụ" },
                  { to: "/news", label: "Tin tức" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
                  >
                    <ArrowRight size={13} className="text-red-400 shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Map — 3/5 */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 h-full min-h-[480px]">
              <iframe
                title="AUTO Leng Art"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7836.826351521081!2d106.70233418306235!3d10.856145756175945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528147fc926e3%3A0xe2ab55d5e51d44c!2zQW4gUGjDuiDEkMO0bmcgMTIsIEFuIFBow7ogxJDDtG5nLCBRdeG6rW4gMTIsIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1773914861570!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block", minHeight: 480 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="bg-[#111] text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">
            Chưa Tìm Được Xe Ưng Ý?
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Để lại thông tin, chúng tôi sẽ tìm xe phù hợp và liên hệ bạn sớm
            nhất.
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Để lại thông tin <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
