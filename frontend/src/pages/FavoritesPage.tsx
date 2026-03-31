import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Eye, ArrowRight, Car } from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { getFavorites, toggleFavorite } from "../api/favorites";
import { useAuthStore } from "../store/authStore";

function formatVNPrice(price?: string | number | null): string {
  const num = Number(price ?? 0);
  if (!num) return "Liên hệ";
  const ty = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  LISTED: { label: "Đang bán", color: "text-green-600 bg-green-50" },
  RESERVED: { label: "Đã đặt cọc", color: "text-yellow-600 bg-yellow-50" },
  SOLD: { label: "Đã bán", color: "text-gray-500 bg-gray-100" },
};

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled: isLoggedIn,
  });

  const removeMutation = useMutation({
    mutationFn: (vehicleId: number) => toggleFavorite(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart size={36} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Đăng nhập để xem xe yêu thích
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Lưu những chiếc xe bạn quan tâm và xem lại bất cứ lúc nào.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Đăng nhập ngay <ArrowRight size={15} />
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
          <div className="flex items-center gap-3 mb-2">
            <Heart size={22} className="text-red-400" fill="currentColor" />
            <h1 className="text-2xl font-black">Xe Yêu Thích</h1>
          </div>
          <p className="text-white/50 text-sm">
            Xin chào,{" "}
            <span className="text-white font-semibold">
              {user?.first_name || user?.username}
            </span>{" "}
            · {favorites.length} xe đã lưu
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-72 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && favorites.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart size={36} className="text-red-200" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">
              Chưa có xe yêu thích nào
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Nhấn icon ♥ trên xe để lưu vào danh sách yêu thích.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <Car size={15} /> Xem xe đang bán
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favorites.map((fav) => {
              const statusCfg = STATUS_LABEL[fav.vehicle_status] ?? {
                label: fav.vehicle_status,
                color: "text-gray-500 bg-gray-100",
              };
              const isSold = fav.vehicle_status === "SOLD";

              return (
                <div
                  key={fav.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    isSold ? "opacity-70" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {fav.vehicle_thumbnail ? (
                      <img
                        src={fav.vehicle_thumbnail}
                        alt={fav.vehicle_name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={40} className="text-gray-200" />
                      </div>
                    )}

                    {/* Status badge */}
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removeMutation.mutate(fav.vehicle)}
                      disabled={removeMutation.isPending}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 p-1.5 rounded-full shadow transition-all"
                      title="Xóa khỏi yêu thích"
                    >
                      {removeMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-black text-gray-900 text-sm leading-tight mb-1 truncate">
                      {fav.vehicle_name}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-red-600 font-black text-base">
                        {formatVNPrice(fav.vehicle_price)}
                      </span>
                      {fav.vehicle_mileage != null && (
                        <span className="text-xs text-gray-400">
                          {fav.vehicle_mileage.toLocaleString("vi-VN")} km
                        </span>
                      )}
                    </div>

                    {/* Ngày lưu */}
                    <p className="text-xs text-gray-400 mb-3">
                      Đã lưu{" "}
                      {new Date(fav.created_at).toLocaleDateString("vi-VN")}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/vehicles/${fav.vehicle}`}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-600 text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        <Eye size={12} /> Xem xe
                      </Link>
                      {!isSold && (
                        <Link
                          to={`/deposit/${fav.vehicle}`}
                          className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                        >
                          Đặt cọc <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
