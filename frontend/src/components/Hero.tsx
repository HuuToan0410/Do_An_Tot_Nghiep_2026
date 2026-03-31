import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const BODY_TYPES = [
  { label: "CUV", value: "CUV", icon: "/cuv.png" },
  { label: "SUV", value: "SUV", icon: "/suv.png" },
  { label: "MPV", value: "MPV", icon: "/mpv.png" },
  { label: "Sedan", value: "SEDAN", icon: "/sedan.png" },
  { label: "Hatchback", value: "HATCHBACK", icon: "/hatpack.png" },
  { label: "Coupe", value: "COUPE", icon: "/couple.png" },
  { label: "Pickup", value: "PICKUP", icon: "/pickup.png" },
];

const PRICE_RANGES = [
  { label: "Dưới 500 triệu", min: "", max: "500000000" },
  { label: "500 – 700 triệu", min: "500000000", max: "700000000" },
  { label: "700 triệu – 1 tỷ", min: "700000000", max: "1000000000" },
  { label: "Trên 1 tỷ", min: "1000000000", max: "" },
];

export default function Hero() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearch() {
    if (search.trim()) {
      navigate(`/vehicles?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/vehicles");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div>
      {/* ── Banner ── */}
      <section
        className="relative overflow-hidden bg-[#111]"
        style={{ minHeight: 360 }}
      >
        <img
          src="https://picsum.photos/seed/carbanner/1600/400"
          alt="Banner khuyến mãi"
          className="w-full h-[360px] object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-8 text-white">
            <p className="text-xs uppercase tracking-widest text-red-300 mb-2 font-semibold">
              AUTO Leng Art
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3 drop-shadow-lg">
              NỀN TẢNG MUA BÁN XE Ô TÔ
              <br />
              <span className="text-red-500">ĐÃ QUA SỬ DỤNG</span>
            </h1>
            <p className="text-gray-300 text-sm max-w-md">
              Hàng trăm xe kiểm định chất lượng. Minh bạch giá cả. Hỗ trợ vay
              vốn nhanh chóng.
            </p>
          </div>
        </div>
      </section>

      {/* ── Search & CTA block ── */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-1">
            AUTO Leng Art
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 uppercase">
            Nền Tảng Mua Bán Xe Ô Tô Đã Qua Sử Dụng
          </h2>

          {/* CTA buttons */}
          <div className="flex gap-3 justify-center mb-7">
            <Link
              to="/vehicles"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Mua xe ngay
            </Link>
            <Link
              to="/sell"
              className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Bán xe ngay
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm focus-within:border-red-400 transition-colors">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm nhãn hiệu, mẫu xe hoặc từ khóa..."
              className="flex-1 px-4 py-3 text-gray-700 text-sm outline-none"
            />
            <button
              onClick={handleSearch}
              className="bg-gray-900 hover:bg-black px-6 text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Search size={15} /> Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* ── Body type & price range ── */}
      <section className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Body type — dùng <img> thay vì <span> */}
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {BODY_TYPES.map((t) => (
              <Link
                key={t.value}
                to={`/vehicles?body_type=${t.value}`}
                className="flex flex-col items-center gap-2 bg-white border border-gray-200 hover:border-red-500 hover:shadow-md rounded-xl px-5 py-4 min-w-[90px] transition-all group"
              >
                <img
                  src={t.icon}
                  alt={t.label}
                  className="h-10 w-16 object-contain group-hover:scale-110 transition-transform duration-200"
                  onError={(e) => {
                    // Fallback nếu ảnh không load được
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-xs font-bold text-gray-700 group-hover:text-red-600 transition-colors">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Price range */}
          <div className="flex flex-wrap justify-center gap-2">
            {PRICE_RANGES.map((r) => (
              <Link
                key={r.label}
                to={`/vehicles?min_price=${r.min}&max_price=${r.max}`}
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                {r.label}
              </Link>
            ))}
            <Link
              to="/vehicles"
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
            >
              Xem tất cả xe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
