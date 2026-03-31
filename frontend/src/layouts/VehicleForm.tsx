import { useRef, useState } from "react";
import {
  AlertCircle,
  Upload,
  X,
  ImagePlus,
  Car,
  DollarSign,
  Settings,
  FileText,
  Tag,
} from "lucide-react";
import {
  BRANDS,
  FUEL_TYPES,
  TRANSMISSIONS,
  STATUSES,
  BODY_TYPES,
  type VehicleFormData,
  type VehicleFormErrors,
  type VehicleMedia,
} from "../api/vehicles";

// ── Helpers ────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors bg-white ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="text-gray-400 font-normal ml-1">({hint})</span>
        )}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <span className="text-red-500">{icon}</span>
        <h3 className="font-bold text-sm text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Image Upload ───────────────────────────────────────────────

interface ImageUploadProps {
  newImages: File[];
  existingImages?: VehicleMedia[];
  onAddImages: (files: File[]) => void;
  onRemoveNew: (index: number) => void;
  onRemoveExisting?: (id: number) => void;
}

function ImageUpload({
  newImages,
  existingImages = [],
  onAddImages,
  onRemoveNew,
  onRemoveExisting,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    onAddImages(valid);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? "border-red-400 bg-red-50"
            : "border-gray-200 hover:border-red-300 hover:bg-gray-50"
        }`}
      >
        <Upload
          size={28}
          className={`mx-auto mb-2 ${dragging ? "text-red-500" : "text-gray-300"}`}
        />
        <p className="text-sm font-medium text-gray-500">
          Kéo thả ảnh vào đây hoặc{" "}
          <span className="text-red-600 font-semibold">chọn file</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PNG, JPG, WEBP — tối đa 5MB mỗi ảnh
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Image grid */}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {/* Existing images — dùng VehicleMedia.file (không phải .image) */}
          {existingImages.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={img.file}
                alt={img.caption || "Ảnh xe"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {onRemoveExisting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExisting(img.id);
                  }}
                  className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={12} />
                </button>
              )}
              <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                {img.is_primary ? "Ảnh chính" : "Đã lưu"}
              </div>
            </div>
          ))}

          {/* New images */}
          {newImages.map((file, i) => (
            <div
              key={i}
              className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Ảnh mới ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveNew(i);
                }}
                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 bg-blue-600/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                Mới
              </div>
            </div>
          ))}

          {/* Add more */}
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50 flex flex-col items-center justify-center gap-1 transition-colors group"
          >
            <ImagePlus
              size={20}
              className="text-gray-300 group-hover:text-red-400"
            />
            <span className="text-xs text-gray-400 group-hover:text-red-400">
              Thêm
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main VehicleForm ───────────────────────────────────────────

interface VehicleFormProps {
  form: VehicleFormData;
  errors: VehicleFormErrors;
  newImages: File[];
  existingImages?: VehicleMedia[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  submitLabel: string;
  onChange: (field: keyof VehicleFormData, value: string) => void;
  onAddImages: (files: File[]) => void;
  onRemoveNewImage: (index: number) => void;
  onRemoveExistingImage?: (id: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function VehicleForm({
  form,
  errors,
  newImages,
  existingImages = [],
  isPending,
  isError,
  errorMessage,
  submitLabel,
  onChange,
  onAddImages,
  onRemoveNewImage,
  onRemoveExistingImage,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  return (
    <div className="space-y-5">
      {/* API Error */}
      {isError && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {errorMessage ??
            "Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại thông tin."}
        </div>
      )}

      {/* ── Section 1: Thông tin nhận dạng ── */}
      <Section icon={<Car size={16} />} title="Thông tin nhận dạng">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Số khung (VIN)" required error={errors.vin}>
            <input
              placeholder="vd: 1HGCM82633A123456"
              value={form.vin}
              onChange={(e) => onChange("vin", e.target.value)}
              className={inputClass(!!errors.vin)}
              autoCapitalize="characters"
            />
          </Field>

          <Field label="Biển số xe">
            <input
              placeholder="vd: 30A-12345"
              value={form.license_plate ?? ""}
              onChange={(e) =>
                onChange(
                  "license_plate" as keyof VehicleFormData,
                  e.target.value,
                )
              }
              className={inputClass(false)}
            />
          </Field>

          <Field label="Hãng xe" required error={errors.brand}>
            <select
              value={form.brand}
              onChange={(e) => onChange("brand", e.target.value)}
              className={inputClass(!!errors.brand)}
            >
              <option value="">-- Chọn hãng --</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dòng xe / Model" required error={errors.model}>
            <input
              placeholder="vd: Camry, CX-5, Tucson..."
              value={form.model}
              onChange={(e) => onChange("model", e.target.value)}
              className={inputClass(!!errors.model)}
            />
          </Field>

          <Field label="Phiên bản">
            <input
              placeholder="vd: 2.5Q, Premium, Luxury..."
              value={form.variant ?? ""}
              onChange={(e) =>
                onChange("variant" as keyof VehicleFormData, e.target.value)
              }
              className={inputClass(false)}
            />
          </Field>

          <Field label="Màu sắc">
            <input
              placeholder="vd: Trắng ngọc trai, Đen, Bạc..."
              value={form.color ?? ""}
              onChange={(e) =>
                onChange("color" as keyof VehicleFormData, e.target.value)
              }
              className={inputClass(false)}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Thông số kỹ thuật ── */}
      <Section icon={<Settings size={16} />} title="Thông số kỹ thuật">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Năm sản xuất" required error={errors.year}>
            <input
              type="number"
              placeholder="vd: 2021"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={form.year}
              onChange={(e) => onChange("year", e.target.value)}
              className={inputClass(!!errors.year)}
            />
          </Field>

          <Field label="Số km đã đi" required error={errors.mileage} hint="km">
            <input
              type="number"
              placeholder="vd: 45000"
              min="0"
              value={form.mileage}
              onChange={(e) => onChange("mileage", e.target.value)}
              className={inputClass(!!errors.mileage)}
            />
          </Field>

          <Field label="Nhiên liệu" required error={errors.fuel_type}>
            <select
              value={form.fuel_type}
              onChange={(e) => onChange("fuel_type", e.target.value)}
              className={inputClass(!!errors.fuel_type)}
            >
              <option value="">-- Chọn --</option>
              {FUEL_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Hộp số" required error={errors.transmission}>
            <select
              value={form.transmission}
              onChange={(e) => onChange("transmission", e.target.value)}
              className={inputClass(!!errors.transmission)}
            >
              <option value="">-- Chọn --</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kiểu dáng xe" required error={errors.body_type}>
            <select
              value={form.body_type ?? ""}
              onChange={(e) =>
                onChange("body_type" as keyof VehicleFormData, e.target.value)
              }
              className={inputClass(false)}
            >
              <option value="">-- Chọn kiểu dáng --</option>
              {BODY_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Thu mua & Giá bán ── */}
      <Section icon={<DollarSign size={16} />} title="Thu mua & Giá bán">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Giá thu mua" hint="VND">
            <input
              type="number"
              placeholder="vd: 700000000"
              min="0"
              value={form.purchase_price ?? ""}
              onChange={(e) =>
                onChange(
                  "purchase_price" as keyof VehicleFormData,
                  e.target.value,
                )
              }
              className={inputClass(false)}
            />
            {form.purchase_price && (
              <p className="text-xs text-gray-500 mt-1">
                = {Number(form.purchase_price).toLocaleString("vi-VN")} đ
              </p>
            )}
          </Field>

          <Field label="Ngày thu mua">
            <input
              type="date"
              value={form.purchase_date ?? ""}
              onChange={(e) =>
                onChange(
                  "purchase_date" as keyof VehicleFormData,
                  e.target.value,
                )
              }
              className={inputClass(false)}
            />
          </Field>

          <Field
            label="Giá bán niêm yết"
            required
            error={errors.sale_price}
            hint="VND"
          >
            <input
              type="number"
              placeholder="vd: 850000000"
              min="0"
              value={form.sale_price ?? ""}
              onChange={(e) => onChange("sale_price", e.target.value)}
              className={inputClass(!!errors.sale_price)}
            />
            {form.sale_price && !errors.sale_price && (
              <p className="text-xs text-green-600 font-semibold mt-1">
                ≈ {Number(form.sale_price).toLocaleString("vi-VN")} đ
              </p>
            )}
          </Field>

          <Field label="Trạng thái">
            <select
              value={form.status ?? "PURCHASED"}
              onChange={(e) =>
                onChange("status" as keyof VehicleFormData, e.target.value)
              }
              className={inputClass(false)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Ghi chú thu mua">
              <textarea
                rows={2}
                placeholder="Nguồn gốc, lý do bán, lịch sử tai nạn (nếu có)..."
                value={form.purchase_note ?? ""}
                onChange={(e) =>
                  onChange(
                    "purchase_note" as keyof VehicleFormData,
                    e.target.value,
                  )
                }
                className={inputClass(false) + " resize-none"}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Mô tả ── */}
      <Section icon={<FileText size={16} />} title="Mô tả chi tiết">
        <Field label="Mô tả xe">
          <textarea
            rows={6}
            placeholder="Mô tả tình trạng xe, lịch sử bảo dưỡng, trang bị nội thất, các điểm nổi bật, lý do nên mua..."
            value={form.description ?? ""}
            onChange={(e) =>
              onChange("description" as keyof VehicleFormData, e.target.value)
            }
            className={inputClass(false) + " resize-none leading-relaxed"}
          />
        </Field>
      </Section>

      {/* ── Section 5: Hình ảnh ── */}
      <Section icon={<Tag size={16} />} title="Hình ảnh xe">
        <ImageUpload
          newImages={newImages}
          existingImages={existingImages}
          onAddImages={onAddImages}
          onRemoveNew={onRemoveNewImage}
          onRemoveExisting={onRemoveExistingImage}
        />
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold rounded-xl transition-colors text-sm"
        >
          Hủy
        </button>
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
}
