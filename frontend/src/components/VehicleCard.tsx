import { Link } from "react-router-dom";
import {
  Fuel,
  Settings,
  Gauge,
  Eye,
  CheckCircle,
  GitCompare,
  Check,
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
}: Props) {
  const priceDisplay = formatPrice(price);
  const fuelLabel = getFuelLabel(fuel);
  const transmissionLabel = getTransmissionLabel(transmission);
  const hasPrice = Number(price ?? 0) > 0;
  const addVehicle = useCompareStore((s) => s.addVehicle);
  const hasVehicle = useCompareStore((s) => s.hasVehicle);
  const inCompare = hasVehicle(id);
  return (
    <Link to={`/vehicles/${id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
        {/* Image */}
        <div className="relative overflow-hidden h-48 bg-gray-100">
          <img
            src={image || "/placeholder-car.jpg"}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
            }}
          />

          {/* ⭐ Favorite Button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton vehicleId={id} size="sm" />
          </div>

          {year && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
              {year}
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
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
              <span
                className={`font-black text-lg leading-none ${hasPrice ? "text-red-600" : "text-gray-500"}`}
              >
                {priceDisplay}
              </span>
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
              {isVerified && (
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={11} className="text-green-500" />
                  <span className="text-[10px] text-green-600 font-medium">
                    Đã kiểm định
                  </span>
                </div>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-red-600 font-medium bg-gray-50 group-hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all">
              <Eye size={13} /> Xem chi tiết
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
