// src/pages/admin/AdminAppointmentsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Phone,
  User,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Search,
  X,
  CalendarCheck,
  UserX,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getAppointments,
  updateAppointment,
  APPOINTMENT_STATUS_CONFIG,
  formatScheduledAt,
  type Appointment,
  type AppointmentStatus,
} from "../../api/appointments";

// ── Status Badge ───────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = APPOINTMENT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Update Status Modal ────────────────────────────────────────

const STATUS_ACTIONS: {
  status: AppointmentStatus;
  label: string;
  icon: React.ReactNode;
  style: string;
}[] = [
  {
    status: "CONFIRMED",
    label: "Xác nhận lịch",
    icon: <CheckCircle2 size={14} />,
    style: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    status: "COMPLETED",
    label: "Đã xem xe xong",
    icon: <CalendarCheck size={14} />,
    style: "bg-green-600 hover:bg-green-700 text-white",
  },
  {
    status: "NO_SHOW",
    label: "Không đến",
    icon: <UserX size={14} />,
    style: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    status: "CANCELLED",
    label: "Hủy lịch",
    icon: <XCircle size={14} />,
    style: "border border-red-200 text-red-600 hover:bg-red-50",
  },
];

function DetailPanel({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState(appointment.note ?? "");

  const updateMut = useMutation({
    mutationFn: ({ status }: { status: AppointmentStatus }) =>
      updateAppointment(appointment.id, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
  });

  const isEditable =
    appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED";

  // Actions khả dụng theo trạng thái hiện tại
  const availableActions = STATUS_ACTIONS.filter((a) => {
    if (appointment.status === "PENDING")
      return ["CONFIRMED", "CANCELLED"].includes(a.status);
    if (appointment.status === "CONFIRMED")
      return ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status);
    return false;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">
              #{appointment.id}
            </span>
            <StatusBadge status={appointment.status} />
          </div>
          <h2 className="font-bold text-gray-900">
            {appointment.vehicle_name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Clock size={15} className="text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Thời gian hẹn</p>
            <p className="text-sm font-bold text-gray-800">
              {formatScheduledAt(appointment.scheduled_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <User size={15} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Khách hàng</p>
            <p className="text-sm font-bold text-gray-800">
              {appointment.customer_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Phone size={15} className="text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Số điện thoại</p>
            <a
              href={`tel:${appointment.customer_phone}`}
              className="text-sm font-bold text-red-600 hover:underline"
            >
              {appointment.customer_phone}
            </a>
          </div>
        </div>

        {appointment.customer_email && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <AlertCircle size={15} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-700">
                {appointment.customer_email}
              </p>
            </div>
          </div>
        )}

        {appointment.handled_by_name && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <CheckCircle2 size={15} className="text-purple-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Nhân viên xử lý</p>
              <p className="text-sm font-medium text-gray-700">
                {appointment.handled_by_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      {isEditable && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Ghi chú nội bộ
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm khi cập nhật trạng thái..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
        </div>
      )}

      {/* Actions */}
      {isEditable && availableActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Cập nhật trạng thái
          </p>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                key={action.status}
                onClick={() => updateMut.mutate({ status: action.status })}
                disabled={updateMut.isPending}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 ${action.style}`}
              >
                {updateMut.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </button>
            ))}
          </div>
          {updateMut.isError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} />
              {(updateMut.error as Error)?.message ?? "Không thể cập nhật."}
            </p>
          )}
        </div>
      )}

      {/* Original note */}
      {appointment.note && !isEditable && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-500 italic">
          "{appointment.note}"
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", statusFilter],
    queryFn: () =>
      getAppointments(statusFilter ? { status: statusFilter } : {}),
    refetchOnWindowFocus: true,
  });

  // Client-side search theo tên xe hoặc tên khách
  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.vehicle_name.toLowerCase().includes(q) ||
      a.customer_name.toLowerCase().includes(q) ||
      a.customer_phone.includes(q)
    );
  });

  const selected = filtered.find((a) => a.id === selectedId) ?? null;

  // Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "PENDING").length,
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  const statusOptions = [
    { value: "", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xác nhận" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "COMPLETED", label: "Đã xem xe" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "NO_SHOW", label: "Không đến" },
  ];

  return (
    <AdminLayout
      title="Lịch hẹn xem xe"
      breadcrumb={[{ label: "Lịch hẹn xem xe" }]}
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
        {/* Left — List */}
        <div
          className={`flex flex-col min-w-0 transition-all duration-300 ${
            selected ? "hidden w-full lg:w-[420px] shrink-0" : "flex-1"
          }`}
        >
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
            {[
              {
                label: "Tổng",
                value: stats.total,
                style: "bg-white border border-gray-100",
                text: "text-gray-800",
              },
              {
                label: "Chờ duyệt",
                value: stats.pending,
                style: "bg-yellow-50 border border-yellow-100",
                text: "text-yellow-700",
              },
              {
                label: "Đã xác nhận",
                value: stats.confirmed,
                style: "bg-blue-50 border border-blue-100",
                text: "text-blue-700",
              },
              {
                label: "Hoàn thành",
                value: stats.completed,
                style: "bg-green-50 border border-green-100",
                text: "text-green-700",
              },
              {
                label: "Đã hủy",
                value: stats.cancelled,
                style: "bg-gray-50 border border-gray-200",
                text: "text-gray-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl p-3 shadow-sm ${s.style}`}
              >
                <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Tìm xe, khách hàng, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
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
              className="w-full sm:w-auto border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-400 bg-white shrink-0"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Calendar size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Không có lịch hẹn nào</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[60vh] lg:max-h-full">
              {filtered.map((appt) => {
                const isSelected = selectedId === appt.id;
                return (
                  <div
                    key={appt.id}
                    onClick={() => setSelectedId(isSelected ? null : appt.id)}
                    className={`bg-white rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                      isSelected
                        ? "border-blue-400 ring-2 ring-blue-100"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-400">
                              #{appt.id}
                            </span>
                            <StatusBadge status={appt.status} />
                          </div>

                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Car size={12} className="text-gray-400 shrink-0" />
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {appt.vehicle_name}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User size={11} /> {appt.customer_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={11} /> {appt.customer_phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                            <Clock size={11} className="shrink-0" />
                            {formatScheduledAt(appt.scheduled_at)}
                          </div>
                        </div>

                        <ChevronRight
                          size={15}
                          className={`text-gray-300 shrink-0 mt-1 transition-transform ${
                            isSelected ? "rotate-90 text-blue-500" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Detail */}
        {selected && (
          <div className="w-full lg:flex-1 min-w-0">
            <DetailPanel
              appointment={selected}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
