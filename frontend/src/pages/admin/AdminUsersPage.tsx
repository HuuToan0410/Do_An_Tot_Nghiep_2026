// src/pages/admin/AdminUsersPage.tsx
// Chỉ thêm pagination — giữ nguyên toàn bộ logic cũ
// Thêm: import Pagination, state page, pageSize, truyền page vào getUsers, gắn <Pagination /> cuối bảng

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  UserCircle,
  Shield,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserActive,
  ROLE_CONFIG,
  type UserProfile,
  type UserRole,
  type UserCreatePayload,
  type UserUpdatePayload,
} from "../../api/users";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 20;

const ALL_ROLES: UserRole[] = [
  "ADMIN",
  "PURCHASING",
  "INSPECTOR",
  "TECHNICIAN",
  "PRICING",
  "SALES",
  "CUSTOMER",
];

function inputClass(hasError?: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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

interface CreateFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  password: string;
  password_confirm: string;
}
interface CreateFormErrors {
  username?: string;
  email?: string;
  first_name?: string;
  role?: string;
  password?: string;
  password_confirm?: string;
}
const EMPTY_CREATE_FORM: CreateFormData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "CUSTOMER",
  password: "",
  password_confirm: "",
};
function validateCreateForm(form: CreateFormData): CreateFormErrors {
  const e: CreateFormErrors = {};
  if (!form.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
  if (!form.email.trim()) e.email = "Vui lòng nhập email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "Email không hợp lệ";
  if (!form.first_name.trim()) e.first_name = "Vui lòng nhập họ tên";
  if (!form.role) e.role = "Vui lòng chọn vai trò";
  if (!form.password) e.password = "Vui lòng nhập mật khẩu";
  else if (form.password.length < 8) e.password = "Mật khẩu ít nhất 8 ký tự";
  if (form.password !== form.password_confirm)
    e.password_confirm = "Mật khẩu không khớp";
  return e;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);
  const [resetPwUser, setResetPwUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [createForm, setCreateForm] =
    useState<CreateFormData>(EMPTY_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
  const [showCreatePw, setShowCreatePw] = useState(false);

  const [editRole, setEditRole] = useState<UserRole | "">("");
  const [editActive, setEditActive] = useState<boolean>(true);

  // Reset page khi filter thay đổi
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  function handleRole(val: string) {
    setRoleFilter(val as UserRole | "");
    setPage(1);
  }
  function handleActive(val: string) {
    setActiveFilter(val as "" | "true" | "false");
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["adminUsers", { search, roleFilter, activeFilter, page }],
    queryFn: () =>
      getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateErrors({});
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdatePayload }) =>
      updateUser(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setDetailUser(updated);
    },
  });
  const resetPwMutation = useMutation({
    mutationFn: ({ id, pw }: { id: number; pw: string }) =>
      resetUserPassword(id, pw),
    onSuccess: () => {
      setResetPwUser(null);
      setNewPassword("");
    },
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleUserActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      if (detailUser)
        setDetailUser({ ...detailUser, is_active: !detailUser.is_active });
    },
  });

  function handleCreateSubmit() {
    const errs = validateCreateForm(createForm);
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    createMutation.mutate({
      username: createForm.username.trim(),
      email: createForm.email.trim(),
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
      phone: createForm.phone.trim(),
      role: createForm.role,
      password: createForm.password,
      password_confirm: createForm.password_confirm,
    });
  }
  function openDetail(user: UserProfile) {
    setDetailUser(user);
    setEditRole(user.role);
    setEditActive(user.is_active);
  }
  function handleSaveDetail() {
    if (!detailUser) return;
    updateMutation.mutate({
      id: detailUser.id,
      data: { role: editRole as UserRole, is_active: editActive },
    });
  }

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const roleCounts = ALL_ROLES.reduce(
    (acc, r) => {
      acc[r] = users.filter((u) => u.role === r).length;
      return acc;
    },
    {} as Record<UserRole, number>,
  );

  return (
    <AdminLayout
      title="Quản lý người dùng"
      breadcrumb={[{ label: "Quản lý người dùng" }]}
    >
      {/* Role stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {ALL_ROLES.map((role) => {
          const cfg = ROLE_CONFIG[role];
          const active = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => handleRole(active ? "" : role)}
              className={`bg-white rounded-xl border p-3 text-left shadow-sm hover:shadow-md transition-all ${active ? "border-red-400 ring-1 ring-red-200" : "border-gray-100"}`}
            >
              <p className="text-xl font-black text-gray-900">
                {roleCounts[role]}
              </p>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Tìm theo tên, email, username..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRole(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white min-w-[160px]"
        >
          <option value="">Tất cả vai trò</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_CONFIG[r].label}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => handleActive(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white min-w-[140px]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
        <button
          onClick={() => {
            setCreateOpen(true);
            createMutation.reset();
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} /> Thêm người dùng
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users size={16} className="text-red-500" /> Danh sách người dùng
          </h2>
          <span className="text-sm text-gray-400">{totalCount} người dùng</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-14 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Không tìm thấy người dùng nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Người dùng
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">Liên hệ</th>
                  <th className="px-5 py-3 text-left font-semibold">Vai trò</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Ngày tạo
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const cfg = ROLE_CONFIG[user.role];
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{user.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserCircle size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                          <Mail size={11} className="text-gray-400" />{" "}
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Phone size={11} /> {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            <CheckCircle size={11} /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                            <X size={11} /> Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(user.date_joined).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(user)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <ChevronRight size={15} />
                          </button>
                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: user.id,
                                is_active: !user.is_active,
                              })
                            }
                            className={`p-1.5 rounded-lg transition-colors ${user.is_active ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                            title={
                              user.is_active ? "Khóa tài khoản" : "Mở khóa"
                            }
                          >
                            {user.is_active ? (
                              <X size={15} />
                            ) : (
                              <CheckCircle size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setResetPwUser(user);
                              setNewPassword("");
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <Lock size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {/* ── Create Modal (giữ nguyên từ document 20) ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-lg">
                  <Plus size={16} />
                </div>
                <h2 className="font-black text-gray-900">Thêm người dùng</h2>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {createMutation.isError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {(createMutation.error as Error)?.message ?? "Có lỗi xảy ra."}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Họ" required error={createErrors.first_name}>
                  <input
                    placeholder="Nguyễn"
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        first_name: e.target.value,
                      }))
                    }
                    className={inputClass(!!createErrors.first_name)}
                  />
                </Field>
                <Field label="Tên">
                  <input
                    placeholder="Văn A"
                    value={createForm.last_name}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        last_name: e.target.value,
                      }))
                    }
                    className={inputClass()}
                  />
                </Field>
              </div>
              <Field
                label="Tên đăng nhập"
                required
                error={createErrors.username}
              >
                <input
                  placeholder="vd: nguyenvana"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className={inputClass(!!createErrors.username)}
                />
              </Field>
              <Field label="Email" required error={createErrors.email}>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className={inputClass(!!createErrors.email)}
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  type="tel"
                  placeholder="0987 654 321"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={inputClass()}
                />
              </Field>
              <Field label="Vai trò" required error={createErrors.role}>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className={inputClass(!!createErrors.role)}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mật khẩu" required error={createErrors.password}>
                <div className="relative">
                  <input
                    type={showCreatePw ? "text" : "password"}
                    placeholder="Ít nhất 8 ký tự"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className={inputClass(!!createErrors.password) + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field
                label="Xác nhận mật khẩu"
                required
                error={createErrors.password_confirm}
              >
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={createForm.password_confirm}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      password_confirm: e.target.value,
                    }))
                  }
                  className={inputClass(!!createErrors.password_confirm)}
                />
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {createMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={15} /> Tạo tài khoản
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer (giữ nguyên) ── */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailUser(null)}
          />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="text-xs text-gray-400 font-mono">
                  #{detailUser.id}
                </p>
                <h3 className="font-black text-gray-900">
                  {detailUser.first_name} {detailUser.last_name}
                </h3>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {detailUser.avatar ? (
                    <img
                      src={detailUser.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle size={36} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {detailUser.first_name} {detailUser.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{detailUser.username}
                  </p>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${ROLE_CONFIG[detailUser.role].bg} ${ROLE_CONFIG[detailUser.role].color}`}
                  >
                    {ROLE_CONFIG[detailUser.role].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    icon: <Mail size={14} />,
                    label: "Email",
                    value: detailUser.email,
                  },
                  {
                    icon: <Phone size={14} />,
                    label: "Điện thoại",
                    value: detailUser.phone || "—",
                  },
                  {
                    icon: <Shield size={14} />,
                    label: "Ngày tạo",
                    value: new Date(detailUser.date_joined).toLocaleDateString(
                      "vi-VN",
                    ),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                  >
                    <div className="text-gray-400 shrink-0">{row.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Chỉnh sửa
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Vai trò
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className={inputClass()}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_CONFIG[r].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editActive ? "true" : "false"}
                    onChange={(e) => setEditActive(e.target.value === "true")}
                    className={inputClass()}
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Khóa tài khoản</option>
                  </select>
                </div>
                {updateMutation.isError && (
                  <p className="text-xs text-red-500">
                    {(updateMutation.error as Error)?.message ??
                      "Có lỗi xảy ra"}
                  </p>
                )}
                {updateMutation.isSuccess && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Đã cập nhật thành công
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 space-y-2">
              <button
                onClick={handleSaveDetail}
                disabled={updateMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
              <button
                onClick={() => setResetPwUser(detailUser)}
                className="w-full border border-orange-200 hover:bg-orange-50 text-orange-600 font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Lock size={14} /> Đặt lại mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPwUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setResetPwUser(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-black text-gray-900 mb-1">Đặt lại mật khẩu</h3>
            <p className="text-gray-500 text-sm mb-4">
              Đặt mật khẩu mới cho <strong>{resetPwUser.username}</strong>
            </p>
            <div className="relative mb-4">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass() + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {resetPwMutation.isSuccess && (
              <p className="text-xs text-green-600 flex items-center gap-1 mb-3">
                <CheckCircle size={12} /> Đặt lại thành công
              </p>
            )}
            {resetPwMutation.isError && (
              <p className="text-xs text-red-500 mb-3">
                Có lỗi xảy ra. Thử lại.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setResetPwUser(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (newPassword.length >= 8)
                    resetPwMutation.mutate({
                      id: resetPwUser.id,
                      pw: newPassword,
                    });
                }}
                disabled={newPassword.length < 8 || resetPwMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {resetPwMutation.isPending ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
