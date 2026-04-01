// src/pages/DepositPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import {
  User,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Car,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { getVehicleDetail } from "../api/vehicleDetail";
import api from "../api/client";

// ── Types ──────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone: string;
  email: string;
  note: string;
}
interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}
interface DepositResponse {
  deposit_id: number;
  pay_url: string;
  qr_code_url: string;
  order_id: string;
  amount: number;
  message: string;
}

const DEPOSIT_AMOUNT = 10_000_000;

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function formatPrice(price?: string | number | null): string {
  const num = Number(price ?? 0);
  if (!num) return "Liên hệ";
  const ty = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${trieu} Triệu VNĐ`;
}

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = "Vui lòng nhập họ và tên";
  if (!f.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
  else if (!/^(0|\+84)[0-9]{9}$/.test(f.phone.trim()))
    e.phone = "Số điện thoại không hợp lệ";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = "Email không hợp lệ";
  return e;
}

function inputClass(hasError: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 focus:border-red-500 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ icon, label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        <span className="text-gray-400">{icon}</span>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

export default function DepositPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const authed = isAuthenticated();
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => getVehicleDetail(vehicleId!),
    enabled: !!vehicleId,
  });

  const thumbnail = vehicle?.media
    ?.filter((m) => m.media_type === "IMAGE")
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0]?.file;

  // Autofill khi đã đăng nhập
  useEffect(() => {
    if (!authed || !user) return;
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    setForm((p) => ({
      ...p,
      name: fullName || p.name,
      phone: user.phone || p.phone,
      email: user.email || p.email,
    }));
  }, [authed, user]);
  // ── Mutation: tạo deposit → nhận pay_url → redirect MoMo ──
  const mutation = useMutation({
    mutationFn: async (f: FormState): Promise<DepositResponse> => {
      const res = await api.post("/deposits/", {
        vehicle: Number(vehicleId),
        amount: DEPOSIT_AMOUNT,
        customer_name: f.name.trim(),
        customer_phone: f.phone.trim(),
        customer_email: f.email.trim(),
        note: f.note.trim(),
      });
      return res.data;
    },
    onSuccess: (data) => {
      sessionStorage.setItem("pendingDepositId", String(data.deposit_id));
      window.location.href = data.pay_url;
    },
  });

  useEffect(() => {
    if (!authed || !user) return;

    const updates: Partial<FormState> = {};
    const filled = new Set<string>();

    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    if (fullName) {
      updates.name = fullName;
      filled.add("name");
    }
    if (user.phone) {
      updates.phone = user.phone;
      filled.add("phone");
    }
    if (user.email) {
      updates.email = user.email;
      filled.add("email");
    }

    setForm((p) => ({ ...p, ...updates }));
  }, [authed, user]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as keyof FormErrors])
      setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    mutation.mutate(form);
  }

  // ── Loading / not found ────────────────────────────────────
  if (vehicleLoading)
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-red-500" />
        </div>
      </MainLayout>
    );

  if (!vehicle)
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy xe.</p>
            <Link
              to="/vehicles"
              className="text-red-600 text-sm mt-2 inline-block hover:underline"
            >
              Quay lại danh sách xe
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  const vStatus = vehicle.status ?? "";
  const isReserved = vStatus === "RESERVED";
  const isSold = ["SOLD", "WARRANTY"].includes(vStatus);
  const canDeposit = vStatus === "LISTED";

  // ── Xe không thể đặt cọc ──
  if (isReserved || isSold) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              isSold ? "bg-gray-100" : "bg-amber-100"
            }`}
          >
            {isSold ? (
              <Ban size={36} className="text-gray-400" />
            ) : (
              <Lock size={36} className="text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isSold ? "Xe đã được bán" : "Xe đang được giữ chỗ"}
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            {isSold
              ? "Xe này đã có chủ mới và không còn khả dụng để đặt cọc."
              : "Đã có khách đặt cọc xe này. Bạn không thể đặt cọc thêm lúc này."}
          </p>
          {isReserved && (
            <p className="text-amber-600 text-sm mb-6">
              Gọi{" "}
              <a href="tel:0987654321" className="font-bold hover:underline">
                0987 654 321
              </a>{" "}
              để được thông báo nếu cọc bị hủy.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/vehicles/${vehicleId}`}
              className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm"
            >
              ← Quay lại xe
            </Link>
            <Link
              to="/vehicles"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              Xem xe khác <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-red-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={13} />
          <Link to="/vehicles" className="hover:text-red-600 transition-colors">
            Xe đang bán
          </Link>
          <ChevronRight size={13} />
          <Link
            to={`/vehicles/${vehicleId}`}
            className="hover:text-red-600 transition-colors truncate max-w-[140px]"
          >
            {vehicle.brand} {vehicle.model}
          </Link>
          <ChevronRight size={13} />
          <span className="text-gray-700 font-semibold">Đặt cọc</span>
        </div>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-black text-gray-900">Đặt Cọc Xe</h1>
          <p className="text-gray-500 text-sm mt-1">
            Điền thông tin bên dưới — hệ thống sẽ chuyển bạn sang cổng thanh
            toán MoMo.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Form — 3/5 ── */}
          <div className="lg:col-span-3 space-y-5">
            {mutation.isError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {(mutation.error as any)?.response?.data?.detail ??
                  (mutation.error as Error)?.message ??
                  "Có lỗi xảy ra. Vui lòng thử lại hoặc gọi 0987 654 321."}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Step 1 */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <p className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Thông tin của bạn
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  icon={<User size={14} />}
                  label="Họ và tên"
                  required
                  error={errors.name}
                >
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={inputClass(!!errors.name)}
                  />
                </Field>
                <Field
                  icon={<Phone size={14} />}
                  label="Số điện thoại"
                  required
                  error={errors.phone}
                >
                  <input
                    type="tel"
                    placeholder="0987 654 321"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={inputClass(!!errors.phone)}
                  />
                </Field>
              </div>

              <Field
                icon={<Mail size={14} />}
                label="Email"
                error={errors.email}
              >
                <input
                  type="email"
                  placeholder="email@example.com (không bắt buộc)"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass(!!errors.email)}
                />
              </Field>

              {/* Step 2 */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 pt-2">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <p className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Ghi chú thêm
                </p>
              </div>

              <Field icon={<FileText size={14} />} label="Ghi chú">
                <textarea
                  rows={3}
                  placeholder="Thời gian bạn có thể đến xem xe, yêu cầu đặc biệt..."
                  value={form.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  className={inputClass(false) + " resize-none"}
                />
              </Field>
            </div>

            {/* ── Nút MoMo ── */}
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="w-full bg-[#ae2070] hover:bg-[#961b60] disabled:bg-pink-300
                disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl
                transition-colors flex items-center justify-center gap-3 text-base"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang kết nối
                  MoMo...
                </>
              ) : (
                <>
                  <span className="bg-white text-[#ae2070] text-xs font-black px-2 py-0.5 rounded-md leading-5">
                    MoMo
                  </span>
                  Thanh toán {formatVND(DEPOSIT_AMOUNT)} qua MoMo
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              Bạn sẽ được chuyển đến cổng thanh toán MoMo an toàn. Đặt cọc được
              giữ tối đa 7 ngày.
            </p>
          </div>

          {/* ── Sidebar — 2/5 ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vehicle card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-48">
                <img
                  src={thumbnail ?? "/placeholder-car.jpg"}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 left-3 bg-[#ae2070] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Đang đặt cọc
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-black text-lg leading-tight drop-shadow">
                    {formatPrice(vehicle.sale_price)}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Car size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">
                    {vehicle.brand} {vehicle.model}
                    {vehicle.variant ? ` ${vehicle.variant}` : ""}{" "}
                    {vehicle.year}
                  </h3>
                </div>
                <Link
                  to={`/vehicles/${vehicleId}`}
                  className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold hover:underline"
                >
                  Xem chi tiết xe <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Deposit info */}
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-pink-800 text-sm">
                  Số tiền đặt cọc
                </p>
                <p className="text-xl font-black text-[#ae2070]">
                  {formatVND(DEPOSIT_AMOUNT)}
                </p>
              </div>
              <p className="text-pink-700 text-xs leading-relaxed">
                Được trừ vào giá xe khi giao dịch hoàn tất. Hoàn lại{" "}
                <strong>100%</strong> nếu hủy trong vòng 24 giờ.
              </p>
            </div>

            {/* Commitments */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={15} className="text-green-600" /> Cam kết của
                chúng tôi
              </h4>
              <div className="space-y-3">
                {[
                  {
                    icon: <Shield size={14} className="text-green-600" />,
                    text: "Giao dịch minh bạch, an toàn 100%",
                  },
                  {
                    icon: <Clock size={14} className="text-blue-500" />,
                    text: "Phản hồi trong vòng 30 phút",
                  },
                  {
                    icon: <CheckCircle size={14} className="text-red-500" />,
                    text: "Xe kiểm định kỹ trước khi bán",
                  },
                  {
                    icon: <Car size={14} className="text-orange-500" />,
                    text: "Hỗ trợ lái thử trước khi chốt",
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 text-sm text-gray-600"
                  >
                    {item.icon} {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hotline */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-5 text-center">
              <p className="text-red-200 text-xs mb-1">Cần hỗ trợ ngay?</p>
              <a
                href="tel:0987654321"
                className="text-2xl font-black hover:underline block mb-1"
              >
                0987 654 321
              </a>
              <p className="text-red-200 text-xs">
                7:00 – 19:00 · Tất cả các ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
