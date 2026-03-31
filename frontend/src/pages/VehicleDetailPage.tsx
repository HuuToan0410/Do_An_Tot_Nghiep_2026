import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  MessageCircle,
  Shield,
  ChevronRight,
  Fuel,
  Settings,
  Gauge,
  Calendar,
  MapPin,
  CheckCircle,
  Car,
  Star,
  ArrowRight,
  Heart,
} from "lucide-react";
import { getVehiclePublicInspection } from "../api/inspection";
import InspectionReport from "../components/InspectionReport";
import MainLayout from "../layouts/MainLayout";
import { getVehicleDetail } from "../api/vehicleDetail";
import { getVehicles, FUEL_TYPES, TRANSMISSIONS } from "../api/vehicles";
import VehicleGallery from "../components/VehicleGallery";
import VehicleCard from "../components/VehicleCard";
import FavoriteButton from "../components/FavoriteButton";
import AppointmentForm from "../components/Appointmentform";
// ── Helpers ────────────────────────────────────────────────────

function getFuelLabel(v?: string) {
  return FUEL_TYPES.find((f) => f.value === v)?.label ?? v ?? "—";
}
function getTransmissionLabel(v?: string) {
  return TRANSMISSIONS.find((t) => t.value === v)?.label ?? v ?? "—";
}
function formatVNPrice(price?: string | number | null): string {
  const num = Number(price ?? 0);
  if (!num || num <= 0) return "Liên hệ";
  const ty = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${trieu} Triệu VNĐ`;
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors">
      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams();

  const { data: inspection } = useQuery({
    queryKey: ["vehicleInspection", id],
    queryFn: () => getVehiclePublicInspection(id!),
    enabled: !!id,
    retry: false, // không retry nếu 404
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleDetail(id!),
    enabled: !!id,
    retry: 1,
  });

  const { data: featuredData } = useQuery({
    queryKey: ["featuredVehicles", id],
    queryFn: () => getVehicles({ ordering: "-created_at", page: 1 }),
    enabled: !!data,
  });

  const featuredCars = (featuredData?.results ?? [])
    .filter((v) => String(v.id) !== String(id))
    .slice(0, 4);
  

  // ── Loading ──
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8  bg-gray-100 rounded-xl animate-pulse w-2/3" />
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Error ──
  if (isError || !data) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-7xl mb-5">🚗</p>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Không tìm thấy xe
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Xe này có thể đã được bán hoặc không tồn tại.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Xem xe khác <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images =
    data.media
      ?.filter((m) => m.media_type === "IMAGE")
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((m) => m.file) ?? [];

  const spec = data.spec;

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-red-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={12} />
          <Link to="/vehicles" className="hover:text-red-600 transition-colors">
            Xe đang bán
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-semibold truncate">
            {data.brand} {data.model} {data.year}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* ── Gallery ── */}
          <div>
            <VehicleGallery images={images} />
          </div>

          {/* ── Info ── */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <CheckCircle size={11} /> Đã kiểm định
              </span>
              {data.year && (
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {data.year}
                </span>
              )}
              {data.status_display && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {data.status_display}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                {data.brand} {data.model}
                {data.variant ? ` ${data.variant}` : ""}
              </h1>
              {data.license_plate && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                  <Car size={13} className="text-gray-400" />
                  Biển số:{" "}
                  <span className="font-semibold text-gray-600">
                    {data.license_plate}
                  </span>
                </p>
              )}
            </div>

            {/* Price block */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-5 border border-red-100">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                Giá bán
              </p>
              <p className="text-4xl font-black text-red-600 leading-none">
                {formatVNPrice(data.sale_price)}
              </p>
              {data.purchase_price && Number(data.purchase_price) > 0 && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  Giá thu mua:{" "}
                  {Number(data.purchase_price).toLocaleString("vi-VN")} đ
                </p>
              )}
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <SpecItem
                icon={<Calendar size={14} />}
                label="Năm sản xuất"
                value={data.year}
              />
              <SpecItem
                icon={<Gauge size={14} />}
                label="Số km"
                value={
                  data.mileage
                    ? `${Number(data.mileage).toLocaleString("vi-VN")} km`
                    : null
                }
              />
              <SpecItem
                icon={<Settings size={14} />}
                label="Hộp số"
                value={getTransmissionLabel(data.transmission)}
              />
              <SpecItem
                icon={<Fuel size={14} />}
                label="Nhiên liệu"
                value={getFuelLabel(data.fuel_type)}
              />
              {spec?.seats && (
                <SpecItem
                  icon={<Car size={14} />}
                  label="Số chỗ"
                  value={`${spec.seats} chỗ`}
                />
              )}
              {spec?.body_type && (
                <SpecItem
                  icon={<Car size={14} />}
                  label="Kiểu xe"
                  value={spec.body_type_display || spec.body_type}
                />
              )}
              {data.color && (
                <SpecItem
                  icon={<Star size={14} />}
                  label="Màu sắc"
                  value={data.color}
                />
              )}
              {spec?.engine_capacity && (
                <SpecItem
                  icon={<Settings size={14} />}
                  label="Dung tích"
                  value={`${spec.engine_capacity}L`}
                />
              )}
              {spec?.origin && (
                <SpecItem
                  icon={<MapPin size={14} />}
                  label="Xuất xứ"
                  value={spec.origin_display || spec.origin}
                />
              )}
              {spec?.doors && (
                <SpecItem
                  icon={<Car size={14} />}
                  label="Số cửa"
                  value={spec.doors}
                />
              )}
              {data.vin && (
                <SpecItem
                  icon={<Shield size={14} />}
                  label="Số VIN"
                  value={data.vin}
                />
              )}
            </div>

            {/* Safety badges */}
            {spec &&
              (spec.has_abs ||
                spec.has_airbags ||
                spec.has_camera ||
                spec.has_360_camera ||
                spec.has_sunroof) && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Tính năng an toàn
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {spec.has_abs && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full font-semibold">
                        <CheckCircle size={10} /> ABS
                      </span>
                    )}
                    {spec.has_airbags && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full font-semibold">
                        <CheckCircle size={10} /> Túi khí ({spec.airbag_count})
                      </span>
                    )}
                    {spec.has_camera && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full font-semibold">
                        <CheckCircle size={10} /> Camera lùi
                      </span>
                    )}
                    {spec.has_360_camera && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full font-semibold">
                        <CheckCircle size={10} /> Camera 360°
                      </span>
                    )}
                    {spec.has_sunroof && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full font-semibold">
                        <CheckCircle size={10} /> Cửa sổ trời
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* CTA */}
            <div className="space-y-3 pt-1">
              <Link
                to={`/deposit/${data.id}`}
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                <Heart size={18} /> Đặt cọc xe ngay
              </Link>
              <FavoriteButton
                vehicleId={Number(id)}
                size="lg"
                showLabel
                className="w-full justify-center border border-gray-200"
              />
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:0987654321"
                  className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  <Phone size={15} /> Gọi ngay
                </a>
                <a
                  href="https://zalo.me/0987654321"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  <MessageCircle size={15} /> Nhắn Zalo
                </a>
              </div>
              {inspection && (
                <Link
                  to={`/vehicles/${data.id}/inspection`}
                  className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-3 rounded-xl transition-colors text-sm border border-green-200"
                >
                  <Shield size={15} /> Xem báo cáo kiểm định đầy đủ
                </Link>
              )}
            </div>

            {/* Trust bar */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  icon: <Shield size={14} className="text-green-600" />,
                  text: "Giao dịch an toàn",
                },
                {
                  icon: <CheckCircle size={14} className="text-blue-600" />,
                  text: "Xe đã kiểm định",
                },
                {
                  icon: <Phone size={14} className="text-red-600" />,
                  text: "Hỗ trợ 7/7",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-3 text-center"
                >
                  {item.icon}
                  <span className="text-xs text-gray-600 font-medium leading-tight">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Details tabs ── */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col — 2/3 */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tình trạng xe */}
            {spec &&
              (spec.engine_condition ||
                spec.brake_condition ||
                spec.tire_condition ||
                spec.electrical_condition) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                    <span className="w-1 h-5 bg-red-600 rounded-full" />
                    Tình trạng xe
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Động cơ", value: spec.engine_condition },
                      { label: "Hệ thống phanh", value: spec.brake_condition },
                      { label: "Lốp xe", value: spec.tire_condition },
                      {
                        label: "Hệ thống điện",
                        value: spec.electrical_condition,
                      },
                    ]
                      .filter((i) => i.value)
                      .map((item) => (
                        <div
                          key={item.label}
                          className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100"
                        >
                          <p className="text-xs text-gray-400 mb-1.5">
                            {item.label}
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {item.value}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Mô tả */}
            {data.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-red-600 rounded-full" />
                  Mô tả xe
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                  {data.description}
                </p>
              </div>
            )}
            {inspection && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-green-600 rounded-full" />
                  <h2 className="text-lg font-black text-gray-900">
                    Báo cáo kiểm định
                  </h2>
                </div>
                <InspectionReport inspection={inspection} compact />
              </div>
            )}

            {/* Lịch sử */}
            {data.status_logs && data.status_logs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-red-600 rounded-full" />
                  Lịch sử vòng đời xe
                </h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {data.status_logs.slice(0, 5).map((log, i) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 pl-6 relative"
                      >
                        <div
                          className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0 mt-0.5 ${i === 0 ? "bg-red-500" : "bg-gray-300"}`}
                        />
                        <div className="flex-1 min-w-0 bg-gray-50 rounded-xl p-3">
                          <p className="text-sm font-semibold text-gray-800">
                            {log.old_status} →{" "}
                            <span className="text-red-600">
                              {log.new_status}
                            </span>
                          </p>
                          {log.note && (
                            <p className="text-gray-500 text-xs mt-1">
                              {log.note}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs whitespace-nowrap mt-2">
                          {new Date(log.changed_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right col — 1/3 */}
          <div className="space-y-4">
            {/* Hotline card */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-6 text-center shadow-lg">
              <p className="text-red-200 text-sm mb-1">Cần tư vấn ngay?</p>
              <a
                href="tel:0987654321"
                className="text-3xl font-black hover:underline block mb-2"
              >
                0987 654 321
              </a>
              <p className="text-red-200 text-xs">
                7:00 – 19:00 · Tất cả các ngày
              </p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a
                  href="tel:0987654321"
                  className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  <Phone size={14} /> Gọi
                </a>
                <a
                  href="https://zalo.me/0987654321"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  <MessageCircle size={14} /> Zalo
                </a>
              </div>
            </div>

            {/* Deposit CTA */}
            <Link
              to={`/deposit/${data.id}`}
              className="block bg-white rounded-2xl border-2 border-red-600 p-5 text-center hover:bg-red-50 transition-colors group"
            >
              <p className="font-black text-red-600 text-lg group-hover:gap-3 transition-all">
                Đặt cọc ngay
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Cọc 10 triệu · Hoàn 100% nếu hủy trong 24h
              </p>
            </Link>
            <AppointmentForm
              vehicleId={data.id}
              vehicleName={`${data.brand} ${data.model} ${data.year}`}
            />

            {/* Share/save */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">Cam kết</p>
              {[
                {
                  icon: <Shield size={14} className="text-green-600" />,
                  text: "Giao dịch minh bạch",
                },
                {
                  icon: <CheckCircle size={14} className="text-blue-600" />,
                  text: "Kiểm định 100+ hạng mục",
                },
                {
                  icon: <Car size={14} className="text-orange-500" />,
                  text: "Hỗ trợ lái thử",
                },
                {
                  icon: <Phone size={14} className="text-red-600" />,
                  text: "Hỗ trợ sang tên",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0"
                >
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Xe nổi bật ── */}
        {featuredCars.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-red-600 text-sm font-bold uppercase tracking-widest mb-1">
                  Gợi ý
                </p>
                <h2 className="text-2xl font-black text-gray-900">
                  Xe nổi bật khác
                </h2>
              </div>
              <Link
                to="/vehicles"
                className="hidden sm:flex items-center gap-2 text-red-600 font-semibold text-sm border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2 rounded-xl transition-all"
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredCars.map((car) => (
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}
