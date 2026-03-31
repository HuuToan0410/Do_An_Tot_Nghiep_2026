import { Routes, Route, Navigate } from "react-router-dom";

// ── Public pages ──────────────────────────────────────────────
import HomePage from "../pages/HomePage";
import VehiclesPage from "../pages/VehiclesPage";
import VehicleDetailPage from "../pages/VehicleDetailPage";
import DepositPage from "../pages/DepositPage";
import LoginPage from "../pages/LoginPage";

// ── Admin pages ───────────────────────────────────────────────
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminVehiclesPage from "../pages/admin/AdminVehiclesPage";
import AdminVehicleCreatePage from "../pages/admin/AdminVehicleCreatePage";
import AdminVehicleEditPage from "../pages/admin/AdminVehicleEditPage";
import AdminDepositsPage from "../pages/admin/AdminDepositsPage";
import AdminInspectionsPage from "../pages/admin/AdminInspectionsPage";
import VehicleWorkflowPage from "../pages/admin/VehicleWorkflowPage";

// ── Auth ──────────────────────────────────────────────────────
import ProtectedRoute from "../components/ProtectedRoute";

// Vai trò được truy cập admin panel
const STAFF_ROLES = [
  "ADMIN",
  "PURCHASING",
  "INSPECTOR",
  "TECHNICIAN",
  "PRICING",
  "SALES",
] as const;

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
      <Route path="/deposit/:vehicleId" element={<DepositPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ── Admin — yêu cầu role nội bộ ────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Danh sách xe */}
      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <AdminVehiclesPage />
          </ProtectedRoute>
        }
      />

      {/* Tạo xe mới — phải đặt TRƯỚC /:id/edit để tránh conflict */}
      <Route
        path="/admin/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PURCHASING"]}>
            <AdminVehicleCreatePage />
          </ProtectedRoute>
        }
      />

      {/* Chỉnh sửa xe */}
      <Route
        path="/admin/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PURCHASING", "PRICING"]}>
            <AdminVehicleEditPage />
          </ProtectedRoute>
        }
      />

      {/* Workflow vòng đời xe */}
      <Route
        path="/admin/workflow"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <VehicleWorkflowPage />
          </ProtectedRoute>
        }
      />

      {/* Đặt cọc */}
      <Route
        path="/admin/deposits"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminDepositsPage />
          </ProtectedRoute>
        }
      />

      {/* Kiểm định */}
      <Route
        path="/admin/inspections"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "INSPECTOR"]}>
            <AdminInspectionsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback — redirect về trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
