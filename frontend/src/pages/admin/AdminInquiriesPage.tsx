
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Search,
  User,
  Gauge,
  DollarSign,
  RefreshCw,
  Eye,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";

// ── Types ──────────────────────────────────────────────────────

interface SellInquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  expected_price: string;
  note: string;
  is_contacted: boolean;
  created_at: string;
}

interface ContactInquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  is_contacted: boolean;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Skeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminInquiriesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"sell" | "contact">("sell");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  // ── Fetch sell requests ───────────────────────────────────
  const sellQ = useQuery<SellInquiry[]>({
    queryKey: ["admin-sell-requests"],
    queryFn: async () => {
      const res = await api.get("/admin/sell-requests/");
      return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
    enabled: tab === "sell",
  });

  // ── Fetch contact requests ────────────────────────────────
  const contactQ = useQuery<ContactInquiry[]>({
    queryKey: ["admin-contact-requests"],
    queryFn: async () => {
      const res = await api.get("/admin/contact-requests/");
      return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
    enabled: tab === "contact",
  });

  // ── Mark as contacted ─────────────────────────────────────
  const markSellMut = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/sell-requests/${id}/`, { is_contacted: true }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-sell-requests"] }),
  });

  const markContactMut = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/contact-requests/${id}/`, { is_contacted: true }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-contact-requests"] }),
  });

  // ── Filter + search ───────────────────────────────────────
  const sellItems = sellQ.data ?? [];
  const contactItems = contactQ.data ?? [];

  function applyFilter<
    T extends { is_contacted: boolean; name: string; phone: string },
  >(items: T[]): T[] {
    return items
      .filter((i) =>
        filter === "all"
          ? true
          : filter === "pending"
            ? !i.is_contacted
            : i.is_contacted,
      )
      .filter((i) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.phone.includes(q);
      });
  }

  const filteredSell = applyFilter(sellItems);
  const filteredContact = applyFilter(contactItems);

  const pendingSell = sellItems.filter((i) => !i.is_contacted).length;
  const pendingContact = contactItems.filter((i) => !i.is_contacted).length;

  return (
    <AdminLayout
      title="Yêu cầu từ khách hàng"
      breadcrumb={[{ label: "Yêu cầu khách hàng" }]}
    >
      {/* ── Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Đăng ký bán xe",
            value: sellItems.length,
            icon: <Car size={20} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Chờ liên hệ (bán)",
            value: pendingSell,
            icon: <Clock size={20} />,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Yêu cầu tìm xe",
            value: contactItems.length,
            icon: <MessageSquare size={20} />,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Chờ liên hệ (tìm)",
            value: pendingContact,
            icon: <Clock size={20} />,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{s.label}</p>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ── Tabs + toolbar ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab("sell")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "sell"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Car size={14} /> Đăng ký bán xe
              {pendingSell > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingSell}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("contact")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "contact"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare size={14} /> Tìm xe
              {pendingContact > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingContact}
                </span>
              )}
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm tên, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-400 shrink-0"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ liên hệ</option>
              <option value="done">Đã liên hệ</option>
            </select>
            <button
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["admin-sell-requests"] });
                qc.invalidateQueries({ queryKey: ["admin-contact-requests"] });
              }}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {tab === "sell" ? (
          sellQ.isLoading ? (
            <Skeleton />
          ) : filteredSell.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Car size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có yêu cầu bán xe nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-semibold">#</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Khách hàng
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Xe muốn bán
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Giá mong muốn
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Ngày gửi
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSell.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${!item.is_contacted ? "bg-orange-50/30" : ""}`}
                    >
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{item.id}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User size={13} className="text-gray-400 shrink-0" />
                          {item.name}
                        </p>
                        <a
                          href={`tel:${item.phone}`}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone size={11} /> {item.phone}
                        </a>
                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="text-xs text-gray-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Mail size={11} /> {item.email}
                          </a>
                        )}
                      </td>

                      {/* Thông tin xe */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">
                          {[item.brand, item.model, item.year]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </p>
                        {item.mileage && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Gauge size={11} /> {item.mileage}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-[160px]">
                            "{item.note}"
                          </p>
                        )}
                      </td>

                      {/* Giá mong muốn */}
                      <td className="px-5 py-4">
                        {item.expected_price ? (
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <DollarSign size={13} className="text-green-500" />
                            {item.expected_price}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Không có
                          </span>
                        )}
                      </td>

                      {/* Ngày gửi */}
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4">
                        {item.is_contacted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle size={11} /> Đã liên hệ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            <Clock size={11} /> Chờ liên hệ
                          </span>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 text-center">
                        {!item.is_contacted && (
                          <button
                            onClick={() => markSellMut.mutate(item.id)}
                            disabled={markSellMut.isPending}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors mx-auto disabled:opacity-60"
                          >
                            <CheckCircle size={12} /> Đánh dấu đã liên hệ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : // ── Contact tab ──
        contactQ.isLoading ? (
          <Skeleton />
        ) : filteredContact.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có yêu cầu tìm xe nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Yêu cầu xe tìm
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Ngày gửi
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContact.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${!item.is_contacted ? "bg-orange-50/30" : ""}`}
                  >
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                      #{item.id}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User size={13} className="text-gray-400 shrink-0" />
                        {item.name}
                      </p>
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone size={11} /> {item.phone}
                        </a>
                      )}
                      {item.email && (
                        <a
                          href={`mailto:${item.email}`}
                          className="text-xs text-gray-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail size={11} /> {item.email}
                        </a>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-gray-700 text-sm max-w-[240px]">
                        {item.message || (
                          <span className="text-gray-400 italic">
                            Không có mô tả
                          </span>
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      {item.is_contacted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle size={11} /> Đã liên hệ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          <Clock size={11} /> Chờ liên hệ
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {!item.is_contacted && (
                        <button
                          onClick={() => markContactMut.mutate(item.id)}
                          disabled={markContactMut.isPending}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors mx-auto disabled:opacity-60"
                        >
                          <CheckCircle size={12} /> Đã liên hệ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
