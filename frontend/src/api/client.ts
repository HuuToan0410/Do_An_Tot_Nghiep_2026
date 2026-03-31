// src/api/client.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: gắn access token ──
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
const PUBLIC_ENDPOINTS = [
  "/deposits/",
  "/vehicles/",
  "/favorites/",
  "/appointments/",
  "/contact-request/",
  "/sell-request/",
  "/momo/",
];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((p) => url.includes(p));
}

// ── Response interceptor: tự động refresh token khi 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

// Không phải 401 → giữ nguyên
if (error.response?.status !== 401) {
  return Promise.reject(error);
}

// Nếu là endpoint public → KHÔNG redirect login
if (isPublicEndpoint(original?.url)) {
  return Promise.reject(error);
}

// Nếu đã retry rồi → logout
if (original._retry) {
  useAuthStore.getState().logout();
  window.location.href = "/login";
  return Promise.reject(error);
}

// Lấy refresh token
const refresh = useAuthStore.getState().refresh;
if (!refresh) {
  useAuthStore.getState().logout();
  window.location.href = "/login";
  return Promise.reject(error);
}

try {
  original._retry = true;

  const res = await axios.post(
    `${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/auth/token/refresh/`,
    { refresh }
  );

  const newAccess = res.data.access;

  useAuthStore.getState().setAuth(
    newAccess,
    refresh,
    useAuthStore.getState().user ?? undefined
  );

  original.headers.Authorization = `Bearer ${newAccess}`;

  return api(original);
} catch {
  useAuthStore.getState().logout();
  window.location.href = "/login";
  return Promise.reject(error);
}
  }
);

export default api;