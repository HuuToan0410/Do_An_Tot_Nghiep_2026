// src/pages/admin/AdminDashboardPage.tsx
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Car,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Wrench,
  ShoppingCart,
  Users,
  BarChart3,
  ArrowUpRight,
  CircleDot,
  Clock,
  Award,
  ChevronDown,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getDashboardStats,
  getDashboardOverview,
  getRevenue,
  getRecentDeposits,
  getSalesCommissions,
  formatVNPrice,
  type RevenuePeriod,
  type CommissionPeriod,
} from "../../api/dashboard";

// ── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const DEPOSIT_STATUS_MAP: Record<string, { label: string; style: string }> = {
  PENDING: { label: "Chờ duyệt", style: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Đã xác nhận", style: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Đã hủy", style: "bg-gray-100 text-gray-500" },
  CONVERTED: { label: "Đã bán", style: "bg-green-100 text-green-700" },
  REFUNDED: { label: "Hoàn cọc", style: "bg-orange-100 text-orange-700" },
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
  );
}

// ── Revenue Chart với period selector ─────────────────────────

function RevenueChart({
  period,
  onPeriodChange,
}: {
  period: RevenuePeriod;
  onPeriodChange: (p: RevenuePeriod) => void;
}) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["revenue", period],
    queryFn: () => getRevenue(period),
    staleTime: 1000 * 60 * 2,
  });

  const maxVal = Math.max(...rows.map((r) => Number(r.total) || 0), 1);
  const display = rows.slice(-12);

  function getLabel(row: (typeof rows)[0]): string {
    if (period === "week" && row.week) return row.week.slice(5);
    if (period === "quarter" && row.quarter) return row.quarter;
    if (period === "month" && row.month) return row.month.slice(5);
    return "";
  }

  const totalRevenue = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalOrders = rows.reduce((s, r) => s + (r.count ?? 0), 0);

  // ✅ Đảm bảo luôn có đủ 12 cột (padding với bar rỗng)
  const COLS = 12;
  const padLeft = Math.floor((COLS - display.length) / 2);
  const padRight = COLS - display.length - padLeft;
  const padded = [
    ...Array(padLeft).fill(null),
    ...display,
    ...Array(padRight).fill(null),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Doanh thu</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatVNPrice(totalRevenue)} · {totalOrders} đơn
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["week", "month", "quarter"] as RevenuePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Quý"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      ) : display.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
          Chưa có dữ liệu doanh thu
        </div>
      ) : (
        <>
          <div className="relative h-36 mb-2">
            <div className="absolute inset-0 flex items-end gap-1">
              {padded.map((row, i) => {
                const isEmpty = row === null;
                const val = isEmpty ? 0 : Number(row.total) || 0;
                const pct = val / maxVal;
                const heightPx = isEmpty
                  ? 0
                  : Math.max(Math.round(pct * 136), 4);
                const isReal = !isEmpty && i === padded.length - 1;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end group relative h-full"
                  >
                    {!isEmpty && val > 0 && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatVNPrice(val)}
                        {row.count ? ` · ${row.count} xe` : ""}
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        isEmpty || val === 0
                          ? "bg-transparent"
                          : isReal
                            ? "bg-red-500"
                            : "bg-red-200 group-hover:bg-red-400"
                      }`}
                      style={{ height: `${heightPx}px` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Horizontal gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-gray-100 w-full" />
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1">
            {padded.map((row, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[9px] text-gray-400 truncate"
              >
                {row ? getLabel(row) : ""}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
// ── Commission Panel ───────────────────────────────────────────

function CommissionPanel() {
  const [period, setPeriod] = useState<CommissionPeriod>("month");
  const [rate, setRate] = useState(2); // 2%

  const { data, isLoading } = useQuery({
    queryKey: ["commissions", period, rate],
    queryFn: () => getSalesCommissions(period, rate),
    staleTime: 1000 * 60,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Award size={15} className="text-red-500" />
          <h3 className="font-bold text-gray-900 text-sm">
            Hoa hồng nhân viên
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Rate input */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
            <span className="text-xs text-gray-500">Tỷ lệ:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-10 text-xs font-bold text-red-600 bg-transparent outline-none text-center"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          {/* Period selector */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as CommissionPeriod)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-red-400 appearance-none pr-6"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="all">Tất cả</option>
            </select>
            <ChevronDown
              size={11}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data || data.staff.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <Award size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có dữ liệu hoa hồng</p>
          <p className="text-xs mt-1">Cần có đơn bán xe để tính hoa hồng</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-px bg-gray-100">
            {[
              {
                label: "Tổng doanh thu",
                value: formatVNPrice(data.total_revenue),
                color: "text-gray-900",
              },
              {
                label: `Hoa hồng (${data.commission_rate})`,
                value: formatVNPrice(data.total_commission),
                color: "text-green-600",
              },
              {
                label: "Đơn bán",
                value: `${data.total_orders} xe`,
                color: "text-blue-600",
              },
            ].map((s) => (
              <div key={s.label} className="bg-white px-3 py-3 text-center">
                <p className="text-[10px] text-gray-400">{s.label}</p>
                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Staff list */}
          <div className="divide-y divide-gray-50">
            {data.staff.map((staff, idx) => (
              <div
                key={staff.staff_id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    idx === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : idx === 1
                        ? "bg-gray-100 text-gray-600"
                        : idx === 2
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {staff.staff_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {staff.total_orders} xe ·{" "}
                    {formatVNPrice(staff.total_revenue)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-green-600">
                    {formatVNPrice(staff.commission_amount)}
                  </p>
                  <p className="text-[10px] text-gray-400">hoa hồng</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Brand bar ──────────────────────────────────────────────────

function BrandBar({
  brand,
  count,
  max,
  rank,
}: {
  brand: string;
  count: number;
  max: number;
  rank: number;
}) {
  const pct = Math.round((count / max) * 100);
  const colors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-blue-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-teal-400",
  ];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-4 text-right font-mono">
        {rank}
      </span>
      <span className="text-xs font-semibold text-gray-700 w-16 truncate">
        {brand}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${colors[rank - 1] ?? "bg-gray-400"} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-600 w-6 text-right">
        {count}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  accent,
  to,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "neutral";
  trendLabel?: string;
  accent: string;
  to?: string;
}) {
  const inner = (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow ${to ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
        >
          {icon}
        </div>
        {trend && trendLabel && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend === "up" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}
          >
            {trend === "up" && <ArrowUpRight size={11} />}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function PipelineRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <CircleDot size={13} className={color} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-800">{value} xe</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");

  const [statsQ, overviewQ, depositsQ] = useQueries({
    queries: [
      {
        queryKey: ["dashboardStats"],
        queryFn: getDashboardStats,
        staleTime: 1000 * 60,
      },
      {
        queryKey: ["dashboardOverview"],
        queryFn: getDashboardOverview,
        staleTime: 1000 * 60,
      },
      {
        queryKey: ["recentDeposits"],
        queryFn: getRecentDeposits,
        staleTime: 1000 * 30,
      },
    ],
  });

  const stats = statsQ.data;
  const overview = overviewQ.data;
  const deposits = depositsQ.data ?? [];
  const isLoading = statsQ.isLoading || overviewQ.isLoading;

  return (
    <AdminLayout title="Dashboard" breadcrumb={[{ label: "Dashboard" }]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Cập nhật lúc{" "}
            {new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live data
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Tổng doanh thu"
            value={formatVNPrice(overview?.total_revenue ?? 0)}
            icon={<DollarSign size={18} className="text-green-600" />}
            accent="bg-green-50"
            trend="up"
            trendLabel="Tích lũy"
          />
          <StatCard
            label="Xe đã bán"
            value={overview?.sold_vehicles ?? stats?.sold_cars ?? 0}
            icon={<ShoppingCart size={18} className="text-red-600" />}
            accent="bg-red-50"
            to="/admin/workflow"
          />
          <StatCard
            label="Đang niêm yết"
            value={overview?.listed_vehicles ?? 0}
            icon={<Car size={18} className="text-blue-600" />}
            accent="bg-blue-50"
            to="/admin/vehicles"
          />
          <StatCard
            label="Tổng kho xe"
            value={overview?.total_vehicles ?? stats?.total_vehicles ?? 0}
            icon={<BarChart3 size={18} className="text-purple-600" />}
            accent="bg-purple-50"
            to="/admin/vehicles"
          />
        </div>
      )}

      {/* Revenue chart + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <RevenueChart
            period={revenuePeriod}
            onPeriodChange={setRevenuePeriod}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-red-500" />
            <h3 className="font-bold text-gray-900 text-sm">Pipeline xe</h3>
          </div>
          {overviewQ.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <div>
              <PipelineRow
                label="Đang tân trang"
                value={overview?.refurbishing ?? 0}
                color="text-orange-400"
              />
              <PipelineRow
                label="Sẵn sàng bán"
                value={
                  (overview?.total_vehicles ?? 0) -
                  (overview?.listed_vehicles ?? 0) -
                  (overview?.sold_vehicles ?? 0) -
                  (overview?.reserved_vehicles ?? 0) -
                  (overview?.refurbishing ?? 0)
                }
                color="text-blue-400"
              />
              <PipelineRow
                label="Đang niêm yết"
                value={overview?.listed_vehicles ?? 0}
                color="text-green-500"
              />
              <PipelineRow
                label="Đã giữ chỗ"
                value={overview?.reserved_vehicles ?? 0}
                color="text-purple-400"
              />
              <PipelineRow
                label="Đã bán"
                value={overview?.sold_vehicles ?? 0}
                color="text-gray-400"
              />
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Đặt cọc chờ duyệt</span>
                  <span className="font-bold text-yellow-600">
                    {stats?.pending_deposits ?? 0} đơn
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tổng đặt cọc</span>
                  <span className="font-bold text-gray-700">
                    {stats?.total_deposits ?? 0} đơn
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent deposits + Brand chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-red-500" />
              <h3 className="font-bold text-gray-900 text-sm">
                Đặt cọc gần đây
              </h3>
            </div>
            <Link
              to="/admin/deposits"
              className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowUpRight size={12} />
            </Link>
          </div>
          {depositsQ.isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : deposits.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có đặt cọc nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {deposits.slice(0, 8).map((d) => {
                const statusCfg = DEPOSIT_STATUS_MAP[d.status] ?? {
                  label: d.status,
                  style: "bg-gray-100 text-gray-500",
                };
                return (
                  <div
                    key={d.id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {d.customer_name_display}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {d.vehicle_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-red-600">
                        {formatVNPrice(d.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <Clock size={10} className="text-gray-300" />
                        <span className="text-[10px] text-gray-400">
                          {formatDate(d.created_at)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${statusCfg.style}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Wrench size={15} className="text-red-500" />
            <h3 className="font-bold text-gray-900 text-sm">Top hãng xe</h3>
          </div>
          {statsQ.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
          ) : (stats?.brands ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Chưa có dữ liệu
            </p>
          ) : (
            <div className="space-y-3">
              {(stats?.brands ?? []).map((b, i) => (
                <BrandBar
                  key={b.brand}
                  brand={b.brand}
                  count={b.total}
                  max={stats!.brands[0].total}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            {[
              {
                to: "/admin/refurbishment",
                icon: <Wrench size={13} />,
                label: "Tân trang",
                val: `${overview?.refurbishing ?? 0} xe`,
              },
              {
                to: "/admin/inspections",
                icon: <ClipboardList size={13} />,
                label: "Kiểm định",
                val: `${stats?.total_inspections ?? 0} phiếu`,
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between text-xs text-gray-500 hover:text-red-600 transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  {item.icon} {item.label}
                </span>
                <span className="font-bold">{item.val}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Commission panel — full width */}
      <CommissionPanel />
    </AdminLayout>
  );
}
