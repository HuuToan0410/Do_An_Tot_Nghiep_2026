// src/components/VehicleCard.tsx
// Thêm badge "Đã đặt cọc" (RESERVED) và "Có lịch hẹn" (has_appointment)
// — dữ liệu 100% từ API, không mock

import { Link } from "react-router-dom";
import {
  Fuel,
  Settings,
  Gauge,
  Eye,
  CheckCircle,
  GitCompare,
  Check,
  Lock,
  CalendarCheck,
} from "lucide-react";
import { FUEL_TYPES, TRANSMISSIONS } from "../api/vehicles";
import { useCompareStore } from "../store/compareStore";
import FavoriteButton from "./FavoriteButton";

interface Props {
  id: number;
  name: string;
  price?: number | string | null;
  image?: string | null;
  year?: string | number;
  km?: string | number;
  fuel?: string;
  transmission?: string;
  isVerified?: boolean;
  // ── Dữ liệu trạng thái từ API ─────────────────────
  status?: string; // VehicleUnit.status (LISTED / RESERVED / SOLD / ...)
  hasAppointment?: boolean; // VehicleListSerializer.has_appointment
}

function getFuelLabel(value?: string) {
  return FUEL_TYPES.find((f) => f.value === value)?.label ?? value ?? "";
}
function getTransmissionLabel(value?: string) {
  return TRANSMISSIONS.find((t) => t.value === value)?.label ?? value ?? "";
}
function formatPrice(price?: number | string | null): string {
  const num = Number(price ?? 0);
  if (!num || num <= 0) return "Liên hệ";
  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, "")} Tỷ`;
  }
  return `${Math.round(num / 1_000_000)} Triệu`;
}

export default function VehicleCard({
  id,
  name,
  price,
  image,
  year,
  km,
  fuel,
  transmission,
  isVerified = true,
  status,
  hasAppointment,
}: Props) {
  const priceDisplay = formatPrice(price);
  const fuelLabel = getFuelLabel(fuel);
  const transmissionLabel = getTransmissionLabel(transmission);
  const hasPrice = Number(price ?? 0) > 0;

  const addVehicle = useCompareStore((s) => s.addVehicle);
  const hasVehicle = useCompareStore((s) => s.hasVehicle);
  const inCompare = hasVehicle(id);

  // ── Trạng thái từ API ─────────────────────────────
  const isReserved = status === "RESERVED";
  const isSold = status === "SOLD" || status === "WARRANTY";

  return (
    <Link to={`/vehicles/${id}`} className="group block">
      <div
        className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border hover:-translate-y-1 ${
          isReserved
            ? "border-amber-200"
            : isSold
              ? "border-gray-200"
              : "border-gray-100"
        }`}
      >
        {/* Image */}
        <div className="relative overflow-hidden h-48 bg-gray-100">
          <img
            src={image || "/placeholder-car.jpg"}
            alt={name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isSold ? "grayscale-[30%]" : ""
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
            }}
          />

          {/* Favorite */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton vehicleId={id} size="sm" />
          </div>

          {/* Year badge */}
          {year && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
              {year}
            </div>
          )}

          {/* ── STATUS OVERLAY từ API ── */}
          {isReserved && (
            <div className="absolute bottom-3 left-3">
              <span className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                <Lock size={11} /> Đã đặt cọc
              </span>
            </div>
          )}

          {isSold && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <span className="bg-gray-800/90 text-white text-sm font-black px-4 py-2 rounded-xl">
                Đã bán
              </span>
            </div>
          )}

          {/* Badge lịch hẹn — chỉ khi xe chưa bị khoá/bán */}
          {hasAppointment && !isReserved && !isSold && (
            <div className="absolute bottom-3 left-3">
              <span className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                <CalendarCheck size={11} /> Có lịch hẹn
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3
            className={`font-bold text-sm mb-2 line-clamp-2 transition-colors leading-snug ${
              isSold
                ? "text-gray-400"
                : "text-gray-900 group-hover:text-red-600"
            }`}
          >
            {name}
          </h3>

          {/* Specs */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 mb-3">
            {fuelLabel && (
              <span className="flex items-center gap-1">
                <Fuel size={11} className="text-gray-400" /> {fuelLabel}
              </span>
            )}
            {fuelLabel && transmissionLabel && (
              <span className="text-gray-300">|</span>
            )}
            {transmissionLabel && (
              <span className="flex items-center gap-1">
                <Settings size={11} className="text-gray-400" />{" "}
                {transmissionLabel}
              </span>
            )}
            {km && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <Gauge size={11} className="text-gray-400" />
                  {Number(km).toLocaleString("vi-VN")} km
                </span>
              </>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {/* Giá */}
              <span
                className={`font-black text-lg leading-none ${
                  isSold
                    ? "text-gray-400 line-through"
                    : isReserved
                      ? "text-amber-600"
                      : hasPrice
                        ? "text-red-600"
                        : "text-gray-500"
                }`}
              >
                {priceDisplay}
              </span>

              {/* So sánh button */}
              {!isSold && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addVehicle(id);
                  }}
                  className={`mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-all ${
                    inCompare
                      ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                      : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
                  }`}
                  title={inCompare ? "Đã thêm vào so sánh" : "Thêm vào so sánh"}
                >
                  {inCompare ? (
                    <>
                      <Check size={12} /> Đang so sánh
                    </>
                  ) : (
                    <>
                      <GitCompare size={12} /> So sánh
                    </>
                  )}
                </button>
              )}

              {isVerified && !isSold && (
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={11} className="text-green-500" />
                  <span className="text-[10px] text-green-600 font-medium">
                    Đã kiểm định
                  </span>
                </div>
              )}
            </div>

            {/* Xem chi tiết */}
            <span
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                isSold
                  ? "text-gray-400 bg-gray-50"
                  : "text-gray-500 group-hover:text-red-600 bg-gray-50 group-hover:bg-red-50"
              }`}
            >
              <Eye size={13} /> {isSold ? "Đã bán" : "Xem chi tiết"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
