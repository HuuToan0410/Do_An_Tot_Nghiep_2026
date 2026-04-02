// src/pages/ProfilePage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  User,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  Shield,
  ChevronRight,
  Edit3,
  Save,
  AlertCircle,
  CheckCircle2,
  Car,
  Clock,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  KeyRound,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  CalendarCheck,
  CalendarX,
  UserCheck,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { getProfile, updateProfile, changePassword } from "../api/auth";
import type { UserProfile } from "../api/auth";
import { getDeposits } from "../api/deposits";
import { getAppointments } from "../api/appointments";
import { useAuthStore } from "../store/authStore";
import {
  APPOINTMENT_STATUS_CONFIG,
  formatScheduledAt,
} from "../api/appointments";

// ── Helpers ────────────────────────────────────────────────────

function formatVNPrice(val?: string | number | null): string {
  const num = Number(val ?? 0);
  if (!num) return "—";
  const ty = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Tr`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function inputClass(hasError?: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

// ── Deposit status config — rõ ràng hơn với icon và mô tả ──────

const DEPOSIT_STATUS: Record<
  string,
  {
    label: string;
    desc: string;
    style: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    desc: "Đang chờ nhân viên xác nhận",
    style: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-400",
    icon: <Clock size={11} />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    desc: "Nhân viên đã xác nhận đặt cọc",
    style: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
    icon: <CheckCircle2 size={11} />,
  },
  CANCELLED: {
    label: "Đã hủy",
    desc: "Đặt cọc đã bị hủy",
    style: "bg-gray-50 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
    icon: <XCircle size={11} />,
  },
  REFUNDED: {
    label: "Đã hoàn cọc",
    desc: "Tiền cọc đã được hoàn trả",
    style: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-400",
    icon: <RefreshCw size={11} />,
  },
  CONVERTED: {
    label: "Đã chuyển đơn",
    desc: "Đã chuyển thành đơn mua xe",
    style: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
    icon: <ArrowRightLeft size={11} />,
  },
};

// ── Appointment status config mở rộng ─────────────────────────

const APPT_STATUS_EXTRA: Record<
  string,
  { desc: string; icon: React.ReactNode }
> = {
  PENDING: {
    desc: "Đang chờ nhân viên xác nhận lịch hẹn",
    icon: <Clock size={11} />,
  },
  CONFIRMED: {
    desc: "Nhân viên đã xác nhận, đến đúng giờ nhé!",
    icon: <CalendarCheck size={11} />,
  },
  COMPLETED: { desc: "Đã xem xe thành công", icon: <UserCheck size={11} /> },
  CANCELLED: { desc: "Lịch hẹn đã bị hủy", icon: <CalendarX size={11} /> },
  NO_SHOW: {
    desc: "Bạn đã không đến đúng lịch hẹn",
    icon: <XCircle size={11} />,
  },
};

// ── Tab type ───────────────────────────────────────────────────

type Tab = "info" | "deposits" | "appointments" | "security";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "info", label: "Thông tin cá nhân", icon: <User size={16} /> },
  {
    id: "deposits",
    label: "Lịch sử đặt cọc",
    icon: <ClipboardList size={16} />,
  },
  {
    id: "appointments",
    label: "Lịch hẹn xem xe",
    icon: <Calendar size={16} />,
  },
  { id: "security", label: "Bảo mật", icon: <Lock size={16} /> },
];

// ── Edit Profile Form ──────────────────────────────────────────

function EditProfileForm({
  user,
  onDone,
}: {
  user: UserProfile;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone: user.phone ?? "",
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setUser(updated);
      onDone();
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Không thể cập nhật.");
    },
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Họ
          </label>
          <input
            value={form.first_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, first_name: e.target.value }))
            }
            className={inputClass()}
            placeholder="Nguyễn"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Tên
          </label>
          <input
            value={form.last_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, last_name: e.target.value }))
            }
            className={inputClass()}
            placeholder="Văn A"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Số điện thoại
        </label>
        <div className="relative">
          <Phone
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass() + " pl-8"}
            placeholder="0987 654 321"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {mut.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Lưu thay đổi
        </button>
        <button
          onClick={onDone}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

// ── Change Password Form ───────────────────────────────────────

function ChangePasswordForm() {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState({
    old_password: false,
    new_password: false,
    new_password_confirm: false,
  });

  const mut = useMutation({
    mutationFn: () => changePassword(form),
    onSuccess: () => {
      setSuccess(true);
      setForm({ old_password: "", new_password: "", new_password_confirm: "" });
    },
    onError: (e: unknown) => {
      const err = e as {
        response?: { data?: { detail?: string; old_password?: string[] } };
      };
      const data = err?.response?.data;
      if (data?.old_password) setErrors({ old_password: data.old_password[0] });
      else setErrors({ general: data?.detail ?? "Không thể đổi mật khẩu." });
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.old_password) e.old_password = "Nhập mật khẩu hiện tại";
    if (!form.new_password || form.new_password.length < 8)
      e.new_password = "Mật khẩu mới ít nhất 8 ký tự";
    if (form.new_password !== form.new_password_confirm)
      e.new_password_confirm = "Mật khẩu không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const FIELDS = [
    {
      key: "old_password",
      label: "Mật khẩu hiện tại",
      placeholder: "••••••••",
    },
    {
      key: "new_password",
      label: "Mật khẩu mới",
      placeholder: "Ít nhất 8 ký tự",
    },
    {
      key: "new_password_confirm",
      label: "Xác nhận mật khẩu mới",
      placeholder: "••••••••",
    },
  ] as const;

  return (
    <div className="space-y-4 max-w-md">
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm">
          <CheckCircle2 size={14} /> Đổi mật khẩu thành công!
        </div>
      )}
      {errors.general && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
          <AlertCircle size={14} /> {errors.general}
        </div>
      )}
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {field.label}
          </label>
          <div className="relative">
            <KeyRound
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type={show[field.key] ? "text" : "password"}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => {
                setForm((f) => ({ ...f, [field.key]: e.target.value }));
                if (errors[field.key])
                  setErrors((err) => ({ ...err, [field.key]: "" }));
                setSuccess(false);
              }}
              className={inputClass(!!errors[field.key]) + " pl-8 pr-10"}
            />
            <button
              type="button"
              onClick={() =>
                setShow((s) => ({ ...s, [field.key]: !s[field.key] }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {show[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors[field.key] && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> {errors[field.key]}
            </p>
          )}
        </div>
      ))}
      <button
        onClick={() => {
          if (validate()) mut.mutate();
        }}
        disabled={mut.isPending}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
      >
        {mut.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Lock size={14} />
        )}
        Đổi mật khẩu
      </button>
    </div>
  );
}

// ── Deposit Status Badge ───────────────────────────────────────

function DepositStatusBadge({ status }: { status: string }) {
  const cfg = DEPOSIT_STATUS[status] ?? {
    label: status,
    desc: "",
    style: "bg-gray-50 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Appointment Status Badge ───────────────────────────────────

function ApptStatusBadge({ status }: { status: string }) {
  const cfg =
    APPOINTMENT_STATUS_CONFIG[status as keyof typeof APPOINTMENT_STATUS_CONFIG];
  if (!cfg) return <span className="text-xs text-gray-400">{status}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);

  if (!token) {
    navigate("/login");
    return null;
  }

  const [profileQ, depositsQ, appointmentsQ] = useQueries({
    queries: [
      { queryKey: ["profile"], queryFn: getProfile, staleTime: 1000 * 60 * 5 },
      {
        queryKey: ["myDeposits"],
        queryFn: () => getDeposits(),
        staleTime: 1000 * 60,
        enabled: tab === "deposits",
      },
      {
        queryKey: ["myAppointments"],
        queryFn: () => getAppointments(),
        staleTime: 1000 * 60,
        enabled: tab === "appointments",
      },
    ],
  });

  const user = profileQ.data;
  const deposits = depositsQ.data ?? [];
  const appointments = appointmentsQ.data ?? [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function Skeleton({ className = "" }: { className?: string }) {
    return (
      <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-red-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-semibold">Tài khoản của tôi</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 text-center">
                {profileQ.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-red-600">
                          {(
                            user?.first_name?.[0] ??
                            user?.username?.[0] ??
                            "K"
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {user?.first_name
                        ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                        : user?.username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {user?.email}
                    </p>
                    <span
                      className={`inline-block mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        user?.role === "ADMIN"
                          ? "bg-red-100 text-red-700"
                          : user?.role === "PURCHASING"
                            ? "bg-orange-100 text-orange-700"
                            : user?.role === "INSPECTOR"
                              ? "bg-blue-100 text-blue-700"
                              : user?.role === "TECHNICIAN"
                                ? "bg-purple-100 text-purple-700"
                                : user?.role === "PRICING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : user?.role === "SALES"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user?.role_display ?? "Khách hàng"}
                    </span>
                  </>
                )}
              </div>

              <nav className="p-2 space-y-0.5">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setEditing(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      tab === t.id
                        ? "bg-red-600 text-white"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </nav>

              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3">
            {/* ── Thông tin cá nhân ── */}
            {tab === "info" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-red-500" />
                    <h2 className="font-bold text-gray-900">
                      Thông tin cá nhân
                    </h2>
                  </div>
                  {!editing && user && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit3 size={13} /> Chỉnh sửa
                    </button>
                  )}
                </div>
                {profileQ.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : editing && user ? (
                  <EditProfileForm
                    user={user}
                    onDone={() => setEditing(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    {[
                      {
                        icon: <User size={15} className="text-gray-400" />,
                        label: "Họ và tên",
                        value: user?.first_name
                          ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                          : "—",
                      },
                      {
                        icon: <Mail size={15} className="text-gray-400" />,
                        label: "Email",
                        value: user?.email ?? "—",
                      },
                      {
                        icon: <Phone size={15} className="text-gray-400" />,
                        label: "Số điện thoại",
                        value: user?.phone ?? "Chưa cập nhật",
                      },
                      {
                        icon: <Shield size={15} className="text-gray-400" />,
                        label: "Tên đăng nhập",
                        value: user?.username ?? "—",
                      },
                      {
                        icon: <Calendar size={15} className="text-gray-400" />,
                        label: "Ngày tham gia",
                        value: user?.created_at
                          ? formatDate(user.created_at)
                          : "—",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          {row.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-0.5">
                            {row.label}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {row.value}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                      {user?.is_verified ? (
                        <>
                          <CheckCircle2
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                          <p className="text-sm text-green-700 font-medium">
                            Tài khoản đã xác minh
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertCircle
                            size={16}
                            className="text-yellow-500 shrink-0"
                          />
                          <p className="text-sm text-yellow-700 font-medium">
                            Tài khoản chưa xác minh
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Lịch sử đặt cọc ── */}
            {tab === "deposits" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                  <ClipboardList size={16} className="text-red-500" />
                  <h2 className="font-bold text-gray-900">Lịch sử đặt cọc</h2>
                  {!depositsQ.isLoading && (
                    <span className="text-xs text-gray-400 ml-auto">
                      {deposits.length} đơn
                    </span>
                  )}
                </div>

                {/* Chú thích trạng thái */}
                {!depositsQ.isLoading && deposits.length > 0 && (
                  <div className="px-6 pt-3 pb-1">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
                      <AlertCircle
                        size={13}
                        className="text-blue-500 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-blue-700">
                        Đặt cọc sẽ được{" "}
                        <span className="font-semibold">
                          xác nhận bởi nhân viên
                        </span>{" "}
                        sau khi kiểm tra. Xe sẽ được giữ sau khi xác nhận.
                      </p>
                    </div>
                  </div>
                )}

                {depositsQ.isLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : deposits.length === 0 ? (
                  <div className="py-16 text-center">
                    <ClipboardList
                      size={36}
                      className="text-gray-200 mx-auto mb-3"
                    />
                    <p className="text-gray-500 text-sm font-medium">
                      Chưa có đặt cọc nào
                    </p>
                    <p className="text-gray-400 text-xs mt-1 mb-4">
                      Tìm xe ưng ý và đặt cọc ngay!
                    </p>
                    <Link
                      to="/vehicles"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      <Car size={14} /> Xem xe đang bán
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 mt-2">
                    {deposits.map((d) => {
                      const cfg = DEPOSIT_STATUS[d.status];
                      return (
                        <div
                          key={d.id}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Car
                                  size={13}
                                  className="text-gray-400 shrink-0"
                                />
                                <p className="text-sm font-bold text-gray-800 truncate">
                                  {d.vehicle_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {formatDate(d.created_at)}
                                </span>
                                <span className="font-semibold text-red-600">
                                  {formatVNPrice(d.amount)}
                                </span>
                              </div>
                              {/* Mô tả trạng thái */}
                              {cfg && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  {cfg.icon}
                                  {cfg.desc}
                                </p>
                              )}
                              {d.note && (
                                <p className="text-xs text-gray-400 mt-1 italic truncate">
                                  {d.note}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <DepositStatusBadge status={d.status} />
                              <Link
                                to={`/vehicles/${d.vehicle}`}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Eye size={11} /> Xem xe
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Lịch hẹn xem xe ── */}
            {tab === "appointments" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                  <Calendar size={16} className="text-red-500" />
                  <h2 className="font-bold text-gray-900">Lịch hẹn xem xe</h2>
                  {!appointmentsQ.isLoading && (
                    <span className="text-xs text-gray-400 ml-auto">
                      {appointments.length} lịch
                    </span>
                  )}
                </div>

                {/* Chú thích */}
                {!appointmentsQ.isLoading && appointments.length > 0 && (
                  <div className="px-6 pt-3 pb-1">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
                      <AlertCircle
                        size={13}
                        className="text-yellow-500 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-yellow-700">
                        Lịch hẹn sẽ được{" "}
                        <span className="font-semibold">
                          xác nhận bởi nhân viên
                        </span>
                        . Vui lòng đến đúng giờ sau khi được xác nhận.
                      </p>
                    </div>
                  </div>
                )}

                {appointmentsQ.isLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="py-16 text-center">
                    <Calendar
                      size={36}
                      className="text-gray-200 mx-auto mb-3"
                    />
                    <p className="text-gray-500 text-sm font-medium">
                      Chưa có lịch hẹn nào
                    </p>
                    <p className="text-gray-400 text-xs mt-1 mb-4">
                      Đặt lịch xem xe để được tư vấn trực tiếp
                    </p>
                    <Link
                      to="/vehicles"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      <Car size={14} /> Xem xe đang bán
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 mt-2">
                    {appointments
                      .sort(
                        (a, b) =>
                          new Date(b.scheduled_at).getTime() -
                          new Date(a.scheduled_at).getTime(),
                      )
                      .map((appt) => {
                        const isPast = new Date(appt.scheduled_at) < new Date();
                        const extra = APPT_STATUS_EXTRA[appt.status];
                        return (
                          <div
                            key={appt.id}
                            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${isPast ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Car
                                    size={13}
                                    className="text-gray-400 shrink-0"
                                  />
                                  <p className="text-sm font-bold text-gray-800 truncate">
                                    {appt.vehicle_name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                  <Clock size={11} className="shrink-0" />
                                  {formatScheduledAt(appt.scheduled_at)}
                                </div>
                                {/* Mô tả trạng thái */}
                                {extra && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    {extra.icon}
                                    {extra.desc}
                                  </p>
                                )}
                                {appt.note && (
                                  <p className="text-xs text-gray-400 mt-1 italic truncate">
                                    {appt.note}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <ApptStatusBadge status={appt.status} />
                                <Link
                                  to={`/vehicles/${appt.vehicle}`}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                  <Eye size={11} /> Xem xe
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ── Bảo mật ── */}
            {tab === "security" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Lock size={16} className="text-red-500" />
                  <h2 className="font-bold text-gray-900">Đổi mật khẩu</h2>
                </div>
                <ChangePasswordForm />
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    Thông tin bảo mật
                  </h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-500 shrink-0"
                      />{" "}
                      Mật khẩu được mã hóa an toàn
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-500 shrink-0"
                      />{" "}
                      Phiên đăng nhập bảo vệ bằng JWT
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-blue-500 shrink-0" /> Dữ
                      liệu cá nhân được bảo mật
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
