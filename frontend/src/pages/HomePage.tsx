import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Star, ShieldCheck,
  Clock3, BadgeCheck, Phone,
} from "lucide-react";

import MainLayout          from "../layouts/MainLayout";
import Hero                from "../components/Hero";
import BrandBar            from "../components/BrandBar";
import VehicleCard         from "../components/VehicleCard";
import ServicesSection     from "../components/ServicesSection";
import NewsSection         from "../components/NewsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import { getVehicles }     from "../api/vehicles";

// ── Constants ──────────────────────────────────────────────────

const STATS = [
  { value: "500+",  label: "Xe đang bán",        icon: <Star size={22} />       },
  { value: "10+",   label: "Năm kinh nghiệm",     icon: <Clock3 size={22} />     },
  { value: "5000+", label: "Khách hàng hài lòng", icon: <ShieldCheck size={22} />},
  { value: "100%",  label: "Xe kiểm định kỹ",     icon: <BadgeCheck size={22} /> },
];

const SKELETON_COUNT = 8;

// ── Component ──────────────────────────────────────────────────

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["featuredVehicles"],
    queryFn:  () => getVehicles({ page: 1, ordering: "-created_at" }),
    staleTime: 0,
  });

  const cars = data?.results ?? [];

  return (
    <MainLayout>

      {/* ── Hero ── */}
      <Hero />

      {/* ── Brand logos ── */}
      <BrandBar />

      {/* ── Stats bar ── */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-red-500/40">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 px-6 py-2 text-center">
              <div className="text-red-200">{s.icon}</div>
              <div className="text-3xl md:text-4xl font-black tracking-tight">{s.value}</div>
              <div className="text-red-200 text-xs uppercase tracking-wider font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured vehicles ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">

          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-red-600 text-sm font-bold uppercase tracking-widest mb-1">
                AUTO Leng Art
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                Tìm Ưu Đãi Tốt Nhất<br />
                <span className="text-red-600">Cho Bạn</span>
              </h2>
            </div>
            <Link
              to="/vehicles"
              className="hidden sm:flex items-center gap-2 text-red-600 font-semibold text-sm border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2.5 rounded-xl transition-all"
            >
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>

          {/* Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && cars.length === 0 && (
            <div className="text-center py-24 bg-gray-50 rounded-2xl">
              <p className="text-6xl mb-4">🚗</p>
              <p className="text-gray-500 font-medium">Chưa có xe nào. Vui lòng quay lại sau.</p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && cars.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {cars.map((car) => (
                  <VehicleCard
                    key={car.id}
                    id={car.id}
                    name={`${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ""}`}
                    price={car.sale_price}
                    image={car.thumbnail ?? undefined}
                    year={car.year}
                    km={car.mileage}
                    fuel={car.fuel_type}
                    transmission={car.transmission}
                  />
                ))}
              </div>

              {/* Mobile view all + desktop CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link
                  to="/vehicles"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-sm"
                >
                  Xem tất cả xe <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Services section ── */}
      <ServicesSection />

      {/* ── Why choose us ── */}
      <section className="bg-[#111] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-3">
                Tại sao chọn chúng tôi
              </p>
              <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                Mua Xe An Toàn<br />
                <span className="text-red-500">Uy Tín — Minh Bạch</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hơn 10 năm kinh nghiệm trong lĩnh vực mua bán xe ô tô đã qua sử dụng,
                chúng tôi cam kết mang lại trải nghiệm mua xe tốt nhất cho khách hàng.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  "Xe kiểm định 100+ hạng mục",
                  "Giá niêm yết, không phụ thu",
                  "Hỗ trợ vay ngân hàng",
                  "Bảo hành 6 tháng / 10.000 km",
                  "Sang tên nhanh trong ngày",
                  "Chính sách đổi trả linh hoạt",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shrink-0">
                      <ArrowRight size={10} className="text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
              >
                Tìm hiểu thêm <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right — stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+",  label: "Xe đã bán",          color: "text-red-400"    },
                { value: "5000+", label: "Khách hài lòng",     color: "text-orange-400" },
                { value: "10+",   label: "Năm kinh nghiệm",    color: "text-yellow-400" },
                { value: "30'",   label: "Phản hồi tư vấn",    color: "text-green-400"  },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                  <p className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</p>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── News section ── */}
      <NewsSection />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Sell CTA banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#111] to-red-950 text-white py-20">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-red-600/20 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 border border-red-600/30">
            Bán xe nhanh
          </span>
          <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Bạn Muốn Bán Xe?
          </h3>
          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Định giá miễn phí trong 30 phút. Thủ tục đơn giản.
            Thanh toán ngay trong ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sell"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
            >
              Đăng ký bán xe ngay <ArrowRight size={18} />
            </Link>
            <a
              href="tel:0987654321"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              <Phone size={18} /> Gọi: 0987 654 321
            </a>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}