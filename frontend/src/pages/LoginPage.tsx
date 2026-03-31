// src/pages/LoginPage.tsx
// Tab đăng nhập / đăng ký — sau khi thành công redirect về trang cũ
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Car,
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
} from "lucide-react";
import { login, register, getProfile } from "../api/auth";
import { useAuthStore } from "../store/authStore";

type Tab = "login" | "register";

interface LoginForm {
  username: string;
  password: string;
}
interface RegForm {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}
interface LoginErrs {
  username?: string;
  password?: string;
}
interface RegErrs {
  first_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirm?: string;
}

function validateLogin(f: LoginForm): LoginErrs {
  const e: LoginErrs = {};
  if (!f.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
  if (!f.password) e.password = "Vui lòng nhập mật khẩu";
  else if (f.password.length < 6) e.password = "Mật khẩu ít nhất 6 ký tự";
  return e;
}

function validateReg(f: RegForm): RegErrs {
  const e: RegErrs = {};
  if (!f.first_name.trim()) e.first_name = "Vui lòng nhập họ tên";
  if (!f.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
  else if (f.username.length < 4) e.username = "Ít nhất 4 ký tự";
  else if (!/^[a-zA-Z0-9_]+$/.test(f.username))
    e.username = "Chỉ dùng chữ, số, gạch dưới";
  if (!f.email.trim()) e.email = "Vui lòng nhập email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = "Email không hợp lệ";
  if (f.phone && !/^(0|\+84)[0-9]{9}$/.test(f.phone))
    e.phone = "Số điện thoại không hợp lệ";
  if (!f.password) e.password = "Vui lòng nhập mật khẩu";
  else if (f.password.length < 8) e.password = "Ít nhất 8 ký tự";
  else if (!/(?=.*[A-Za-z])(?=.*[0-9])/.test(f.password))
    e.password = "Phải có chữ và số";
  if (!f.password_confirm) e.password_confirm = "Vui lòng xác nhận mật khẩu";
  else if (f.password !== f.password_confirm)
    e.password_confirm = "Mật khẩu không khớp";
  return e;
}

function ic(err: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
    err
      ? "border-red-400 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

interface FP {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ icon, label, required, error, children }: FP) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        <span className="text-gray-400">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function pwStrength(pw: string): {
  level: number;
  label: string;
  color: string;
} {
  if (!pw) return { level: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { level: 1, label: "Yếu", color: "bg-red-400" };
  if (s === 2) return { level: 2, label: "Trung bình", color: "bg-yellow-400" };
  if (s === 3) return { level: 3, label: "Mạnh", color: "bg-blue-500" };
  return { level: 4, label: "Rất mạnh", color: "bg-green-500" };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, setUser } = useAuthStore();
  const from = (location.state as any)?.from?.pathname ?? "/";

  const [tab, setTab] = useState<Tab>("login");
  const [regSuccess, setRegSuccess] = useState(false);

  const [lf, setLf] = useState<LoginForm>({ username: "", password: "" });
  const [le, setLe] = useState<LoginErrs>({});
  const [showLPw, setShowLPw] = useState(false);

  const [rf, setRf] = useState<RegForm>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
  });
  const [re, setRe] = useState<RegErrs>({});
  const [showRPw, setShowRPw] = useState(false);
  const [showRPw2, setShowRPw2] = useState(false);
  const [agree, setAgree] = useState(false);

  const loginMut = useMutation({
    mutationFn: () => login(lf.username.trim(), lf.password),
    onSuccess: async (d) => {
      setAuth(d.access, d.refresh);
      try {
        const p = await getProfile();
        setUser(p);
      } catch {}
      navigate(from, { replace: true });
      sessionStorage.removeItem("redirectAfterLogin");
    },
  });

  const regMut = useMutation({
    mutationFn: () =>
      register({
        first_name: rf.first_name.trim(),
        last_name: rf.last_name.trim(),
        username: rf.username.trim(),
        email: rf.email.trim(),
        phone: rf.phone.trim(),
        password: rf.password,
        password_confirm: rf.password_confirm,
      }),
    onSuccess: async (d) => {
      setAuth(d.access, d.refresh);
      try {
        const p = await getProfile();
        setUser(p);
      } catch {}
      setRegSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 1800);
    },
  });

  function handleLogin() {
    const errs = validateLogin(lf);
    if (Object.keys(errs).length) {
      setLe(errs);
      return;
    }
    loginMut.mutate();
  }

  function handleReg() {
    const errs = validateReg(rf);
    if (Object.keys(errs).length) {
      setRe(errs);
      return;
    }
    if (!agree) return;
    regMut.mutate();
  }

  const pws = pwStrength(rf.password);

  if (regSuccess)
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Đăng ký thành công!
          </h2>
          <p className="text-gray-500 text-sm">
            Chào mừng <strong>{rf.first_name}</strong>! Đang chuyển hướng...
          </p>
          <div className="mt-4 w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-red-600 text-white font-black text-xl px-4 py-2 rounded-lg">
              AUTO
            </div>
            <div className="text-left">
              <p className="text-white font-bold leading-tight">Leng Art</p>
              <p className="text-gray-500 text-xs">Xe đã qua sử dụng</p>
            </div>
          </Link>
          {from !== "/" && (
            <p className="text-xs text-blue-400 mt-3">
              Sau khi đăng nhập bạn sẽ quay lại trang trước.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-red-600" />

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  loginMut.reset();
                  regMut.reset();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                  tab === t
                    ? "text-red-600 border-b-2 border-red-600 bg-red-50/50"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "login" ? (
                  <>
                    <LogIn size={16} /> Đăng nhập
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Tạo tài khoản
                  </>
                )}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {tab === "login" && (
            <div className="p-8 space-y-5">
              {loginMut.isError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={16} className="shrink-0" /> Sai tên đăng
                  nhập hoặc mật khẩu.
                </div>
              )}
              <Field
                icon={<User size={15} />}
                label="Tên đăng nhập"
                required
                error={le.username}
              >
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={lf.username}
                  autoComplete="username"
                  onChange={(e) => {
                    setLf((p) => ({ ...p, username: e.target.value }));
                    if (le.username)
                      setLe((p) => ({ ...p, username: undefined }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className={ic(!!le.username)}
                />
              </Field>
              <Field
                icon={<Lock size={15} />}
                label="Mật khẩu"
                required
                error={le.password}
              >
                <div className="relative">
                  <input
                    type={showLPw ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={lf.password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setLf((p) => ({ ...p, password: e.target.value }));
                      if (le.password)
                        setLe((p) => ({ ...p, password: undefined }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={ic(!!le.password) + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showLPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <button
                onClick={handleLogin}
                disabled={loginMut.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loginMut.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={17} /> Đăng nhập
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <button
                  onClick={() => setTab("register")}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Tạo tài khoản ngay
                </button>
              </p>
            </div>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
              {regMut.isError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={16} className="shrink-0" /> Tên đăng nhập
                  hoặc email có thể đã tồn tại.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field
                  icon={<User size={15} />}
                  label="Họ"
                  required
                  error={re.first_name}
                >
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={rf.first_name}
                    onChange={(e) => {
                      setRf((p) => ({ ...p, first_name: e.target.value }));
                      if (re.first_name)
                        setRe((p) => ({ ...p, first_name: undefined }));
                    }}
                    className={ic(!!re.first_name)}
                  />
                </Field>
                <Field icon={<User size={15} />} label="Tên">
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={rf.last_name}
                    onChange={(e) =>
                      setRf((p) => ({ ...p, last_name: e.target.value }))
                    }
                    className={ic(false)}
                  />
                </Field>
              </div>

              <Field
                icon={<User size={15} />}
                label="Tên đăng nhập"
                required
                error={re.username}
              >
                <input
                  type="text"
                  placeholder="vd: nguyenvana123"
                  value={rf.username}
                  autoComplete="username"
                  onChange={(e) => {
                    setRf((p) => ({ ...p, username: e.target.value }));
                    if (re.username)
                      setRe((p) => ({ ...p, username: undefined }));
                  }}
                  className={ic(!!re.username)}
                />
              </Field>

              <Field
                icon={<Mail size={15} />}
                label="Email"
                required
                error={re.email}
              >
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={rf.email}
                  autoComplete="email"
                  onChange={(e) => {
                    setRf((p) => ({ ...p, email: e.target.value }));
                    if (re.email) setRe((p) => ({ ...p, email: undefined }));
                  }}
                  className={ic(!!re.email)}
                />
              </Field>

              <Field
                icon={<Phone size={15} />}
                label="Số điện thoại"
                error={re.phone}
              >
                <input
                  type="tel"
                  placeholder="0987 654 321"
                  value={rf.phone}
                  onChange={(e) => {
                    setRf((p) => ({ ...p, phone: e.target.value }));
                    if (re.phone) setRe((p) => ({ ...p, phone: undefined }));
                  }}
                  className={ic(!!re.phone)}
                />
              </Field>

              <Field
                icon={<Lock size={15} />}
                label="Mật khẩu"
                required
                error={re.password}
              >
                <div className="relative">
                  <input
                    type={showRPw ? "text" : "password"}
                    placeholder="Ít nhất 8 ký tự, có chữ và số"
                    value={rf.password}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setRf((p) => ({ ...p, password: e.target.value }));
                      if (re.password)
                        setRe((p) => ({ ...p, password: undefined }));
                    }}
                    className={ic(!!re.password) + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showRPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {rf.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= pws.level ? pws.color : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-medium ${pws.level <= 1 ? "text-red-500" : pws.level === 2 ? "text-yellow-500" : pws.level === 3 ? "text-blue-500" : "text-green-600"}`}
                    >
                      Độ mạnh: {pws.label}
                    </p>
                  </div>
                )}
              </Field>

              <Field
                icon={<Lock size={15} />}
                label="Xác nhận mật khẩu"
                required
                error={re.password_confirm}
              >
                <div className="relative">
                  <input
                    type={showRPw2 ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={rf.password_confirm}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setRf((p) => ({
                        ...p,
                        password_confirm: e.target.value,
                      }));
                      if (re.password_confirm)
                        setRe((p) => ({ ...p, password_confirm: undefined }));
                    }}
                    className={ic(!!re.password_confirm) + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRPw2((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showRPw2 ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {rf.password_confirm && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {rf.password === rf.password_confirm ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </Field>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 shrink-0"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Tôi đồng ý với{" "}
                  <a
                    href="#"
                    className="text-red-600 hover:underline font-medium"
                  >
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a
                    href="#"
                    className="text-red-600 hover:underline font-medium"
                  >
                    Chính sách bảo mật
                  </a>
                </span>
              </label>

              <button
                onClick={handleReg}
                disabled={regMut.isPending || !agree}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {regMut.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={17} /> Tạo tài khoản
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Đã có tài khoản?{" "}
                <button
                  onClick={() => setTab("login")}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <Car size={14} /> Về trang chủ (không cần đăng nhập)
          </Link>
        </p>
      </div>
    </div>
  );
}
