import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Facebook, Youtube } from "lucide-react";

const QUICK_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Mua xe", to: "/vehicles" },
  { label: "Bán xe", to: "/sell" },
  { label: "Dịch vụ", to: "/services" },
  { label: "Khuyến mãi", to: "/news" },
  { label: "Tin tức", to: "/news" },
];

const BRAND_LINKS = [
  "Toyota",
  "Mazda",
  "Honda",
  "Hyundai",
  "KIA",
  "Ford",
  "Nissan",
  "Vinfast",
  "BMW",
  "Audi",
  "Mercedes Benz",
  "Volvo",
  "Peugeot",
  "Mitsubishi",
  "Chevrolet",
  "Suzuki",
  "Lexus",
  "Subaru",
];

export default function Footer() {
  return (
    <footer className="bg-[#111] text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img
              src="../../public/1-removebg-preview.png" 
              alt="AUTO.LA"
              className="h-24 w-auto object-contain"
            />
            <span className="text-white font-bold text-sm leading-tight">
              AUTO Leng Art
              <br />
              <span className="text-gray-500 font-normal text-xs">
                TP.Hồ Chí Minh
              </span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed">
            Nền tảng mua bán xe ô tô đã qua sử dụng uy tín hàng đầu tại Tp.Hồ
            Chí Minh. Cam kết minh bạch, chất lượng kiểm định.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-white transition-colors"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Youtube"
              className="hover:text-white transition-colors"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
            Liên kết nhanh
          </h4>
          <ul className="space-y-2 text-sm">
            {QUICK_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="hover:text-red-400 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Brands */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
            Hãng xe
          </h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {BRAND_LINKS.map((b) => (
              <li key={b}>
                <Link
                  to={`/vehicles?brand=${b}`}
                  className="hover:text-red-400 transition-colors"
                >
                  {b}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
            Liên hệ
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-red-500 shrink-0" />
              Số 123 An phú Đông, Quận 12, Tp.Hồ Chí Minh
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-red-500 shrink-0" />
              <a
                href="tel:0987654321"
                className="hover:text-white transition-colors"
              >
                0987 654 321
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock size={16} className="text-red-500 shrink-0" />
              7:00 – 19:00 (Tất cả các ngày)
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        © 2026 AUTO.LA. All rights reserved.
      </div>
    </footer>
  );
}
