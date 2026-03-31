// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../api/auth";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;  // mặc định false — cho phép xem tự do
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Không yêu cầu đăng nhập → render luôn
  if (!requireAuth) return <>{children}</>;

  // Chưa đăng nhập → redirect sang login, lưu lại trang muốn vào
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng không đúng role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}