// src/pages/VehiclesPage.tsx
// Thay đổi: truyền thêm status và hasAppointment vào VehicleCard
// Giữ nguyên toàn bộ logic filter / pagination

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Car,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { getVehicles } from "../api/vehicles";
import type { VehicleFilters } from "../api/vehicles";
import VehicleCard from "../components/VehicleCard";
import VehicleFilter from "../components/VehicleFilter";

const ORDERING_OPTIONS = [
  { value: "", label: "Mặc định" },
  { value: "sale_price", label: "Giá tăng dần" },
  { value: "-sale_price", label: "Giá giảm dần" },
  { value: "-year", label: "Xe mới nhất" },
  { value: "mileage", label: "Ít km nhất" },
];

const PAGE_SIZE = 12;

export default function VehiclesPage() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<VehicleFilters>({
    search: searchParams.get("search") ?? "",
    brand: searchParams.get("brand") ?? "",
    min_price: searchParams.get("min_price") ?? "",
    max_price: searchParams.get("max_price") ?? "",
    fuel_type: searchParams.get("fuel_type") ?? "",
    transmission: searchParams.get("transmission") ?? "",
    year: searchParams.get("year") ?? "",
    body_type: searchParams.get("body_type") ?? "",
    ordering: "",
    page: 1,
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => getVehicles(filters),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const currentPage = filters.page ?? 1;

  const hasActiveFilter =
    !!filters.brand ||
    !!filters.min_price ||
    !!filters.max_price ||
    !!filters.fuel_type ||
    !!filters.transmission ||
    !!filters.year ||
    !!filters.body_type;

  function resetAllFilters() {
    setFilters({
      search: "",
      brand: "",
      min_price: "",
      max_price: "",
      fuel_type: "",
      transmission: "",
      year: "",
      body_type: "",
      ordering: "",
      page: 1,
    });
  }

  return (
    <MainLayout>
      {/* ── Hero header ── */}
      <section className="bg-gradient-to-r from-gray-900 to-[#111] text-white py-8 sm:py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-red-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
                Kho xe
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                Xe Đang Bán
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
                <Car size={14} />
                {isLoading
                  ? "Đang tải..."
                  : `${data?.count ?? 0} xe đang có sẵn`}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-full pl-9 pr-9 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:bg-white/15 transition-all"
                placeholder="Tìm xe theo tên, hãng, VIN..."
                value={filters.search ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                }
              />
              {filters.search && (
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, search: "", page: 1 }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {hasActiveFilter && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
                <span>
                  {Object.values(filters).filter(Boolean).length - 2} bộ lọc
                  đang áp dụng
                </span>
                <button
                  onClick={resetAllFilters}
                  className="hover:text-red-900"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <button
              className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold hover:border-red-400 hover:text-red-600 transition-colors"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={15} /> Bộ lọc
              {hasActiveFilter && (
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              )}
            </button>
          </div>

          <select
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors bg-white min-w-[160px]"
            value={filters.ordering ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, ordering: e.target.value, page: 1 }))
            }
          >
            {ORDERING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block col-span-1 self-start sticky top-24">
            <VehicleFilter filters={filters} setFilters={setFilters} />
          </div>

          {/* Vehicle list */}
          <div className="col-span-1 lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <div className="h-48 bg-gray-100 animate-pulse" />
                    <div className="p-4 space-y-2 bg-white border border-t-0 border-gray-100 rounded-b-2xl">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                      <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.results?.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-xl font-black text-gray-800 mb-2">
                  Không tìm thấy xe phù hợp
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  <X size={14} /> Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
                >
                  {data?.results?.map((v) => (
                    <VehicleCard
                      key={v.id}
                      id={v.id}
                      name={`${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ""}`}
                      price={v.sale_price}
                      image={v.thumbnail ?? undefined}
                      year={v.year}
                      km={v.mileage}
                      fuel={v.fuel_type}
                      transmission={v.transmission}
                      // ── TRUYỀN DỮ LIỆU TỪ API ──────────────
                      status={v.status}
                      hasAppointment={(v as any).has_appointment ?? false}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 pt-8 border-t border-gray-100">
                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, page: currentPage - 1 }))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-400 hover:text-red-600 transition-colors"
                    >
                      <ChevronLeft size={16} /> Trước
                    </button>

                    <div className="flex gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1,
                        )
                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1)
                            acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "..." ? (
                            <span
                              key={`dots-${i}`}
                              className="px-2 py-2.5 text-gray-400 text-sm"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={`page-${p}`}
                              onClick={() =>
                                setFilters((f) => ({ ...f, page: p as number }))
                              }
                              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                currentPage === p
                                  ? "bg-red-600 text-white shadow-md"
                                  : "border border-gray-200 hover:border-red-400 hover:text-red-600"
                              }`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                    </div>

                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, page: currentPage + 1 }))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-400 hover:text-red-600 transition-colors"
                    >
                      Sau <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <p className="font-black text-gray-900">Bộ lọc</p>
                {hasActiveFilter && (
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    Đang áp dụng bộ lọc
                  </p>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <VehicleFilter filters={filters} setFilters={setFilters} />
            </div>
            <div className="p-4 border-t space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Áp dụng
              </button>
              {hasActiveFilter && (
                <button
                  onClick={() => {
                    resetAllFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:border-red-400 hover:text-red-600 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
