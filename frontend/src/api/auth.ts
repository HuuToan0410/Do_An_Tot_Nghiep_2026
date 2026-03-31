import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export type UserRole =
  | "ADMIN"
  | "PURCHASING"
  | "INSPECTOR"
  | "TECHNICIAN"
  | "PRICING"
  | "SALES"
  | "CUSTOMER";

export interface UserProfile {
  id:           number;
  username:     string;
  email:        string;
  first_name:   string;
  last_name:    string;
  phone?:       string;
  address?:     string;
  avatar?:      string | null;
  role:         UserRole;
  role_display: string;
  is_active:    boolean;
  is_verified:  boolean;
  date_joined:  string;   // ← thêm để dùng trong AdminUsersPage
  created_at?:  string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access:  string;
  refresh: string;
  user:    UserProfile;
}

export interface RegisterPayload {
  username:         string;
  email:            string;
  password:         string;
  password_confirm: string;
  first_name?:      string;
  last_name?:       string;
  phone?:           string;
}

export interface RegisterResponse {
  access:  string;    // auto-login sau register
  refresh: string;
  user:    UserProfile;
}

export interface ChangePasswordPayload {
  old_password:         string;
  new_password:         string;
  new_password_confirm: string;
}

// ── API calls ──────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await api.post("/auth/login/", { username, password });
  return res.data;
}

export async function register(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const res = await api.post("/auth/register/", payload);
  return res.data;
}

export async function refreshToken(
  refresh: string
): Promise<{ access: string }> {
  const res = await api.post("/auth/token/refresh/", { refresh });
  return res.data;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get("/auth/profile/");
  return res.data;
}

export async function updateProfile(
  data: Partial<Pick<UserProfile, "first_name" | "last_name" | "phone" | "address">>
): Promise<UserProfile> {
  const res = await api.patch("/auth/profile/", data);
  return res.data;
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<{ message: string }> {
  const res = await api.post("/auth/change-password/", payload);
  return res.data;
}