import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Shield } from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import InspectionReport from "../components/InspectionReport";
import { getVehiclePublicInspection } from "../api/inspection";
import { getVehicleDetail } from "../api/vehicleDetail";

export default function VehicleInspectionPage() {
  const { id } = useParams();

  const { data: vehicle } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleDetail(id!),
    enabled: !!id,
  });

  const {
    data: inspection,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vehicleInspection", id],
    queryFn: () => getVehiclePublicInspection(id!),
    enabled: !!id,
    retry: false,
  });

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-red-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={12} />
          <Link to="/vehicles" className="hover:text-red-600 transition-colors">
            Xe đang bán
          </Link>
          <ChevronRight size={12} />
          {vehicle && (
            <>
              <Link
                to={`/vehicles/${id}`}
                className="hover:text-red-600 transition-colors truncate max-w-[120px]"
              >
                {vehicle.brand} {vehicle.model}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-gray-700 font-semibold">Báo cáo kiểm định</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* No report */}
        {!isLoading && (isError || !inspection) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">
              Chưa có báo cáo kiểm định
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Xe này chưa có báo cáo kiểm định công khai hoặc đang trong quá
              trình kiểm định.
            </p>
            <Link
              to={`/vehicles/${id}`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Xem thông tin xe
            </Link>
          </div>
        )}

        {/* Full report */}
        {!isLoading && inspection && (
          <InspectionReport inspection={inspection} compact={false} />
        )}

        {/* CTA cuối trang */}
        {inspection && (
          <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">
                Bạn muốn đặt cọc xe này?
              </p>
              <p className="text-gray-500 text-sm mt-0.5">
                Giữ chỗ ngay với 10 triệu đồng, hoàn 100% nếu hủy trong 24 giờ.
              </p>
            </div>
            <Link
              to={`/deposit/${id}`}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Đặt cọc ngay
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
