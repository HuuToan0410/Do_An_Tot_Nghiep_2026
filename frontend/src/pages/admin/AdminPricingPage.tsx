import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Plus,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getPricings,
  getPricingDetail,
  approvePricing,
  rejectPricing,
  PRICING_STATUS_CONFIG,
  formatVNPrice,
  //type VehiclePricing,
  type ApprovePricingPayload,
} from "../../api/pricing";

// ── Helpers ────────────────────────────────────────────────────

function inputClass(err?: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    err
      ? "border-red-400 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

function ProfitBadge({ margin }: { margin: number }) {
  const isGood = margin >= 15;
  const isOk = margin >= 8;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
        isGood
          ? "bg-green-100 text-green-700"
          : isOk
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
      }`}
    >
      {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {margin.toFixed(1)}%
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function AdminPricingPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Approve form
  const [approvePrice, setApprovePrice] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [approveError, setApproveError] = useState("");
  const [showApprove, setShowApprove] = useState(false);

  // Reject form
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ── Queries ──────────────────────────────────────────────────

  const { data: pricings = [], isLoading } = useQuery({
    queryKey: ["pricings", { search, statusFilter }],
    queryFn: () =>
      getPricings({
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    refetchOnWindowFocus: true,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["pricingDetail", selectedId],
    queryFn: () => getPricingDetail(selectedId!),
    enabled: !!selectedId,
    refetchOnWindowFocus: true,
  });

  // ── Mutations ─────────────────────────────────────────────────

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApprovePricingPayload }) =>
      approvePricing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricings"] });
      queryClient.invalidateQueries({ queryKey: ["pricingDetail"] });
      setShowApprove(false);
      setApprovePrice("");
      setApproveNote("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectPricing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricings"] });
      queryClient.invalidateQueries({ queryKey: ["pricingDetail"] });
      setShowReject(false);
      setRejectReason("");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────

  function handleApprove() {
    if (!detail) return;
    if (!approvePrice || Number(approvePrice) <= 0) {
      setApproveError("Vui lòng nhập giá phê duyệt hợp lệ");
      return;
    }
    setApproveError("");
    approveMutation.mutate({
      id: detail.id,
      data: {
        approved_price: Number(approvePrice),
        note: approveNote,
      },
    });
  }

  function handleReject() {
    if (!detail) return;
    rejectMutation.mutate({ id: detail.id, reason: rejectReason });
  }

  // ── Stats ─────────────────────────────────────────────────────

  const totalApproved = pricings.filter((p) => p.status === "APPROVED").length;
  const totalPending = pricings.filter((p) => p.status === "PENDING").length;
  const totalProfit = pricings
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + Number(p.profit ?? 0), 0);
  const avgMargin = pricings
    .filter((p) => p.status === "APPROVED" && p.profit_margin > 0)
    .reduce((s, p, _, arr) => s + p.profit_margin / arr.length, 0);

  // ── Render ────────────────────────────────────────────────────

  return (
    <AdminLayout title="Định giá xe" breadcrumb={[{ label: "Định giá xe" }]}>
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Chờ phê duyệt",
            value: totalPending,
            color: "text-yellow-600",
            bg: "bg-yellow-50 border-yellow-200",
          },
          {
            label: "Đã phê duyệt",
            value: totalApproved,
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Tổng lợi nhuận",
            value: formatVNPrice(totalProfit),
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
          },
          {
            label: "Biên LN trung bình",
            value: `${avgMargin.toFixed(1)}%`,
            color: avgMargin >= 15 ? "text-green-600" : "text-orange-600",
            bg: "bg-gray-50 border-gray-200",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── List — 2/5 ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Tìm xe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(PRICING_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : pricings.length === 0 ? (
                <div className="py-16 text-center">
                  <DollarSign
                    size={32}
                    className="text-gray-200 mx-auto mb-2"
                  />
                  <p className="text-gray-400 text-sm">
                    Không có phiếu định giá nào
                  </p>
                </div>
              ) : (
                pricings.map((p) => {
                  const cfg = PRICING_STATUS_CONFIG[p.status];
                  const active = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                        active ? "bg-red-50 border-l-4 border-red-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {p.vehicle_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            #{p.id} · {p.created_by_name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right space-y-1">
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                          <div>
                            <ProfitBadge margin={p.profit_margin} />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Detail — 3/5 ── */}
        <div className="lg:col-span-3">
          {!selectedId ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-64 flex items-center justify-center">
              <div className="text-center">
                <ClipboardList
                  size={40}
                  className="text-gray-200 mx-auto mb-3"
                />
                <p className="text-gray-400 text-sm">
                  Chọn phiếu định giá để xem chi tiết
                </p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* ── Header ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-0.5">
                      #{detail.id}
                    </p>
                    <h2 className="text-lg font-black text-gray-900">
                      {detail.vehicle_name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Tạo bởi:{" "}
                      <span className="font-semibold text-gray-700">
                        {detail.created_by_name}
                      </span>
                      {detail.approved_by_name !== "—" && (
                        <>
                          {" "}
                          · Duyệt:{" "}
                          <span className="font-semibold text-gray-700">
                            {detail.approved_by_name}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${
                        PRICING_STATUS_CONFIG[detail.status].bg
                      } ${PRICING_STATUS_CONFIG[detail.status].color}`}
                    >
                      {PRICING_STATUS_CONFIG[detail.status].label}
                    </span>
                    <Link
                      to={`/vehicles/${detail.vehicle}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Eye size={12} /> Xem xe
                    </Link>
                  </div>
                </div>

                {/* ── Cost breakdown ── */}
                <div className="space-y-2 mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Bảng tính chi phí & lợi nhuận
                  </p>

                  {[
                    {
                      label: "Giá thu mua",
                      value: detail.purchase_price,
                      color: "text-gray-800",
                    },
                    {
                      label: "Chi phí tân trang",
                      value: detail.refurbish_cost,
                      color: "text-gray-800",
                    },
                    {
                      label: "Chi phí khác",
                      value: detail.other_cost,
                      color: "text-gray-800",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>
                        {formatVNPrice(row.value)}
                      </span>
                    </div>
                  ))}

                  {/* Tổng vốn */}
                  <div className="flex items-center justify-between py-2.5 bg-gray-50 rounded-xl px-3">
                    <span className="text-sm font-bold text-gray-700">
                      Tổng vốn
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {formatVNPrice(detail.total_cost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100 mt-1">
                    <span className="text-sm text-gray-600">
                      Giá đề xuất bán
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatVNPrice(detail.target_price)}
                    </span>
                  </div>

                  {detail.approved_price && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Giá được duyệt
                      </span>
                      <span className="text-sm font-black text-green-600">
                        {formatVNPrice(detail.approved_price)}
                      </span>
                    </div>
                  )}

                  {/* Lợi nhuận */}
                  <div
                    className={`flex items-center justify-between py-3 rounded-xl px-3 ${
                      Number(detail.profit) >= 0 ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        Lợi nhuận dự kiến
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Dựa trên giá{" "}
                        {detail.approved_price ? "được duyệt" : "đề xuất"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-black ${
                          Number(detail.profit) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {Number(detail.profit) >= 0 ? "+" : ""}
                        {formatVNPrice(detail.profit)}
                      </p>
                      <ProfitBadge margin={detail.profit_margin} />
                    </div>
                  </div>
                </div>

                {/* Note */}
                {detail.note && (
                  <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic mb-4">
                    "{detail.note}"
                  </div>
                )}

                {/* Action buttons */}
                {detail.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setApprovePrice(detail.target_price);
                        setShowApprove(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <CheckCircle size={15} /> Phê duyệt giá
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <X size={15} /> Từ chối
                    </button>
                  </div>
                )}
              </div>

              {/* ── Timeline ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <ClipboardList size={15} className="text-red-500" />
                  Thông tin phê duyệt
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày tạo phiếu</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(detail.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {detail.approved_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngày phê duyệt</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(detail.approved_at).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Người phê duyệt</span>
                    <span className="font-semibold text-gray-800">
                      {detail.approved_by_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Approve Modal ── */}
      {showApprove && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowApprove(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="font-black text-gray-900 mb-1">Phê duyệt giá bán</h3>
            <p className="text-gray-500 text-sm mb-5">
              Xe:{" "}
              <strong className="text-gray-700">{detail.vehicle_name}</strong>
            </p>

            {/* Preview nhanh */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 mb-0.5">Tổng vốn</p>
                <p className="font-black text-gray-800">
                  {formatVNPrice(detail.total_cost)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 mb-0.5">Giá đề xuất</p>
                <p className="font-black text-blue-600">
                  {formatVNPrice(detail.target_price)}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Giá phê duyệt (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Nhập giá bán được duyệt..."
                  value={approvePrice}
                  onChange={(e) => {
                    setApprovePrice(e.target.value);
                    setApproveError("");
                  }}
                  className={inputClass(!!approveError)}
                />
                {approveError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {approveError}
                  </p>
                )}
                {/* Live profit preview */}
                {approvePrice && Number(approvePrice) > 0 && (
                  <div className="mt-2 p-2.5 bg-gray-50 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-gray-500">Lợi nhuận sau duyệt:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black ${
                          Number(approvePrice) - Number(detail.total_cost) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatVNPrice(
                          Number(approvePrice) - Number(detail.total_cost),
                        )}
                      </span>
                      <ProfitBadge
                        margin={
                          Number(approvePrice) > 0
                            ? Math.round(
                                ((Number(approvePrice) -
                                  Number(detail.total_cost)) /
                                  Number(approvePrice)) *
                                  100 *
                                  10,
                              ) / 10
                            : 0
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Ghi chú phê duyệt
                </label>
                <textarea
                  rows={2}
                  placeholder="Lý do điều chỉnh giá (nếu có)..."
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className={inputClass() + " resize-none"}
                />
              </div>
            </div>

            {approveMutation.isError && (
              <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                <AlertCircle size={11} />
                {(approveMutation.error as Error)?.message ?? "Có lỗi xảy ra"}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprove(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:border-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {approveMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={15} /> Xác nhận duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {showReject && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowReject(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-black text-gray-900 mb-1">
              Từ chối phiếu định giá
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Xe: <strong>{detail.vehicle_name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Lý do từ chối
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className={inputClass() + " resize-none"}
              />
            </div>

            {rejectMutation.isError && (
              <p className="text-xs text-red-500 mb-3">
                {(rejectMutation.error as Error)?.message ?? "Có lỗi xảy ra"}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReject(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {rejectMutation.isPending
                  ? "Đang xử lý..."
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
