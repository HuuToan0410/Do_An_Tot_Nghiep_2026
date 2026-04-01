// src/components/AppointmentForm.tsx
//
// Nhúng vào VehicleDetailPage:
//   import AppointmentForm from "../components/AppointmentForm";
//   <AppointmentForm vehicleId={data.id} vehicleName={`${data.brand} ${data.model}`} />

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Phone,
  User,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  createAppointment,
  type CreateAppointmentPayload,
} from "../api/appointments";
import { useAuthStore } from "../store/authStore";
// ── Anti-spam: sessionStorage ──────────────────────────────────
const MAX_SUBMIT = 1;

function getSpamCount(vehicleId: number): number {
  try {
    return Number(sessionStorage.getItem(`appt_spam_${vehicleId}`) ?? 0);
  } catch {
    return 0;
  }
}
function incrementSpam(vehicleId: number): number {
  try {
    const next = getSpamCount(vehicleId) + 1;
    sessionStorage.setItem(`appt_spam_${vehicleId}`, String(next));
    return next;
  } catch {
    return 1;
  }
}
// ── Helpers ────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

/** Lấy giá trị min cho datetime-local: ngày mai 08:00 */
function getMinDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

/** Lấy giá trị max: 30 ngày tới */
function getMaxDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(19, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

// ── Types ──────────────────────────────────────────────────────

interface FormState {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  scheduled_at: string;
  note: string;
}

interface FormErrors {
  customer_name?: string;
  customer_phone?: string;
  scheduled_at?: string;
}

// ── Component ──────────────────────────────────────────────────

interface Props {
  vehicleId: number;
  vehicleName: string;
}

export default function AppointmentForm({ vehicleId, vehicleName }: Props) {
  const user = useAuthStore((s) => s.user);
  //const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState<FormState>({
    customer_name: user
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : "",
    customer_phone: user?.phone ?? "",
    customer_email: user?.email ?? "",
    scheduled_at: "",
    note: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [submitCount, setSubmitCount] = useState(() => getSpamCount(vehicleId));
  // Autofill khi đã đăng nhập
  useEffect(() => {
    if (!user) return;
    setForm((p) => ({
      ...p,
      customer_name:
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        p.customer_name,
      customer_phone: user.phone || p.customer_phone,
      customer_email: user.email || p.customer_email,
    }));
  }, [user]);

  const mut = useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      createAppointment(payload),
    onSuccess: () => {
      setSubmitCount(incrementSpam(vehicleId));
      setSuccess(true);
    },
    onError: (e: any) => {
      const s = e?.response?.status;
      if (s === 429) setSubmitCount(incrementSpam(vehicleId));
    },
  });
  const isBlocked = submitCount >= MAX_SUBMIT;
  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.customer_name.trim()) e.customer_name = "Vui lòng nhập họ tên";
    if (!form.customer_phone.trim())
      e.customer_phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)[0-9]{9}$/.test(form.customer_phone.trim()))
      e.customer_phone = "Số điện thoại không hợp lệ";
    if (!form.scheduled_at) e.scheduled_at = "Vui lòng chọn thời gian hẹn";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (isBlocked || mut.isPending) return;

    if (!validate()) return;

    mut.mutate({
      vehicle: vehicleId,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim(),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      note: form.note.trim(),
    });
  }
  function setField<K extends keyof FormState>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    if (k in errors) setErrors((p) => ({ ...p, [k]: undefined }));
  }
  if (isBlocked && !success) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={26} className="text-orange-500" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">
          Bạn đã gửi quá {MAX_SUBMIT} lần
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Mỗi xe chỉ nhận tối đa {MAX_SUBMIT} yêu cầu đặt lịch trong một phiên
          truy cập để tránh trùng lặp. Nếu cần hỗ trợ ngay:
        </p>
        <a
          href="tel:0987654321"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
        >
          <Phone size={14} /> Gọi 0987 654 321
        </a>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────
  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-base mb-1">
          Đặt lịch thành công!
        </h3>
        <p className="text-gray-500 text-sm mb-1">
          Nhân viên sẽ liên hệ xác nhận lịch hẹn của bạn trong thời gian sớm
          nhất.
        </p>
        <p className="text-xs text-gray-400">
          Hotline hỗ trợ:{" "}
          <a
            href="tel:0987654321"
            className="text-red-600 font-semibold hover:underline"
          >
            0987 654 321
          </a>
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setForm((f) => ({ ...f, scheduled_at: "", note: "" }));
          }}
          className="mt-4 text-xs text-red-600 font-semibold hover:underline"
        >
          Đặt lịch khác →
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  const remaining = MAX_SUBMIT - submitCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
          <Calendar size={17} className="text-red-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Đặt lịch xem xe</p>
          <p className="text-xs text-gray-400 truncate">{vehicleName}</p>
        </div>
      </div>
      {remaining === 1 && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-xl text-xs mb-3">
          <ShieldAlert size={13} className="shrink-0 mt-0.5" />
          Lưu ý: bạn chỉ còn <strong className="mx-1">1 lần</strong> đặt lịch
          cho xe này.
        </div>
      )}
      {/* API error */}
      {mut.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs mb-4">
          <AlertCircle size={13} className="shrink-0" />
          {(mut.error as Error)?.message ??
            "Không thể đặt lịch. Vui lòng thử lại."}
        </div>
      )}

      <div className="space-y-3">
        {/* Họ tên */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.customer_name}
              onChange={(e) => {
                setForm((f) => ({ ...f, customer_name: e.target.value }));
                if (errors.customer_name)
                  setErrors((e) => ({ ...e, customer_name: undefined }));
              }}
              className={inputClass(!!errors.customer_name) + " pl-8"}
            />
          </div>
          {errors.customer_name && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
              <AlertCircle size={10} /> {errors.customer_name}
            </p>
          )}
        </div>

        {/* Số điện thoại + Email */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                placeholder="0987 654 321"
                value={form.customer_phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, customer_phone: e.target.value }));
                  if (errors.customer_phone)
                    setErrors((e) => ({ ...e, customer_phone: undefined }));
                }}
                className={inputClass(!!errors.customer_phone) + " pl-8"}
              />
            </div>
            {errors.customer_phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.customer_phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="email@example.com"
                value={form.customer_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_email: e.target.value }))
                }
                className={inputClass() + " pl-8"}
              />
            </div>
          </div>
        </div>

        {/* Thời gian hẹn */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Thời gian hẹn xem xe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="datetime-local"
              min={getMinDatetime()}
              max={getMaxDatetime()}
              value={form.scheduled_at}
              onChange={(e) => {
                setForm((f) => ({ ...f, scheduled_at: e.target.value }));
                if (errors.scheduled_at)
                  setErrors((e) => ({ ...e, scheduled_at: undefined }));
              }}
              className={inputClass(!!errors.scheduled_at) + " pl-8"}
            />
          </div>
          {errors.scheduled_at ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> {errors.scheduled_at}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Giờ làm việc: 8:00 – 19:00 · Tất cả các ngày trong tuần
            </p>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Ghi chú
          </label>
          <div className="relative">
            <MessageSquare
              size={13}
              className="absolute left-3 top-3 text-gray-400"
            />
            <textarea
              rows={2}
              placeholder="Câu hỏi hoặc yêu cầu thêm..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={inputClass() + " pl-8 resize-none"}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={mut.isPending}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {mut.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Đang đặt lịch...
            </>
          ) : (
            <>
              <Calendar size={15} /> Xác nhận đặt lịch
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Miễn phí · Không ràng buộc · Nhân viên xác nhận trong 30 phút
        </p>
      </div>
    </div>
  );
}
