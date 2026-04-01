import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Public pages
import HomePage from "../pages/HomePage";
import VehiclesPage from "../pages/VehiclesPage";
import VehicleDetailPage from "../pages/VehicleDetailPage";
import VehicleInspectionPage from "../pages/VehicleInspectionPage";
import DepositPage from "../pages/DepositPage";
import DepositResultPage from "../pages/DepositResultPage";
import LoginPage from "../pages/LoginPage";
import SellPage from "../pages/SellPage";
import ServicesPage from "../pages/ServicesPage";
import NewsPage from "../pages/NewsPage";
import ContactPage from "../pages/ContactPage";
import ComparePage from "../pages/ComparePage";
import FavoritesPage from "../pages/FavoritesPage";

// Auth-required pages
import ProfilePage from "../pages/ProfilePage";

// Admin pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminVehiclesPage from "../pages/admin/AdminVehiclesPage";
import AdminVehicleCreatePage from "../pages/admin/AdminVehicleCreatePage";
import AdminVehicleEditPage from "../pages/admin/AdminVehicleEditPage";
import VehicleWorkflowPage from "../pages/admin/VehicleWorkflowPage";
import AdminDepositsPage from "../pages/admin/AdminDepositsPage";
import AdminInspectionsPage from "../pages/admin/AdminInspectionsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminRefurbishmentPage from "../pages/admin/AdminRefurbishmentPage";
import AdminPricingPage from "../pages/admin/AdminPricingPage";
import AdminAppointmentsPage from "../pages/admin/Adminappointmentspage";
import AdminSalesOrdersPage from "../pages/admin/AdminSalesOrdersPage";
import AdminWarrantiesPage from "../pages/admin/AdminWarrantiesPage";
import AdminHandoversPage from "../pages/admin/Adminhandoverspage";
import AdminInquiriesPage from "../pages/admin/AdminInquiriesPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── PUBLIC — không cần đăng nhập ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
      <Route
        path="/vehicles/:id/inspection"
        element={<VehicleInspectionPage />}
      />
      <Route path="/deposit/result" element={<DepositResultPage />} />
      <Route path="/deposit/:vehicleId" element={<DepositPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sell" element={<SellPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/favorites" element={<FavoritesPage />} />

      {/* ── REQUIRE AUTH — cần đăng nhập ── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute requireAuth>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── ADMIN — cần đăng nhập + đúng role ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
              "PURCHASING",
              "INSPECTOR",
              "TECHNICIAN",
              "PRICING",
              "SALES",
            ]}
          >
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PURCHASING", "SALES"]}>
            <AdminVehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PURCHASING"]}>
            <AdminVehicleCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PURCHASING"]}>
            <AdminVehicleEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workflow"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
              "PURCHASING",
              "INSPECTOR",
              "TECHNICIAN",
              "PRICING",
              "SALES",
            ]}
          >
            <VehicleWorkflowPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminDepositsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inspections"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "INSPECTOR"]}>
            <AdminInspectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/refurbishment"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "TECHNICIAN"]}>
            <AdminRefurbishmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PRICING"]}>
            <AdminPricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales-orders"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminSalesOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/warranties"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminWarrantiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/handovers"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminHandoversPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inquiries"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
            <AdminInquiriesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
