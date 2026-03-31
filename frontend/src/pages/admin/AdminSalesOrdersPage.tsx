// src/pages/admin/AdminSalesOrdersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Search, Car, User, Phone, Eye, Plus,
  DollarSign, ShoppingBag, Receipt, X, Calendar,
  AlertCircle, CheckCircle, Loader2,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

function formatVND(val: number) {
  if (!val) return "—";
  const ty = Math.floor(val / 1_000_000_000);
  const tr = Math.floor((val % 1_000_000_000) / 1_000_000);
  if (ty > 0 && tr > 0) return `${ty} Tỷ ${tr} Tr`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${tr} Triệu`;
}

// ── Helper lấy message lỗi từ DRF response ──────────────────
function extractErrorMessage(e: any): string {
  const data = e?.response?.data;
  if (!data) return "Có lỗi xảy ra khi kết nối máy chủ.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.non_field_errors) {
    const v = data.non_field_errors;
    return Array.isArray(v) ? v[0] : String(v);
  }
  const entries = Object.entries(data);
  if (entries.length > 0) {
    const [field, msgs] = entries[0];
    const msg = Array.isArray(msgs) ? msgs[0] : msgs;
    return `${field}: ${String(msg)}`;
  }
  return "Có lỗi xảy ra.";
}

// ── Modal tạo đơn bán mới ───────────────────────────────────
interface CreateOrderForm {
  vehicle: string;
  customer_name: string;
  customer_phone: string;
  sale_price: string;
  contract_number: string;
  deposit: string;
  note: string;
}

function CreateOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateOrderForm>({
    vehicle: "",
    customer_name: "",
    customer_phone: "",
    sale_price: "",
    contract_number: "",
    deposit: "",
    note: "",
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      // SalesOrderSerializer: vehicle(int), customer_name, customer_phone,
      // deposit(int, optional), sale_price(decimal), contract_number, note
      // sold_by & sold_at được set bởi backend (perform_create)
      const payload: Record<string, any> = {
        vehicle:         Number(form.vehicle),
        customer_name:   form.customer_name.trim(),
        customer_phone:  form.customer_phone.trim(),
        sale_price:      Number(form.sale_price),
        contract_number: form.contract_number.trim(),
        note:            form.note.trim(),
      };
      if (form.deposit && form.deposit.trim() !== "") {
        payload.deposit = Number(form.deposit);
      }
      const res = await api.post("/sales-orders/", payload);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) => {
      setError(extractErrorMessage(e));
    },
  });

  function handleChange(
    k: keyof CreateOrderForm,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setError("");
  }

  const ic =
    "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-50";

  const canSubmit =
    !mut.isPending &&
    !!form.vehicle &&
    !!form.customer_name.trim() &&
    !!form.customer_phone.trim() &&
    !!form.sale_price &&
    !!form.contract_number.trim();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Tạo đơn bán hàng mới</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">ID Xe *</label>
              <input type="number" min="1" placeholder="ID xe (số nguyên)"
                value={form.vehicle} onChange={(e) => handleChange("vehicle", e)} className={ic} />
              <p className="text-xs text-gray-400 mt-1">Lấy từ trang Quản lý xe</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">ID Đặt cọc (nếu có)</label>
              <input type="number" min="1" placeholder="Để trống nếu không có"
                value={form.deposit} onChange={(e) => handleChange("deposit", e)} className={ic} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên khách hàng *</label>
            <input type="text" placeholder="Nguyễn Văn A"
              value={form.customer_name} onChange={(e) => handleChange("customer_name", e)} className={ic} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Số điện thoại *</label>
            <input type="tel" placeholder="0987654321"
              value={form.customer_phone} onChange={(e) => handleChange("customer_phone", e)} className={ic} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Giá bán (đ) *</label>
              <input type="number" min="0" placeholder="575000000"
                value={form.sale_price} onChange={(e) => handleChange("sale_price", e)} className={ic} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Số hợp đồng *</label>
              <input type="text" placeholder="HD2025-001"
                value={form.contract_number} onChange={(e) => handleChange("contract_number", e)} className={ic} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Ghi chú</label>
            <textarea rows={2} placeholder="Ghi chú giao dịch..."
              value={form.note} onChange={(e) => handleChange("note", e)}
              className={ic + " resize-none"} />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <strong>Lưu ý:</strong> Tạo đơn bán sẽ tự động chuyển trạng thái xe sang{" "}
            <strong>SOLD</strong>. Xe phải đang ở trạng thái RESERVED hoặc LISTED.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={() => mut.mutate()} disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
            {mut.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</>
              : <><CheckCircle size={14} /> Tạo đơn</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal xem chi tiết đơn bán ──────────────────────────────
function OrderDetailModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["salesOrder", orderId],
    queryFn: async () => {
      const res = await api.get(`/sales-orders/${orderId}/`);
      return res.data;
    },
    retry: 1,
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Chi tiết đơn bán #{orderId}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 size={24} className="animate-spin text-red-500" />
          </div>
        ) : isError || !order ? (
          <div className="p-6 text-center text-gray-400">
            <AlertCircle size={28} className="mx-auto mb-2 text-red-300" />
            Không tìm thấy đơn hàng
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["ID Đơn", `#${order.id}`],
                ["Số hợp đồng", order.contract_number || "—"],
                ["Ngày bán", order.sold_at ? new Date(order.sold_at).toLocaleDateString("vi-VN") : "—"],
                ["Tên khách hàng", order.customer_name || "—"],
                ["Số điện thoại", order.customer_phone || "—"],
                ["Xe giao dịch", order.vehicle_name || `Xe #${order.vehicle}`],
                ["Nhân viên bán", order.sold_by_name || "—"],
                ["ID Đặt cọc", order.deposit ? `#${order.deposit}` : "Không có"],
                ["Ghi chú", order.note || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-xs text-red-400 mb-1">Giá bán</p>
              <p className="text-2xl font-black text-red-600">
                {formatVND(Number(order.sale_price))}
              </p>
              <p className="text-xs text-red-300 mt-1">
                {Number(order.sale_price).toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminSalesOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["salesOrders", page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res = await api.get("/sales-orders/", { params });
      return res.data;
    },
  });

  const orders: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = data?.count ?? orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.sale_price || 0), 0);

  return (
    <AdminLayout title="Đơn bán hàng" breadcrumb={[{ label: "Bán hàng" }, { label: "Đơn bán hàng" }]}>
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["salesOrders"] })}
        />
      )}
      {detailId !== null && (
        <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng đơn", value: totalCount, icon: <ShoppingBag size={18} className="text-blue-600" />, bg: "bg-blue-50", color: "text-blue-700" },
          { label: "Doanh thu trang này", value: formatVND(totalRevenue), icon: <DollarSign size={18} className="text-green-600" />, bg: "bg-green-50", color: "text-green-700" },
          { label: "Số đơn trang này", value: orders.length, icon: <Receipt size={18} className="text-red-600" />, bg: "bg-red-50", color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-white/60 p-4 flex items-center gap-4`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Tất cả đơn bán hàng</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} hợp đồng</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
              className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Tìm khách, SĐT, tên xe..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400" />
            </form>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0">
              <Plus size={15} /> Tạo đơn
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : isError ? (
          <div className="py-16 flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-red-300 mb-3" />
            <p className="text-gray-500 font-medium">Không thể tải dữ liệu</p>
            <p className="text-gray-400 text-sm mt-1">Kiểm tra kết nối hoặc quyền truy cập</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Không có đơn bán hàng nào</p>
            <p className="text-gray-400 text-sm mt-1">Tạo đơn mới để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Hợp đồng</th>
                  <th className="px-5 py-3 text-left font-semibold">Khách hàng</th>
                  <th className="px-5 py-3 text-left font-semibold">Xe giao dịch</th>
                  <th className="px-5 py-3 text-left font-semibold">Nhân viên</th>
                  <th className="px-5 py-3 text-left font-semibold">Giá bán</th>
                  <th className="px-5 py-3 text-left font-semibold">Ngày bán</th>
                  <th className="px-5 py-3 text-center font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {order.contract_number || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User size={13} className="text-gray-400 shrink-0" />
                        {order.customer_name || "—"}
                      </p>
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {order.customer_phone}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <Car size={13} className="text-blue-400 shrink-0" />
                        {order.vehicle_name || `Xe #${order.vehicle}`}
                      </p>
                      {order.note && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{order.note}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{order.sold_by_name || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="font-black text-red-600">{formatVND(Number(order.sale_price))}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        {order.sold_at ? new Date(order.sold_at).toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => setDetailId(order.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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