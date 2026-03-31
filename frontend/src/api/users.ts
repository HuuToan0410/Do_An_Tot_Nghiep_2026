import api from "./client";

// Import từ auth.ts — single source of truth
export type { UserRole, UserProfile } from "./auth";
import type { UserRole, UserProfile } from "./auth";

// ── Interfaces riêng của user management ──────────────────────

export interface UserListResponse {
  results:  UserProfile[];
  count:    number;
  next:     string | null;
  previous: string | null;
}

export interface UserCreatePayload {
  username:         string;
  email:            string;
  first_name:       string;
  last_name:        string;
  phone?:           string;
  role:             UserRole;
  password:         string;
  password_confirm: string;
}

export interface UserUpdatePayload {
  first_name?:  string;
  last_name?:   string;
  email?:       string;
  phone?:       string;
  role?:        UserRole;
  is_active?:   boolean;
  is_verified?: boolean;
}

export const ROLE_CONFIG: Record <
  UserRole,
  { label: string; color: string; bg: string }
> = {
  ADMIN:      { label: "Quản trị viên",      color: "text-red-700",    bg: "bg-red-100"    },
  PURCHASING: { label: "Nhân viên thu mua",  color: "text-orange-700", bg: "bg-orange-100" },
  INSPECTOR:  { label: "Kiểm định viên",     color: "text-blue-700",   bg: "bg-blue-100"   },
  TECHNICIAN: { label: "Kỹ thuật viên",      color: "text-purple-700", bg: "bg-purple-100" },
  PRICING:    { label: "Nhân viên định giá", color: "text-yellow-700", bg: "bg-yellow-100" },
  SALES:      { label: "Nhân viên bán hàng", color: "text-green-700",  bg: "bg-green-100"  },
  CUSTOMER:   { label: "Khách hàng",         color: "text-gray-700",   bg: "bg-gray-100"   },
};

// ── API calls ──────────────────────────────────────────────────

export async function getUsers(params?: {
  role?:      string;
  search?:    string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}): Promise<UserListResponse> {
  const res = await api.get("/admin/users/", { params });
  return res.data;
}

export async function getUserDetail(id: number): Promise<UserProfile> {
  const res = await api.get(`/admin/users/${id}/`);
  return res.data;
}

export async function createUser(
  data: UserCreatePayload
): Promise<UserProfile> {
  const res = await api.post("/admin/users/create/", data);
  return res.data;
}

export async function updateUser(
  id: number,
  data: UserUpdatePayload
): Promise<UserProfile> {
  const res = await api.patch(`/admin/users/${id}/`, data);
  return res.data;
}

export async function toggleUserActive(
  id: number,
  is_active: boolean
): Promise<{ message: string }> {
  const res = await api.patch(`/admin/users/${id}/`, { is_active });
  return res.data;
}

export async function resetUserPassword(
  id: number,
  new_password: string
): Promise<{ message: string }> {
  const res = await api.post(`/admin/users/${id}/reset-password/`, {
    new_password,
  });
  return res.data;
}