// src/pages/admin/AdminListingsPage.tsx
// Quản lý Niêm yết (Listing) — tạo bài quảng cáo, SEO, xuất bản xe ra frontend
//
// API endpoints:
//   GET    /api/listings/          → danh sách (admin dùng /api/admin/vehicles/ để lấy xe chưa có listing)
//   POST   /api/listings/create/   → tạo listing mới
//   PATCH  /api/listings/<id>/     → cập nhật
//   DELETE /api/listings/<id>/     → xóa
//
// ListingSerializer fields:
//   id, vehicle, vehicle_name, title, slug, description,
//   listed_price, is_active, is_featured, views_count, created_at, updated_at

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Search,
  Plus,
  X,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Globe,
  Car,
  DollarSign,
  BarChart2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVND(val: number | string | null | undefined): string {
  const n = Number(val ?? 0);
  if (!n) return "—";
  const ty = Math.floor(n / 1_000_000_000);
  const tr = Math.floor((n % 1_000_000_000) / 1_000_000);
  if (ty > 0 && tr > 0) return `${ty} Tỷ ${tr} Tr`;
  if (ty > 0) return `${ty} Tỷ`;
  return `${tr} Triệu`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractError(e: any): string {
  const data = e?.response?.data;
  if (!data) return "Có lỗi xảy ra.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.vehicle)
    return Array.isArray(data.vehicle) ? data.vehicle[0] : String(data.vehicle);
  if (data.slug)
    return Array.isArray(data.slug) ? data.slug[0] : String(data.slug);
  const first = Object.values(data).flat()[0];
  return first ? String(first) : "Có lỗi xảy ra.";
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Listing {
  id: number;
  vehicle: number;
  vehicle_name: string;
  title: string;
  slug: string;
  description: string;
  listed_price: string;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface ListingForm {
  vehicle: string;
  title: string;
  slug: string;
  description: string;
  listed_price: string;
  is_active: boolean;
  is_featured: boolean;
}

const EMPTY_FORM: ListingForm = {
  vehicle: "",
  title: "",
  slug: "",
  description: "",
  listed_price: "",
  is_active: true,
  is_featured: false,
};

// ── Modal Tạo / Chỉnh sửa Listing ────────────────────────────────────────────

function ListingModal({
  listing,
  onClose,
  onSuccess,
}: {
  listing?: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!listing;
  const [form, setForm] = useState<ListingForm>(
    isEdit
      ? {
          vehicle: String(listing!.vehicle),
          title: listing!.title,
          slug: listing!.slug,
          description: listing!.description,
          listed_price: listing!.listed_price,
          is_active: listing!.is_active,
          is_featured: listing!.is_featured,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");

  // Lấy danh sách xe READY_FOR_SALE/LISTED/RESERVED chưa có listing
  const { data: vehiclesData } = useQuery({
    queryKey: ["adminVehiclesForListing"],
    queryFn: async () => {
      const res = await api.get("/admin/vehicles/", {
        params: { page_size: 200 },
      });
      return res.data;
    },
    enabled: !isEdit, // chỉ cần khi tạo mới
  });

  const vehicles: any[] = Array.isArray(vehiclesData)
    ? vehiclesData
    : (vehiclesData?.results ?? []);

  // Lọc xe READY_FOR_SALE + LISTED (có thể đăng)
  const eligibleVehicles = vehicles.filter((v) =>
    ["READY_FOR_SALE", "LISTED", "RESERVED"].includes(v.status),
  );

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicle: Number(form.vehicle),
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description.trim(),
        listed_price: Number(form.listed_price),
        is_active: form.is_active,
        is_featured: form.is_featured,
      };
      if (isEdit) {
        const res = await api.patch(`/listings/${listing!.id}/`, payload);
        return res.data;
      } else {
        const res = await api.post("/listings/create/", payload);
        return res.data;
      }
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) => setError(extractError(e)),
  });

  function set(k: keyof ListingForm, v: any) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Auto-generate slug khi đổi title (chỉ khi tạo mới)
      if (k === "title" && !isEdit) {
        next.slug = slugify(v);
      }
      return next;
    });
    setError("");
  }

  const ic =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
  const canSubmit =
    !!form.title &&
    !!form.description &&
    !!form.listed_price &&
    (isEdit || !!form.vehicle) &&
    !mut.isPending;

  // Khi chọn xe, tự điền giá và title gợi ý
  function handleVehicleChange(vehicleId: string) {
    set("vehicle", vehicleId);
    const v = eligibleVehicles.find((x) => String(x.id) === vehicleId);
    if (v) {
      const suggestTitle = `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""} ${v.year} — Xe đã kiểm định`;
      set("title", suggestTitle);
      setForm((p) => ({
        ...p,
        vehicle: vehicleId,
        title: suggestTitle,
        slug: slugify(suggestTitle) + `-${v.id}`,
        listed_price: v.sale_price
          ? String(Number(v.sale_price))
          : p.listed_price,
      }));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {isEdit ? "Chỉnh sửa bài niêm yết" : "Tạo bài niêm yết mới"}
              </h3>
              <p className="text-xs text-gray-400">
                Bài đăng sẽ hiển thị trên trang mua xe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Chọn xe */}
          {!isEdit && (
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
                Xe niêm yết *
              </label>
              <select
                value={form.vehicle}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className={ic}
              >
                <option value="">— Chọn xe (READY_FOR_SALE / LISTED) —</option>
                {eligibleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    #{v.id} · {v.brand} {v.model} {v.variant || ""} {v.year}
                    {" · "}
                    {v.status_display || v.status}
                    {v.sale_price ? ` · ${formatVND(v.sale_price)}` : ""}
                  </option>
                ))}
              </select>
              {eligibleVehicles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Không có xe nào ở trạng thái READY_FOR_SALE hoặc LISTED.
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
              <Car size={15} className="shrink-0" />
              <span>
                Xe: <strong>{listing!.vehicle_name}</strong>
              </span>
            </div>
          )}

          {/* Tiêu đề SEO */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
              Tiêu đề SEO *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Toyota Camry 2.5L 2020 – Xe kiểm định chất lượng cao"
              className={ic}
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.title.length}/120 ký tự · Nên chứa hãng xe, dòng xe, năm,
              tình trạng
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
              Slug (URL)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                /xe/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="toyota-camry-2020-vin00123"
                className={ic + " pl-10"}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Chỉ dùng chữ thường, số và dấu gạch ngang. Tự tạo từ tiêu đề.
            </p>
          </div>

          {/* Giá niêm yết */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
              Giá niêm yết (đ) *
            </label>
            <div className="relative">
              <DollarSign
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                min="0"
                value={form.listed_price}
                onChange={(e) => set("listed_price", e.target.value)}
                placeholder="580000000"
                className={ic + " pl-8"}
              />
            </div>
            {form.listed_price && Number(form.listed_price) > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-1">
                ≈ {formatVND(form.listed_price)}
              </p>
            )}
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
              Mô tả chi tiết *
            </label>
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={`Mô tả đầy đủ về xe: tình trạng, trang bị, ưu điểm, lịch sử sử dụng...\n\nVí dụ:\n- Xe nguyên bản, không tai nạn\n- Động cơ khỏe, máy lạnh lạnh tốt\n- Nội thất còn mới, ghế chưa rách\n- Đầy đủ giấy tờ, sang tên ngay`}
              className={ic + " resize-none"}
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.description.length} ký tự
            </p>
          </div>

          {/* Cài đặt xuất bản */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                form.is_active
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {form.is_active ? (
                <Eye size={18} className="shrink-0" />
              ) : (
                <EyeOff size={18} className="shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {form.is_active ? "Đang hiển thị" : "Đã ẩn"}
                </p>
                <p className="text-xs opacity-70">
                  {form.is_active ? "Khách hàng thấy được" : "Chỉ admin thấy"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => set("is_featured", !form.is_featured)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                form.is_featured
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {form.is_featured ? (
                <Star size={18} className="shrink-0 fill-yellow-500" />
              ) : (
                <StarOff size={18} className="shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {form.is_featured ? "Xe nổi bật" : "Thường"}
                </p>
                <p className="text-xs opacity-70">
                  {form.is_featured ? "Hiện ở mục Featured" : "Không nổi bật"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
          <div className="text-xs text-gray-400">
            {isEdit
              ? `Cập nhật lần cuối: ${new Date(listing!.updated_at).toLocaleDateString("vi-VN")}`
              : "Bài đăng sẽ được kiểm duyệt trước khi hiển thị"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!canSubmit}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mut.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Đang lưu...
                </>
              ) : isEdit ? (
                <>
                  <CheckCircle size={14} /> Lưu thay đổi
                </>
              ) : (
                <>
                  <Globe size={14} /> Đăng niêm yết
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal xác nhận xóa ────────────────────────────────────────────────────────

function DeleteModal({
  listing,
  onClose,
  onSuccess,
}: {
  listing: Listing;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const mut = useMutation({
    mutationFn: () => api.delete(`/listings/${listing.id}/`),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Xóa bài niêm yết</h3>
            <p className="text-xs text-gray-400">Không thể hoàn tác</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Bạn chắc chắn muốn xóa bài niêm yết:
        </p>
        <p className="text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg p-2.5 mb-5">
          {listing.title}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300"
          >
            {mut.isPending ? "Đang xóa..." : "Xóa bài"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal xem chi tiết ────────────────────────────────────────────────────────

function DetailModal({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            Chi tiết niêm yết #{listing.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Trạng thái */}
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                listing.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {listing.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
              {listing.is_active ? "Đang hiển thị" : "Đã ẩn"}
            </span>
            {listing.is_featured && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700">
                <Star size={11} className="fill-yellow-500" /> Xe nổi bật
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
              <BarChart2 size={12} />{" "}
              {listing.views_count.toLocaleString("vi-VN")} lượt xem
            </span>
          </div>

          {/* Xe */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Xe niêm yết</p>
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <Car size={14} className="text-blue-500" /> {listing.vehicle_name}
            </p>
          </div>

          {/* Tiêu đề & slug */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Tiêu đề SEO</p>
            <p className="font-semibold text-gray-900">{listing.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Slug URL</p>
            <p className="font-mono text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg break-all">
              /xe/{listing.slug}
            </p>
          </div>

          {/* Giá */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Giá niêm yết</p>
            <p className="text-2xl font-black text-red-600">
              {formatVND(listing.listed_price)}
            </p>
          </div>

          {/* Mô tả */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Mô tả</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div>
              <span>Ngày đăng: </span>
              <span className="text-gray-600">
                {new Date(listing.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div>
              <span>Cập nhật: </span>
              <span className="text-gray-600">
                {new Date(listing.updated_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminListingsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [filterFeatured, setFilterFeatured] = useState<"" | "true" | "false">(
    "",
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [deleteListing, setDeleteListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);

  // Lấy danh sách tất cả listings (kể cả inactive — admin xem)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", page, search, filterActive, filterFeatured],
    queryFn: async () => {
      const params: any = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      // Backend ListingListView chỉ trả về is_active=True
      // Để admin xem tất cả, dùng admin endpoint hoặc truy cập trực tiếp
      const res = await api.get("/listings/", { params });
      return res.data;
    },
  });

  const listings: Listing[] = Array.isArray(data)
    ? data
    : (data?.results ?? []);
  const totalCount = data?.count ?? listings.length;

  // Filter client-side cho is_active và is_featured
  const filtered = listings.filter((l) => {
    if (filterActive === "true" && !l.is_active) return false;
    if (filterActive === "false" && l.is_active) return false;
    if (filterFeatured === "true" && !l.is_featured) return false;
    if (filterFeatured === "false" && l.is_featured) return false;
    return true;
  });

  // Toggle is_active nhanh
  const toggleActiveMut = useMutation({
    mutationFn: (l: Listing) =>
      api.patch(`/listings/${l.id}/`, { is_active: !l.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });

  // Toggle is_featured nhanh
  const toggleFeaturedMut = useMutation({
    mutationFn: (l: Listing) =>
      api.patch(`/listings/${l.id}/`, { is_featured: !l.is_featured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["listings"] });

  // Summary stats
  const activeCount = listings.filter((l) => l.is_active).length;
  const featuredCount = listings.filter((l) => l.is_featured).length;
  const totalViews = listings.reduce((s, l) => s + (l.views_count || 0), 0);

  return (
    <AdminLayout
      title="Niêm yết xe"
      breadcrumb={[{ label: "Bán hàng" }, { label: "Niêm yết" }]}
    >
      {/* Modals */}
      {showCreate && (
        <ListingModal
          onClose={() => setShowCreate(false)}
          onSuccess={invalidate}
        />
      )}
      {editListing && (
        <ListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSuccess={invalidate}
        />
      )}
      {deleteListing && (
        <DeleteModal
          listing={deleteListing}
          onClose={() => setDeleteListing(null)}
          onSuccess={invalidate}
        />
      )}
      {detailListing && (
        <DetailModal
          listing={detailListing}
          onClose={() => setDetailListing(null)}
        />
      )}

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Tổng bài niêm yết",
            value: totalCount,
            icon: <Tag size={18} className="text-blue-600" />,
            bg: "bg-blue-50",
            color: "text-blue-700",
          },
          {
            label: "Đang hiển thị",
            value: activeCount,
            icon: <Eye size={18} className="text-green-600" />,
            bg: "bg-green-50",
            color: "text-green-700",
          },
          {
            label: "Xe nổi bật",
            value: featuredCount,
            icon: <Star size={18} className="text-yellow-600" />,
            bg: "bg-yellow-50",
            color: "text-yellow-700",
          },
          {
            label: "Tổng lượt xem",
            value:
              totalViews >= 1000
                ? `${(totalViews / 1000).toFixed(1)}K`
                : totalViews,
            icon: <BarChart2 size={18} className="text-purple-600" />,
            bg: "bg-purple-50",
            color: "text-purple-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl border border-white/60 p-4 flex items-center gap-4`}
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Danh sách bài niêm yết</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} bài
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
                setPage(1);
              }}
              className="relative w-full sm:w-56"
            >
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm tiêu đề, tên xe..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              />
            </form>

            {/* Filter is_active */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hiển thị</option>
              <option value="false">Đã ẩn</option>
            </select>

            {/* Filter is_featured */}
            <select
              value={filterFeatured}
              onChange={(e) => setFilterFeatured(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">Tất cả loại</option>
              <option value="true">Xe nổi bật</option>
              <option value="false">Thường</option>
            </select>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus size={15} /> Tạo niêm yết
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-red-300 mb-3" />
            <p className="text-gray-500">Không thể tải dữ liệu</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Tag size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              Chưa có bài niêm yết nào
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Tạo bài niêm yết để đăng xe ra trang mua xe
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              <Plus size={14} /> Tạo bài niêm yết đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Xe / Tiêu đề
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Giá niêm yết
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Lượt xem
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Hiển thị
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Nổi bật
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Ngày đăng
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className={`hover:bg-gray-50 transition-colors ${!l.is_active ? "opacity-60" : ""}`}
                  >
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                      #{l.id}
                    </td>

                    {/* Xe / Tiêu đề */}
                    <td className="px-5 py-4 max-w-[280px]">
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5 truncate">
                        <Car size={13} className="text-blue-400 shrink-0" />
                        {l.vehicle_name || `Xe #${l.vehicle}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {l.title}
                      </p>
                      <p className="text-[10px] text-blue-400 font-mono mt-0.5 truncate">
                        /xe/{l.slug}
                      </p>
                    </td>

                    {/* Giá */}
                    <td className="px-5 py-4 font-bold text-red-600 whitespace-nowrap">
                      {formatVND(l.listed_price)}
                    </td>

                    {/* Lượt xem */}
                    <td className="px-5 py-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-sm text-gray-600">
                        <BarChart2 size={12} className="text-purple-400" />
                        {l.views_count.toLocaleString("vi-VN")}
                      </span>
                    </td>

                    {/* Toggle is_active */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleActiveMut.mutate(l)}
                        disabled={toggleActiveMut.isPending}
                        title={l.is_active ? "Nhấn để ẩn" : "Nhấn để hiển thị"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          l.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {l.is_active ? (
                          <>
                            <Eye size={11} /> Hiện
                          </>
                        ) : (
                          <>
                            <EyeOff size={11} /> Ẩn
                          </>
                        )}
                      </button>
                    </td>

                    {/* Toggle is_featured */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleFeaturedMut.mutate(l)}
                        disabled={toggleFeaturedMut.isPending}
                        title={
                          l.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          l.is_featured
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {l.is_featured ? (
                          <>
                            <Star size={11} className="fill-yellow-500" /> Nổi
                            bật
                          </>
                        ) : (
                          <>
                            <StarOff size={11} /> Thường
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ngày đăng */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailListing(l)}
                          title="Xem chi tiết"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setEditListing(l)}
                          title="Chỉnh sửa"
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteListing(l)}
                          title="Xóa bài"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {/* Ghi chú SEO */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700">
        <p className="font-bold mb-1.5">
          💡 Hướng dẫn tạo tiêu đề SEO hiệu quả:
        </p>
        <ul className="space-y-0.5 list-disc pl-4">
          <li>
            Bắt đầu bằng <strong>Hãng + Dòng xe + Năm</strong> — VD: "Toyota
            Camry 2021"
          </li>
          <li>
            Thêm variant/tình trạng — VD: "2.5L Hybrid – Xe một chủ kiểm định"
          </li>
          <li>
            Từ khoá mạnh: "xe cũ", "đã kiểm định", "giá tốt", "sang tên ngay"
          </li>
          <li>
            Độ dài lý tưởng: <strong>50–70 ký tự</strong> để hiển thị đầy đủ
            trên Google
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}
