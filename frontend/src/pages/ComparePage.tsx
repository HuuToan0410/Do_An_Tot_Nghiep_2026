import { useSearchParams, Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowLeft,
  GitCompare,
  X,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { getVehicleDetail } from "../api/vehicleDetail";
import { useCompareStore } from "../store/compareStore";
import {
  COMPARE_SPECS,
  getNestedValue,
  formatCompareValue,
  isBestValue,
} from "../api/compare";

// ── Helpers ────────────────────────────────────────────────────

function formatVNPrice(price?: string | number | null): string {
  const num = Number(price ?? 0);
  if (!num) return "Liên hệ";
  const ty = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

// ── Component ──────────────────────────────────────────────────

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const { removeVehicle } = useCompareStore();

  // Lấy vehicle IDs từ URL: /compare?ids=1,2,3
  const idsParam = searchParams.get("ids") ?? "";
  const vehicleIds = idsParam
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
    .slice(0, 3);

  // Fetch tất cả xe song song
  const results = useQueries({
    queries: vehicleIds.map((id) => ({
      queryKey: ["vehicle", id],
      queryFn: () => getVehicleDetail(id),
      retry: 1,
    })),
  });

  const vehicles = results.map((r) => r.data ?? null);
  const isLoading = results.some((r) => r.isLoading);

  // Nhóm specs theo group
  const groups = COMPARE_SPECS.reduce(
    (acc, spec) => {
      if (!acc[spec.group]) acc[spec.group] = [];
      acc[spec.group].push(spec);
      return acc;
    },
    {} as Record<string, (typeof COMPARE_SPECS)[number][]>,
  );

  if (vehicleIds.length < 2) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <GitCompare size={36} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Cần ít nhất 2 xe để so sánh
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Thêm xe vào danh sách so sánh từ trang xem xe.
          </p>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <ArrowLeft size={15} /> Xem danh sách xe
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="bg-[#111] text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">
                So sánh xe
              </p>
              <h1 className="text-2xl font-black">
                So Sánh {vehicleIds.length} Xe
              </h1>
            </div>
            <Link
              to="/vehicles"
              className="flex items-center gap-2 border border-white/20 hover:border-white/50 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft size={15} /> Thêm xe khác
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Vehicle header cards ── */}
        <div
          className="grid gap-4 mb-8"
          style={{
            gridTemplateColumns: `200px repeat(${vehicleIds.length}, 1fr)`,
          }}
        >
          {/* Empty top-left */}
          <div />

          {/* Vehicle cards */}
          {isLoading
            ? vehicleIds.map((id) => (
                <div
                  key={id}
                  className="bg-gray-100 rounded-2xl h-64 animate-pulse"
                />
              ))
            : vehicles.map((vehicle, idx) => {
                const id = vehicleIds[idx];
                if (!vehicle)
                  return (
                    <div
                      key={id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
                    >
                      <p className="text-gray-400 text-sm">Không tìm thấy xe</p>
                    </div>
                  );

                const thumbnail = vehicle.media
                  ?.filter((m) => m.media_type === "IMAGE")
                  .sort(
                    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0),
                  )[0]?.file;

                return (
                  <div
                    key={id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-44 bg-gray-100">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <GitCompare size={40} />
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={() => {
                          removeVehicle(id);
                          window.history.back();
                        }}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-black text-gray-900 text-sm leading-tight mb-1">
                        {vehicle.brand} {vehicle.model}
                        {vehicle.variant ? ` ${vehicle.variant}` : ""}
                      </h3>
                      <p className="text-red-600 font-black text-lg mb-3">
                        {formatVNPrice(vehicle.sale_price)}
                      </p>

                      <div className="space-y-1.5">
                        <Link
                          to={`/vehicles/${id}`}
                          target="_blank"
                          className="flex items-center justify-center gap-1.5 w-full border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-600 text-xs font-semibold py-2 rounded-xl transition-colors"
                        >
                          Xem chi tiết <ChevronRight size={12} />
                        </Link>
                        <Link
                          to={`/deposit/${id}`}
                          className="flex items-center justify-center gap-1.5 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                        >
                          Đặt cọc ngay
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* ── Specs table ── */}
        {!isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {Object.entries(groups).map(([groupName, specs]) => (
              <div key={groupName}>
                {/* Group header */}
                <div className="bg-gray-900 text-white px-5 py-3">
                  <p className="text-sm font-bold uppercase tracking-wider">
                    {groupName}
                  </p>
                </div>

                {/* Spec rows */}
                {specs.map((spec, specIdx) => {
                  const rawValues = vehicles.map((v) =>
                    v ? getNestedValue(v, spec.key) : null,
                  );
                  const formattedValues = rawValues.map((v) =>
                    formatCompareValue(spec.key, v),
                  );
                  const allSame = formattedValues.every(
                    (v) => v === formattedValues[0],
                  );

                  return (
                    <div
                      key={spec.key}
                      className={`grid border-b border-gray-100 last:border-0 ${
                        specIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                      style={{
                        gridTemplateColumns: `200px repeat(${vehicleIds.length}, 1fr)`,
                      }}
                    >
                      {/* Label */}
                      <div className="px-5 py-3.5 flex items-center">
                        <span className="text-sm text-gray-600 font-medium">
                          {spec.label}
                        </span>
                      </div>

                      {/* Values */}
                      {vehicles.map((vehicle, idx) => {
                        const raw = vehicle
                          ? getNestedValue(vehicle, spec.key)
                          : null;
                        const formatted = formatCompareValue(spec.key, raw);
                        const isBest = vehicle
                          ? isBestValue(spec.key, raw, rawValues)
                          : false;
                        const isDiff = !allSame;

                        return (
                          <div
                            key={idx}
                            className={`px-5 py-3.5 flex items-center gap-2 border-l border-gray-100 ${
                              isBest ? "bg-green-50" : ""
                            }`}
                          >
                            {/* Boolean icon */}
                            {typeof raw === "boolean" ? (
                              raw ? (
                                <CheckCircle
                                  size={16}
                                  className="text-green-500 shrink-0"
                                />
                              ) : (
                                <XCircle
                                  size={16}
                                  className="text-red-400 shrink-0"
                                />
                              )
                            ) : null}

                            <span
                              className={`text-sm font-semibold ${
                                formatted === "—"
                                  ? "text-gray-300"
                                  : isBest
                                    ? "text-green-700"
                                    : isDiff
                                      ? "text-gray-900"
                                      : "text-gray-600"
                              }`}
                            >
                              {typeof raw === "boolean"
                                ? raw
                                  ? "Có"
                                  : "Không"
                                : formatted}
                            </span>

                            {isBest && (
                              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                Tốt nhất
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Cần thêm xe để so sánh? Quay lại danh sách xe và thêm vào bảng so
            sánh.
          </p>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <ArrowLeft size={15} /> Xem thêm xe khác
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
