// src/pages/admin/AdminVehiclesPage.tsx
import { useState } from "react";
import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Plus, Eye, Pencil, CheckCircle, Search, X } from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import { getVehiclesAdmin, STATUSES, FUEL_TYPES } from "../../api/vehicles";
import type { VehicleFilters } from "../../api/vehicles";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 20;

export default function AdminVehiclesPage() {
  const location = useLocation();
  const justDeleted = (location.state as { deleted?: boolean } | null)?.deleted;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Reset về trang 1 khi filter thay đổi
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  function handleStatus(val: string) {
    setStatus(val);
    setPage(1);
  }

  const filters: VehicleFilters = {
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["adminVehicles", filters],
    queryFn: () => getVehiclesAdmin(filters),
    placeholderData: keepPreviousData,
  });

  function getFuelLabel(val?: string) {
    return FUEL_TYPES.find((f) => f.value === val)?.label ?? val ?? "—";
  }

  function getStatusStyle(val?: string) {
    const map: Record<string, string> = {
      PURCHASED: "bg-gray-100 text-gray-600",
      WAIT_INSPECTION: "bg-yellow-100 text-yellow-700",
      INSPECTING: "bg-orange-100 text-orange-700",
      INSPECTED: "bg-sky-100 text-sky-700",
      WAIT_REFURBISH: "bg-pink-100 text-pink-700",
      REFURBISHING: "bg-violet-100 text-violet-700",
      READY_FOR_SALE: "bg-blue-100 text-blue-700",
      LISTED: "bg-green-100 text-green-700",
      RESERVED: "bg-purple-100 text-purple-700",
      SOLD: "bg-red-100 text-red-700",
      WARRANTY: "bg-teal-100 text-teal-700",
    };
    return map[val ?? ""] ?? "bg-gray-100 text-gray-600";
  }

  return (
    <AdminLayout title="Quản lý xe" breadcrumb={[{ label: "Quản lý xe" }]}>
      {justDeleted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-5">
          <CheckCircle size={16} className="shrink-0" />
          Xe đã được xóa thành công.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Danh sách xe</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {data?.count ?? 0} xe trong hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm VIN, tên xe..."
                className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 w-44 transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <Link
              to="/admin/vehicles/new"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm xe
            </Link>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-14 bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        ) : data?.results?.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Chưa có xe nào phù hợp
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Xe</th>
                  <th className="px-5 py-3 text-left font-semibold">Năm</th>
                  <th className="px-5 py-3 text-left font-semibold">Số km</th>
                  <th className="px-5 py-3 text-left font-semibold">Giá bán</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Nhiên liệu
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.results?.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {v.thumbnail ? (
                          <img
                            src={v.thumbnail}
                            alt=""
                            className="w-12 h-9 object-cover rounded-lg shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-9 bg-gray-100 rounded-lg shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {v.brand} {v.model}
                            {v.variant ? ` ${v.variant}` : ""}
                          </p>
                          <p className="text-xs text-gray-400">#{v.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{v.year ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {v.mileage
                        ? `${Number(v.mileage).toLocaleString("vi-VN")} km`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-red-600">
                      {v.sale_price
                        ? `${Number(v.sale_price).toLocaleString("vi-VN")} đ`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {getFuelLabel(v.fuel_type)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(v.status)}`}
                      >
                        {STATUSES.find((s) => s.value === v.status)?.label ??
                          v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/vehicles/${v.id}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem trang xe"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/admin/vehicles/${v.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalCount={data?.count ?? 0}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
