
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  GitBranch,
  Car,
  Search,
  Eye,
  Pencil,
  ArrowRight,
  Info,
  X,
  Tag,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import WorkflowButton from "../../components/WorkflowButton";
import { getVehiclesAdmin } from "../../api/vehicles";
import {
  WORKFLOW_TRANSITIONS,
  STATUS_CONFIG,
  type VehicleWorkflowStatus,
} from "../../api/workflow";
import api from "../../api/client";

// ── Pipeline step indicator ────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "PURCHASED", label: "Mới nhập" },
  { key: "WAIT_INSPECTION", label: "Chờ KĐ" },
  { key: "INSPECTED", label: "Đã KĐ" },
  { key: "READY_FOR_SALE", label: "Sẵn sàng" },
  { key: "LISTED", label: "Đang bán" },
  { key: "SOLD", label: "Đã bán" },
];

function StatusPipeline({ current }: { current: VehicleWorkflowStatus }) {
  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-0.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                active
                  ? (STATUS_CONFIG[step.key as VehicleWorkflowStatus]?.style ??
                    "bg-gray-200 text-gray-600")
                  : done
                    ? "bg-gray-200 text-gray-500"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              {step.label}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <ArrowRight
                size={10}
                className={done || active ? "text-gray-400" : "text-gray-200"}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stats bar ──────────────────────────────────────────────────

function StatsBar({
  data,
  filter,
  onFilter,
}: {
  data: any[];
  filter: string;
  onFilter: (k: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {PIPELINE_STEPS.map((step) => {
        const count = data.filter((v) => v.status === step.key).length;
        const cfg = STATUS_CONFIG[step.key as VehicleWorkflowStatus];
        const active = filter === step.key;
        return (
          <button
            key={step.key}
            onClick={() => onFilter(active ? "" : step.key)}
            className={`bg-white rounded-xl border p-3.5 text-left shadow-sm hover:shadow-md transition-all ${
              active ? "border-red-400 ring-1 ring-red-200" : "border-gray-100"
            }`}
          >
            <p className="text-2xl font-black text-gray-900">{count}</p>
            <span
              className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.style ?? ""}`}
            >
              {cfg?.label ?? step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── CreateListingModal ─────────────────────────────────────────

interface ListingModalProps {
  vehicleId: number;
  vehicleName: string;
  salePrice: number;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateListingModal({
  vehicleId,
  vehicleName,
  salePrice,
  onClose,
  onSuccess,
}: ListingModalProps) {
  const [title, setTitle] = useState(`Bán xe ${vehicleName} chất lượng cao`);
  const [description, setDesc] = useState("");
  const [price, setPrice] = useState(salePrice || 0);
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      // Tạo slug từ title + vehicleId
      const slug =
        title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-") +
        "-" +
        vehicleId;

      // ListingSerializer: vehicle, title, slug, description, listed_price, is_active
      const res = await api.post("/listings/create/", {
        vehicle: vehicleId,
        title: title.trim(),
        slug,
        description: description.trim(),
        listed_price: price,
        is_active: true,
      });
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) => {
      const data = e?.response?.data;
      setError(
        data?.detail ??
          data?.vehicle?.[0] ??
          data?.slug?.[0] ??
          (typeof data === "object" ? Object.values(data).flat()[0] : null) ??
          "Có lỗi xảy ra.",
      );
    },
  });

  const ic =
    "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold text-lg">Tạo bài đăng niêm yết</h3>
            <p className="text-blue-100 text-xs mt-0.5">
              Đăng xe lên trang chủ cho khách hàng
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              {String(error)}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tiêu đề quảng cáo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              className={ic}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Giá niêm yết (đ) *
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(Number(e.target.value));
                setError("");
              }}
              className={ic}
            />
            {salePrice > 0 && (
              <p className="text-[10px] text-gray-400 mt-1">
                Giá đã phê duyệt: {salePrice.toLocaleString("vi-VN")} đ
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mô tả chi tiết *
            </label>
            <textarea
              rows={4}
              placeholder="Nhập nội dung quảng cáo, option nổi bật, tình trạng xe..."
              value={description}
              onChange={(e) => {
                setDesc(e.target.value);
                setError("");
              }}
              className={ic + " resize-none"}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 font-semibold text-gray-600 rounded-xl hover:bg-gray-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={
              !title.trim() ||
              !description.trim() ||
              price <= 0 ||
              mut.isPending
            }
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {mut.isPending ? "Đang xử lý..." : "Đăng lên website"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function VehicleWorkflowPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VehicleWorkflowStatus | "">(
    "",
  );
  const [listingModalVehicle, setListingModalVehicle] = useState<any | null>(
    null,
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehiclesWorkflow"],
    queryFn: () => getVehiclesAdmin({}),
    refetchOnWindowFocus: true,
  });
  const allVehicles = data?.results ?? [];

  const filtered = allVehicles.filter((v: any) => {
    const matchSearch =
      !search ||
      `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout title="Workflow xe" breadcrumb={[{ label: "Workflow xe" }]}>
      {/* Listing modal */}
      {listingModalVehicle && (
        <CreateListingModal
          vehicleId={listingModalVehicle.id}
          vehicleName={`${listingModalVehicle.brand} ${listingModalVehicle.model}`}
          salePrice={Number(listingModalVehicle.sale_price || 0)}
          onClose={() => setListingModalVehicle(null)}
          onSuccess={() => {
            setListingModalVehicle(null);
            refetch();
          }}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
            <GitBranch size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Workflow xe</h1>
            <p className="text-sm text-gray-500">
              Quản lý vòng đời từ nhập xe đến khi bán
            </p>
          </div>
        </div>
        <Link
          to="/admin/vehicles/new"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Car size={15} /> Thêm xe mới
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && (
        <StatsBar
          data={allVehicles}
          filter={filterStatus}
          onFilter={(k) => setFilterStatus(k as VehicleWorkflowStatus | "")}
        />
      )}

      {/* Workflow guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Quy trình:</strong> Nhập xe → Kiểm định → Tân trang → Định giá
          → Sẵn sàng bán →{" "}
          <span className="text-blue-600 font-semibold">
            Niêm yết (nút Đăng bán)
          </span>{" "}
          → Đặt cọc → Bán
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          placeholder="Tìm xe theo tên, hãng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Danh sách xe</h2>
          <span className="text-sm text-gray-400">{filtered.length} xe</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Car size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Không có xe nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Xe</th>
                  <th className="px-5 py-3 text-left font-semibold">Giá bán</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Tiến trình
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Hành động
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v: any) => {
                  const status = v.status as VehicleWorkflowStatus;
                  const cfg =
                    STATUS_CONFIG[status] ?? STATUS_CONFIG["PURCHASED"];
                  const transitions = WORKFLOW_TRANSITIONS[status] ?? [];
                  const isReadyForSale = status === "READY_FOR_SALE";

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Vehicle */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {v.thumbnail ? (
                            <img
                              src={v.thumbnail}
                              alt=""
                              className="w-12 h-9 object-cover rounded-lg shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <Car size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {v.brand} {v.model}
                            </p>
                            <p className="text-xs text-gray-400">
                              #{v.id} · {v.year}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-semibold text-red-600 whitespace-nowrap">
                        {v.sale_price ? (
                          Number(v.sale_price).toLocaleString("vi-VN") + " đ"
                        ) : (
                          <span className="text-gray-400 font-normal text-xs">
                            Chưa có giá
                          </span>
                        )}
                      </td>

                      {/* Pipeline */}
                      <td className="px-5 py-4">
                        <StatusPipeline current={status} />
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.style}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Workflow transitions */}
                          {transitions.length > 0 &&
                            transitions.map((t) => (
                              <WorkflowButton
                                key={t.new_status}
                                vehicleId={v.id}
                                action={t.new_status}
                                label={t.label}
                                color={t.color}
                              />
                            ))}

                          {/* Nút Đăng bán — chỉ hiện khi READY_FOR_SALE và có sale_price */}
                          {isReadyForSale && v.sale_price && (
                            <button
                              onClick={() => setListingModalVehicle(v)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <Tag size={12} /> Đăng bán
                            </button>
                          )}

                          {/* Thông báo nếu READY_FOR_SALE nhưng chưa có giá */}
                          {isReadyForSale && !v.sale_price && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                              Cần định giá trước
                            </span>
                          )}

                          {transitions.length === 0 && !isReadyForSale && (
                            <span className="text-xs text-gray-400 italic">
                              Hoàn tất
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Links */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
