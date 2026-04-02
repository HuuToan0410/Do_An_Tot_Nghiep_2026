import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { VehicleFilters } from "../api/vehicles";
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES } from "../api/vehicles";

const BRANDS = [
  "Toyota",
  "Mazda",
  "KIA",
  "Honda",
  "Hyundai",
  "Ford",
  "Vinfast",
  "BMW",
  "Audi",
  "Mercedes Benz",
  "Nissan",
  "Mitsubishi",
];

const PRICE_RANGES = [
  { label: "Dưới 300 triệu", min: "", max: "300000000" },
  { label: "300 – 500 triệu", min: "300000000", max: "500000000" },
  { label: "500 – 800 triệu", min: "500000000", max: "800000000" },
  { label: "800 triệu – 1 tỷ", min: "800000000", max: "1000000000" },
  { label: "Trên 1 tỷ", min: "1000000000", max: "" },
];

const YEARS = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => String(new Date().getFullYear() - i),
);

interface Props {
  filters: VehicleFilters;
  setFilters: (filters: VehicleFilters) => void;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </label>
      {children}
    </div>
  );
}

export default function VehicleFilter({ filters, setFilters }: Props) {
  const hasActiveFilter =
    !!filters.brand ||
    !!filters.min_price ||
    !!filters.max_price ||
    !!filters.fuel_type ||
    !!filters.transmission ||
    !filters.body_type ||
    !!filters.year;

  function reset() {
    setFilters({
      search: filters.search ?? "",
      brand: "",
      min_price: "",
      max_price: "",
      fuel_type: "",
      transmission: "",
      body_type: "",
      year: "",
      ordering: "",
      page: 1,
    });
  }

  function set(partial: Partial<VehicleFilters>) {
    setFilters({ ...filters, ...partial, page: 1 });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <SlidersHorizontal size={16} className="text-red-600" />
          Bộ lọc
        </div>
        {hasActiveFilter && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            <RotateCcw size={12} /> Xóa lọc
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Brand */}
        <FilterSection title="Hãng xe">
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <button
              onClick={() => set({ brand: "" })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !filters.brand
                  ? "bg-red-50 text-red-600 font-semibold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              Tất cả hãng
            </button>
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => set({ brand })}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  filters.brand === brand
                    ? "bg-red-50 text-red-600 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </FilterSection>

        <div className="border-t border-gray-100" />

        {/* Price range */}
        <FilterSection title="Khoảng giá">
          <div className="space-y-1">
            {PRICE_RANGES.map((range) => {
              const active =
                filters.min_price === range.min &&
                filters.max_price === range.max;
              return (
                <button
                  key={range.label}
                  onClick={() =>
                    set({ min_price: range.min, max_price: range.max })
                  }
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-red-50 text-red-600 font-semibold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Custom price */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input
              type="number"
              placeholder="Từ (VND)"
              value={filters.min_price ?? ""}
              onChange={(e) => set({ min_price: e.target.value })}
              className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-red-400 transition-colors"
            />
            <input
              type="number"
              placeholder="Đến (VND)"
              value={filters.max_price ?? ""}
              onChange={(e) => set({ max_price: e.target.value })}
              className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-red-400 transition-colors"
            />
          </div>
        </FilterSection>

        <div className="border-t border-gray-100" />

        {/* Fuel type */}
        <FilterSection title="Nhiên liệu">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => set({ fuel_type: "" })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                !filters.fuel_type
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              Tất cả
            </button>
            {FUEL_TYPES.map((f) => (
              <button
                key={f.value}
                onClick={() => set({ fuel_type: f.value })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filters.fuel_type === f.value
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FilterSection>

        <div className="border-t border-gray-100" />

        {/* Transmission */}
        <FilterSection title="Hộp số">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => set({ transmission: "" })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                !filters.transmission
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              Tất cả
            </button>
            {TRANSMISSIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => set({ transmission: t.value })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filters.transmission === t.value
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FilterSection>

        <div className="border-t border-gray-100" />

        {/* ── Body Type MỚI ── */}
        <FilterSection title="Kiểu dáng xe">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => set({ body_type: "" })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                !filters.body_type
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              Tất cả
            </button>
            {BODY_TYPES.map((b) => (
              <button
                key={b.value}
                onClick={() => set({ body_type: b.value })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filters.body_type === b.value
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </FilterSection>

        <div className="border-t border-gray-100" />

        {/* Year */}
        <FilterSection title="Năm sản xuất">
          <select
            value={filters.year ?? ""}
            onChange={(e) => set({ year: e.target.value })}
            className=" w-full sm:w-auto max-w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 truncate"
          >
            <option value="">Tất cả năm</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </FilterSection>
      </div>
    </div>
  );
}
