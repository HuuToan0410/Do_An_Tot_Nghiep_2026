import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  GitBranch,
  WrenchIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  UserCircle,
  Users,
  DollarSign,
  Calendar,
  Shield,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../api/auth";

// ── Nav items với role được phép ──────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  allowedRoles: UserRole[]; // role nào được thấy item này
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    exact: true,
    allowedRoles: [
      "ADMIN",
      "PURCHASING",
      "INSPECTOR",
      "TECHNICIAN",
      "PRICING",
      "SALES",
    ],
  },
  {
    to: "/admin/vehicles",
    label: "Quản lý xe",
    icon: <Car size={18} />,
    allowedRoles: ["ADMIN", "PURCHASING", "PRICING", "INSPECTOR", "TECHNICIAN"],
  },
  {
    to: "/admin/workflow",
    label: "Workflow",
    icon: <GitBranch size={18} />,
    allowedRoles: [
      "ADMIN",
      "PURCHASING",
      "INSPECTOR",
      "TECHNICIAN",
      "PRICING",
      "SALES",
    ],
  },
  {
    to: "/admin/deposits",
    label: "Đặt cọc",
    icon: <ClipboardList size={18} />,
    allowedRoles: ["ADMIN", "SALES"],
  },
  {
    to: "/admin/inspections",
    label: "Kiểm định",
    icon: <WrenchIcon size={18} />,
    allowedRoles: ["ADMIN", "INSPECTOR"],
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: <Users size={18} />,
    allowedRoles: ["ADMIN"], // ← chỉ ADMIN
  },
  {
    to: "/admin/refurbishment",
    label: "Tân trang",
    icon: <WrenchIcon size={18} />,
    allowedRoles: ["ADMIN", "TECHNICIAN", "PURCHASING"],
  },
  {
    to: "/admin/pricing",
    label: "Định giá",
    icon: <DollarSign size={18} />,
    allowedRoles: ["ADMIN", "PRICING"],
  },
  {
    to: "/admin/appointments",
    label: "Lịch hẹn",
    icon: <Calendar size={18} />,
    allowedRoles: ["ADMIN", "SALES"],
  },
  {
    to: "/admin/sales-orders",
    label: "Đơn bán hàng",
    icon: <ClipboardList size={18} />,
    allowedRoles: ["ADMIN", "SALES"],
  },
  {
    to: "/admin/warranties",
    label: "Bảo hành",
    icon: <Shield size={18} />,
    allowedRoles: ["ADMIN", "SALES"],
  },
  /* {
    to: "/admin/handovers",
    label: "Bàn giao xe",
    icon: <MapPin size={18} />,
    allowedRoles: ["ADMIN", "SALES"],
  }, */
];

// ── Props ──────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: { label: string; to?: string }[];
}

// ── Component ──────────────────────────────────────────────────

export default function AdminLayout({ children, title, breadcrumb }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const userRole = (user?.role ?? "") as UserRole;

  // Lọc nav items theo role hiện tại
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole),
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function isActive(to: string, exact?: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to);
  }

  // ── Sidebar content ────────────────────────────────────────
  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link
          to="/admin"
          className="flex items-center gap-3 px-6 py-5 border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
        >
          <img
            src="/1-removebg-preview.png"
            alt="Admin"
            className="h-20 w-auto object-contain"
          />

          <div>
            <p className="text-white font-bold text-sm leading-tight">
              Admin Panel
            </p>
            <p className="text-gray-500 text-xs">AUTO.LA</p>
          </div>
        </Link>

        {/* Role badge */}
        {user && (
          <div className="px-4 py-2 border-b border-gray-700/50">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Vai trò:{" "}
            </span>
            <span className="text-[10px] font-bold text-red-400">
              {user.role_display ?? userRole}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
                {active && (
                  <ChevronRight size={14} className="ml-auto shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-gray-700 p-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle size={20} className="text-gray-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                  : (user?.username ?? "Admin")}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {user?.email ?? ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors font-medium"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-gray-900 flex flex-col">
            {/* Close button mobile */}
            <div className="flex justify-end px-4 pt-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-800"
              aria-label="Mở menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            {breadcrumb ? (
              <nav className="flex items-center gap-1 text-sm min-w-0">
                <Link
                  to="/admin"
                  className="text-gray-400 hover:text-red-600 transition-colors shrink-0"
                >
                  Admin
                </Link>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1 min-w-0">
                    <ChevronRight
                      size={13}
                      className="text-gray-300 shrink-0"
                    />
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="text-gray-400 hover:text-red-600 transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-800 font-semibold truncate">
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            ) : (
              title && (
                <h1 className="text-base font-bold text-gray-900 truncate">
                  {title}
                </h1>
              )
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              className="relative text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Thông báo"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <Link
              to="/"
              target="_blank"
              className="text-xs text-gray-400 hover:text-red-600 transition-colors hidden sm:block"
            >
              Xem website →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
