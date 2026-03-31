

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car, User, Calendar, Search, Plus,
  X, MapPin, AlertCircle, Loader2, Eye,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

// ── Modal chi tiết biên bản ─────────────────────────────────
function HandoverDetailModal({ handover, onClose }: { handover: any; onClose: () => void }) {
  // Lấy thêm thông tin từ sales_order
  const { data: order } = useQuery({
    queryKey: ["salesOrder", handover.sales_order],
    queryFn: async () => {
      const res = await api.get(`/sales-orders/${handover.sales_order}/`);
      return res.data;
    },
    enabled: !!handover.sales_order,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Chi tiết biên bản bàn giao #{handover.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Thông tin từ đơn bán */}
          {order ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin giao dịch</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Xe</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <Car size={12} className="text-blue-400" />
                    {order.vehicle_name || `Xe #${order.vehicle}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Khách hàng</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <User size={12} className="text-gray-400" />
                    {order.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số hợp đồng</p>
                  <p className="font-mono text-xs text-gray-600">{order.contract_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">SĐT khách</p>
                  <p className="text-sm">{order.customer_phone || "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Đang tải thông tin đơn bán...
            </div>
          )}

          {/* Thông tin bàn giao */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Ngày bàn giao", handover.handover_date
                ? new Date(handover.handover_date).toLocaleString("vi-VN")
                : "—"],
              ["Số km lúc bàn giao", `${Number(handover.mileage_at_handover || 0).toLocaleString("vi-VN")} km`],
              ["Nhân viên giao", handover.staff_name || `NV #${handover.staff}` || "—"],
              ["Ngày tạo", handover.created_at
                ? new Date(handover.created_at).toLocaleDateString("vi-VN")
                : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {handover.note && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{handover.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal tạo biên bản bàn giao ─────────────────────────────
function CreateHandoverModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [salesOrderId, setSalesOrderId] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [mileage, setMileage] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      // HandoverSerializer fields: sales_order, handover_date, mileage_at_handover, note
      const res = await api.post("/handovers/", {
        sales_order:        Number(salesOrderId),
        handover_date:      handoverDate,
        mileage_at_handover: Number(mileage),
        note:               note.trim(),
      });
      return res.data;
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => {
      const data = e?.response?.data;
      setError(
        data?.detail
        ?? data?.sales_order?.[0]
        ?? data?.handover_date?.[0]
        ?? data?.mileage_at_handover?.[0]
        ?? (typeof data === "object" ? Object.values(data).flat()[0] : null)
        ?? "Có lỗi xảy ra."
      );
    },
  });

  const ic = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400";
  const canSubmit = !!salesOrderId && !!handoverDate && !!mileage && !mut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-900">Lập biên bản bàn giao</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              <AlertCircle size={14} className="shrink-0" /> {String(error)}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ID Đơn bán hàng *</label>
            <input type="number" min="1" value={salesOrderId}
              onChange={e => { setSalesOrderId(e.target.value); setError(""); }}
              placeholder="Nhập ID từ trang Đơn bán hàng"
              className={ic} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày giờ bàn giao *</label>
            <input type="datetime-local" value={handoverDate}
              onChange={e => { setHandoverDate(e.target.value); setError(""); }}
              className={ic} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Số km lúc bàn giao *</label>
            <input type="number" min="0" value={mileage}
              onChange={e => { setMileage(e.target.value); setError(""); }}
              placeholder="Ví dụ: 25000"
              className={ic} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
            <textarea rows={2} value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú bàn giao..."
              className={ic + " resize-none"} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={!canSubmit}
            className="flex-1 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2"
          >
            {mut.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
              : "Xác nhận bàn giao"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminHandoversPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["handovers", page, search],
    queryFn: async () => {
      const res = await api.get("/handovers/", {
        params: { page, page_size: PAGE_SIZE, ...(search ? { search } : {}) },
      });
      return res.data;
    },
  });

  const handovers: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = data?.count ?? handovers.length;

  return (
    <AdminLayout
      title="Biên bản bàn giao xe"
      breadcrumb={[{ label: "Bán hàng" }, { label: "Bàn giao xe" }]}
    >
      {showCreate && (
        <CreateHandoverModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["handovers"] })}
        />
      )}
      {selectedHandover && (
        <HandoverDetailModal handover={selectedHandover} onClose={() => setSelectedHandover(null)} />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-bold text-gray-900">Danh sách biên bản bàn giao</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} biên bản</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <form
              onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
              className="relative flex-1 sm:w-64"
            >
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo đơn hàng..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
            </form>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus size={15} /> Lập biên bản
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : handovers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MapPin size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có biên bản bàn giao nào</p>
            <p className="text-gray-400 text-sm mt-1">Bàn giao được tạo sau khi xe được bán</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700"
            >
              <Plus size={14} /> Lập biên bản đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Đơn bán</th>
                  <th className="px-5 py-3 text-left font-semibold">Ngày bàn giao</th>
                  <th className="px-5 py-3 text-left font-semibold">Số km</th>
                  <th className="px-5 py-3 text-left font-semibold">Ghi chú</th>
                  <th className="px-5 py-3 text-center font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {handovers.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">#{h.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        Đơn #{h.sales_order}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar size={13} className="text-blue-400 shrink-0" />
                        {h.handover_date
                          ? new Date(h.handover_date).toLocaleString("vi-VN", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {h.mileage_at_handover
                        ? `${Number(h.mileage_at_handover).toLocaleString("vi-VN")} km`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 max-w-[200px] truncate">
                      {h.note || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedHandover(h)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </AdminLayout>
  );
}