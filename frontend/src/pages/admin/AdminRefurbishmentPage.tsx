import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Trash2,
  DollarSign,
  ClipboardList,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getRefurbishmentOrders,
  getRefurbishmentDetail,
  addRefurbishmentItem,
  updateRefurbishmentItem,
  deleteRefurbishmentItem,
  completeRefurbishmentOrder,
  cancelRefurbishmentOrder,
  REFURBISHMENT_STATUS_CONFIG,
  ITEM_TYPE_CONFIG,
  type RefurbishmentOrder,
  type RefurbishmentItem,
  type RefurbishmentItemPayload,
  type RefurbishmentItemType,
  startRefurbishmentOrder,
} from "../../api/refurbishment";

// ── Helpers ────────────────────────────────────────────────────

function formatVND(val?: string | number | null): string {
  const num = Number(val ?? 0);
  if (!num) return "0 đ";
  return num.toLocaleString("vi-VN") + " đ";
}

function inputClass(err?: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    err
      ? "border-red-400 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

// ── Empty form ──────────────────────────────────────────────────

const EMPTY_ITEM_FORM: RefurbishmentItemPayload = {
  name: "",
  item_type: "PARTS",
  quantity: 1,
  unit_cost: 0,
  description: "",
};

// ── Main Component ─────────────────────────────────────────────

export default function AdminRefurbishmentPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RefurbishmentOrder | null>(
    null,
  );
  const startMutation = useMutation({
    mutationFn: (id: number) => startRefurbishmentOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
    },
  });

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] =
    useState<RefurbishmentItemPayload>(EMPTY_ITEM_FORM);
  const [itemErrors, setItemErrors] = useState<
    Partial<Record<keyof RefurbishmentItemPayload, string>>
  >({});

  // Cancel modal
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // ── Queries ──────────────────────────────────────────────────

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["refurbishmentOrders", { search, statusFilter }],
    queryFn: () =>
      getRefurbishmentOrders({
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    refetchOnWindowFocus: true,
  });

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["refurbishmentDetail", selectedOrder?.id],
    queryFn: () => getRefurbishmentDetail(selectedOrder!.id),
    enabled: !!selectedOrder,
    refetchOnWindowFocus: true,
  });

  // ── Mutations ─────────────────────────────────────────────────

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeRefurbishmentOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      cancelRefurbishmentOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
      setShowCancel(false);
      setCancelReason("");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: RefurbishmentItemPayload;
    }) => addRefurbishmentItem(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
      queryClient.invalidateQueries({ queryKey: ["refurbishmentOrders"] });
      setShowItemForm(false);
      setItemForm(EMPTY_ITEM_FORM);
      setItemErrors({});
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({
      itemId,
      is_completed,
    }: {
      itemId: number;
      is_completed: boolean;
    }) => updateRefurbishmentItem(itemId, { is_completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteRefurbishmentItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refurbishmentDetail"] });
      queryClient.invalidateQueries({ queryKey: ["refurbishmentOrders"] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────

  function validateItem(): boolean {
    const errs: typeof itemErrors = {};
    if (!itemForm.name.trim()) errs.name = "Vui lòng nhập tên hạng mục";
    if (itemForm.quantity < 1) errs.quantity = "Số lượng phải ≥ 1";
    if (itemForm.unit_cost < 0) errs.unit_cost = "Đơn giá không hợp lệ";
    setItemErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAddItem() {
    if (!validateItem() || !orderDetail) return;
    addItemMutation.mutate({ orderId: orderDetail.id, data: itemForm });
  }

  function handleComplete() {
    if (!orderDetail) return;
    completeMutation.mutate(orderDetail.id);
  }

  function handleCancel() {
    if (!orderDetail) return;
    cancelMutation.mutate({ id: orderDetail.id, reason: cancelReason });
  }

  // ── Stats ─────────────────────────────────────────────────────

  const totalCost = orders.reduce((s, o) => s + Number(o.total_cost ?? 0), 0);
  const countByStatus = (st: string) =>
    orders.filter((o) => o.status === st).length;

  // ── Render ────────────────────────────────────────────────────

  return (
    <AdminLayout title="Tân trang xe" breadcrumb={[{ label: "Tân trang xe" }]}>
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Chờ tân trang",
            value: countByStatus("PENDING"),
            color: "text-yellow-600",
            bg: "bg-yellow-50 border-yellow-200",
          },
          {
            label: "Đang tân trang",
            value: countByStatus("IN_PROGRESS"),
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
          },
          {
            label: "Hoàn thành",
            value: countByStatus("COMPLETED"),
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Tổng chi phí",
            value: formatVND(totalCost),
            color: "text-red-600",
            bg: "bg-red-50 border-red-200",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Order list — 2/5 ── */}
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
                {Object.entries(REFURBISHMENT_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <Wrench size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    Không có phiếu tân trang nào
                  </p>
                </div>
              ) : (
                orders.map((order) => {
                  const cfg = REFURBISHMENT_STATUS_CONFIG[order.status];
                  const active = selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                        active ? "bg-red-50 border-l-4 border-red-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {order.vehicle_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            #{order.id} · {order.technician_name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-1 font-semibold">
                            {formatVND(order.total_cost)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Order detail — 3/5 ── */}
        <div className="lg:col-span-3">
          {!selectedOrder ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-64 flex items-center justify-center">
              <div className="text-center">
                <ClipboardList
                  size={40}
                  className="text-gray-200 mx-auto mb-3"
                />
                <p className="text-gray-400 text-sm">
                  Chọn một phiếu để xem chi tiết
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
          ) : orderDetail ? (
            <div className="space-y-4">
              {/* ── Header card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-0.5">
                      #{orderDetail.id}
                    </p>
                    <h2 className="text-lg font-black text-gray-900">
                      {orderDetail.vehicle_name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      KTV:{" "}
                      <span className="font-semibold text-gray-700">
                        {orderDetail.technician_name}
                      </span>
                    </p>
                    {orderDetail.note && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        "{orderDetail.note}"
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                      REFURBISHMENT_STATUS_CONFIG[orderDetail.status].bg
                    } ${REFURBISHMENT_STATUS_CONFIG[orderDetail.status].color}`}
                  >
                    {REFURBISHMENT_STATUS_CONFIG[orderDetail.status].label}
                  </span>
                </div>

                {/* Cost summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      label: "Ngày bắt đầu",
                      value: orderDetail.start_date ?? "—",
                      icon: <Wrench size={14} className="text-blue-500" />,
                    },
                    {
                      label: "Ngày hoàn thành",
                      value: orderDetail.completed_date ?? "—",
                      icon: (
                        <CheckCircle size={14} className="text-green-500" />
                      ),
                    },
                    {
                      label: "Tổng chi phí",
                      value: formatVND(orderDetail.total_cost),
                      icon: <DollarSign size={14} className="text-red-500" />,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gray-50 rounded-xl p-3 text-center"
                    >
                      <div className="flex justify-center mb-1">
                        {item.icon}
                      </div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-black text-gray-900 text-sm">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {orderDetail.status === "IN_PROGRESS" && (
                    <button
                      onClick={handleComplete}
                      disabled={completeMutation.isPending}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                    >
                      {completeMutation.isPending ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={13} />
                      )}
                      Nghiệm thu hoàn thành
                    </button>
                  )}
                  {orderDetail.status !== "CANCELLED" &&
                    orderDetail.status !== "COMPLETED" && (
                      <button
                        onClick={() => setShowCancel(true)}
                        className="flex items-center gap-1.5 border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-500 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                      >
                        <X size={13} /> Hủy phiếu
                      </button>
                    )}
                  {completeMutation.isError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {(completeMutation.error as Error)?.message ??
                        "Không thể nghiệm thu"}
                    </p>
                  )}
                  {orderDetail.status === "PENDING" && (
                    <button
                      onClick={() => startMutation.mutate(orderDetail.id)}
                      disabled={startMutation.isPending}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                    >
                      {startMutation.isPending ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wrench size={13} />
                      )}
                      Bắt đầu tân trang
                    </button>
                  )}
                </div>
              </div>

              {/* ── Items card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList size={16} className="text-red-500" />
                    Hạng mục tân trang
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {orderDetail.items.length}
                    </span>
                  </h3>
                  {orderDetail.status !== "COMPLETED" &&
                    orderDetail.status !== "CANCELLED" && (
                      <button
                        onClick={() => setShowItemForm((v) => !v)}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                      >
                        <Plus size={13} /> Thêm hạng mục
                      </button>
                    )}
                </div>

                {/* Add item form */}
                {showItemForm && (
                  <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Tên hạng mục <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="vd: Thay dầu máy, Sơn lại cửa..."
                        value={itemForm.name}
                        onChange={(e) =>
                          setItemForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className={inputClass(!!itemErrors.name)}
                      />
                      {itemErrors.name && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {itemErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Type + Quantity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Loại chi phí
                        </label>
                        <select
                          value={itemForm.item_type}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              item_type: e.target
                                .value as RefurbishmentItemType,
                            }))
                          }
                          className={inputClass()}
                        >
                          {Object.entries(ITEM_TYPE_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Số lượng <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={itemForm.quantity}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              quantity: Number(e.target.value),
                            }))
                          }
                          className={inputClass(!!itemErrors.quantity)}
                        />
                        {itemErrors.quantity && (
                          <p className="text-xs text-red-500 mt-1">
                            {itemErrors.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unit cost */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Đơn giá (đ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={itemForm.unit_cost || ""}
                        onChange={(e) =>
                          setItemForm((p) => ({
                            ...p,
                            unit_cost: Number(e.target.value),
                          }))
                        }
                        className={inputClass(!!itemErrors.unit_cost)}
                      />
                      {itemErrors.unit_cost && (
                        <p className="text-xs text-red-500 mt-1">
                          {itemErrors.unit_cost}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Mô tả
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Chi tiết công việc..."
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className={inputClass() + " resize-none"}
                      />
                    </div>

                    {/* Preview tổng */}
                    {itemForm.unit_cost > 0 && itemForm.quantity > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-gray-200 text-sm flex items-center justify-between">
                        <span className="text-gray-500">
                          Thành tiền hạng mục này:
                        </span>
                        <span className="font-black text-red-600">
                          {formatVND(itemForm.unit_cost * itemForm.quantity)}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddItem}
                        disabled={addItemMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        {addItemMutation.isPending ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={14} /> Thêm
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowItemForm(false);
                          setItemErrors({});
                          setItemForm(EMPTY_ITEM_FORM);
                        }}
                        className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:border-gray-300 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Item list */}
                {orderDetail.items.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400 text-sm">
                      Chưa có hạng mục nào
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {orderDetail.items.map((item: RefurbishmentItem) => {
                      const typeCfg = ITEM_TYPE_CONFIG[item.item_type];
                      return (
                        <div
                          key={item.id}
                          className="px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">
                                  {item.name}
                                </p>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}
                                >
                                  {typeCfg.label}
                                </span>
                                {item.is_completed ? (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    ✓ Xong
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    Chưa làm
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 mb-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  SL:{" "}
                                  <strong className="text-gray-700">
                                    {item.quantity}
                                  </strong>
                                </span>
                                <span>
                                  Đơn giá:{" "}
                                  <strong className="text-gray-700">
                                    {formatVND(item.unit_cost)}
                                  </strong>
                                </span>
                                <span className="text-red-600 font-black">
                                  = {formatVND(item.cost)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Toggle done */}
                              <button
                                onClick={() =>
                                  toggleItemMutation.mutate({
                                    itemId: item.id,
                                    is_completed: !item.is_completed,
                                  })
                                }
                                disabled={
                                  orderDetail.status === "COMPLETED" ||
                                  orderDetail.status === "CANCELLED"
                                }
                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                  item.is_completed
                                    ? "text-green-600 hover:bg-green-50"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                }`}
                                title={
                                  item.is_completed
                                    ? "Đánh dấu chưa làm"
                                    : "Đánh dấu xong"
                                }
                              >
                                <CheckCircle size={15} />
                              </button>

                              {/* Delete */}
                              {orderDetail.status !== "COMPLETED" &&
                                orderDetail.status !== "CANCELLED" && (
                                  <button
                                    onClick={() =>
                                      deleteItemMutation.mutate(item.id)
                                    }
                                    disabled={deleteItemMutation.isPending}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa hạng mục"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total footer */}
                {orderDetail.items.length > 0 && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {orderDetail.items.length} hạng mục
                      </span>
                      {" · "}
                      <span className="text-green-600">
                        {orderDetail.items.filter((i) => i.is_completed).length}{" "}
                        xong
                      </span>
                    </div>
                    <span className="text-lg font-black text-red-600">
                      {formatVND(orderDetail.total_cost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCancel(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-black text-gray-900 mb-2">
              Hủy phiếu tân trang?
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Thao tác này không thể hoàn tác. Nhập lý do hủy bên dưới.
            </p>
            <textarea
              rows={3}
              placeholder="Lý do hủy (không bắt buộc)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={inputClass() + " resize-none mb-4"}
            />
            {cancelMutation.isError && (
              <p className="text-xs text-red-500 mb-3">
                {(cancelMutation.error as Error)?.message ?? "Có lỗi xảy ra"}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:border-gray-300 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
