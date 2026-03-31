import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Phone,
  Menu,
  X,
  Search,
  LogOut,
  UserCircle,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../api/auth";
import { Heart } from "lucide-react";
// ── Constants ──────────────────────────────────────────────────

const BRANDS = [
  "Toyota",
  "Mazda",
  "Honda",
  "Hyundai",
  "KIA",
  "Ford",
  "Nissan",
  "Vinfast",
  "BMW",
  "Audi",
  "Mercedes Benz",
  "Volvo",
  "Peugeot",
  "Mitsubishi",
  "Chevrolet",
  "Suzuki",
  "Lexus",
  "Subaru",
];

const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/sell", label: "Bán xe" },
  { to: "/services", label: "Dịch vụ" },
  { to: "/news", label: "Tin tức" },
  { to: "/contact", label: "Liên hệ" },
];

const MOBILE_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/vehicles", label: "Mua xe" },
  { to: "/sell", label: "Bán xe" },
  { to: "/services", label: "Dịch vụ" },
  { to: "/news", label: "Tin tức" },
  { to: "/contact", label: "Liên hệ" },
];

// Vai trò nào được hiển thị link "Quản trị"
const STAFF_ROLES: UserRole[] = [
  "ADMIN",
  "PURCHASING",
  "INSPECTOR",
  "TECHNICIAN",
  "PRICING",
  "SALES",
];

// ── Component ──────────────────────────────────────────────────

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const isStaff = user && STAFF_ROLES.includes(user.role as UserRole);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleSearch() {
    if (searchText.trim()) {
      navigate(`/vehicles?search=${encodeURIComponent(searchText.trim())}`);
    }
    setSearchOpen(false);
    setSearchText("");
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchText("");
    }
  }

  return (
    <header className="bg-[#111] text-white sticky top-0 z-50 shadow-lg">
      {/* ── Top bar ── */}
      <div className="bg-red-600 text-white text-sm py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone size={14} />
            Hotline:{" "}
            <a href="tel:0987654321" className="font-bold hover:underline">
              0987 654 321
            </a>{" "}
            — Mở cửa 7:00–19:00 tất cả các ngày
          </span>
          <span className="hidden md:block text-red-100 text-xs">
            📍 Số 123 An Phú Đông, Quận 12, Tp.Hồ Chí Minh
          </span>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="../../public/1-removebg-preview.png"
            alt="AUTO.LA"
            className="h-30 w-auto object-contain"
            onError={(e) => {
              // Fallback nếu file không tồn tại
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="font-bold text-white text-sm leading-tight hidden sm:block">
            AUTO Leng Art
            <br />
            <span className="text-gray-400 font-normal text-xs">
              TP.Hồ Chí Minh
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {/* Trang chủ */}
          <Link
            to="/"
            className="px-4 py-2 hover:text-red-400 transition-colors"
          >
            Trang chủ
          </Link>

          {/* Mua xe dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setBuyOpen(true)}
            onMouseLeave={() => setBuyOpen(false)}
          >
            <button className="flex items-center gap-1 px-4 py-2 hover:text-red-400 transition-colors">
              Mua xe <ChevronDown size={14} />
            </button>

            {buyOpen && (
              <div className="absolute top-full left-0 bg-white text-gray-800 shadow-2xl rounded-b-xl w-56 py-2 z-50">
                <Link
                  to="/vehicles"
                  onClick={() => setBuyOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 font-bold text-red-600 hover:bg-red-50 border-b border-gray-100 text-sm"
                >
                  Tất cả xe
                </Link>
                <div className="grid grid-cols-2 gap-0.5 p-1">
                  {BRANDS.map((b) => (
                    <Link
                      key={b}
                      to={`/vehicles?brand=${encodeURIComponent(b)}`}
                      onClick={() => setBuyOpen(false)}
                      className="px-3 py-2 text-xs hover:bg-gray-50 hover:text-red-600 transition-colors rounded-lg"
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Các link còn lại */}
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 hover:text-red-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Auth */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Search inline */}
          {searchOpen ? (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1.5">
              <input
                autoFocus
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Tìm kiếm xe..."
                className="bg-transparent text-white placeholder-gray-400 text-sm outline-none w-40"
              />
              <button
                onClick={handleSearch}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchText("");
                }}
                className="text-gray-400 hover:text-white transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm"
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <Search size={18} />
            </button>
          )}

          {/* Auth area */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-medium hover:text-red-400 transition-colors px-2 py-1.5">
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                  <UserCircle size={18} />
                </div>
                <span className="max-w-[90px] truncate">
                  {user.first_name || user.username}
                </span>
                <ChevronDown size={13} />
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 shadow-2xl rounded-xl w-48 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 border border-gray-100">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user.first_name
                      ? `${user.first_name} ${user.last_name ?? ""}`
                      : user.username}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {user.role_display ?? user.role}
                  </p>
                </div>

                {/* Staff: link quản trị */}
                {isStaff && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-red-600 transition-colors"
                  >
                    <Settings size={14} /> Quản trị hệ thống
                  </Link>
                )}
                <Link
                  to="/favorites"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Heart size={15} className="text-red-500" />
                  Xe yêu thích
                </Link>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-red-600 transition-colors"
                >
                  <UserCircle size={14} /> Tài khoản của tôi
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/login?tab=register"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white p-1"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ── Mobile search bar ── */}
      <div className="lg:hidden px-4 pb-3">
        <div className="flex items-center bg-white/10 rounded-lg px-3 py-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Tìm kiếm xe..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm outline-none"
          />
          <button
            onClick={handleSearch}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#1a1a1a] border-t border-gray-700 px-4 py-3 space-y-0.5 text-sm">
          {MOBILE_LINKS.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block py-2.5 px-2 rounded-lg hover:bg-white/5 hover:text-red-400 transition-colors ${
                i < MOBILE_LINKS.length - 1 ? "border-b border-gray-700/50" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile auth */}
          <div className="pt-3 mt-2 border-t border-gray-700 space-y-2">
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                    <UserCircle size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name || user.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.role_display ?? user.role}
                    </p>
                  </div>
                </div>

                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-2 py-2.5 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Settings size={15} /> Quản trị hệ thống
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-2 py-2.5 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <UserCircle size={15} /> Tài khoản của tôi
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2.5 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center border border-gray-600 text-gray-300 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/login?tab=register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
