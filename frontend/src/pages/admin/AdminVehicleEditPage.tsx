import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, AlertCircle, CheckCircle, Eye } from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import VehicleForm from "../../layouts/VehicleForm";
import {
  EMPTY_VEHICLE_FORM,
  validateVehicleForm,
  updateVehicleApi,
  getVehicleAdminDetail,
  deleteVehicleImageApi,
  uploadVehicleMedia,
  type VehicleFormData,
  type VehicleFormErrors,
  type VehicleMedia,
} from "../../api/vehicles";

export default function AdminVehicleEditPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const queryClient  = useQueryClient();

  const justCreated =
    (location.state as { created?: boolean } | null)?.created === true;

  const [form,           setForm]           = useState<VehicleFormData>(EMPTY_VEHICLE_FORM);
  const [errors,         setErrors]         = useState<VehicleFormErrors>({});
  const [newImages,      setNewImages]      = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<VehicleMedia[]>([]);
  const [showDelete,     setShowDelete]     = useState(false);
  const [saveSuccess,    setSaveSuccess]    = useState(justCreated);

  // ── Load vehicle ──
  const { data, isLoading, isError: loadError } = useQuery({
    queryKey: ["adminVehicle", id],
    queryFn:  () => getVehicleAdminDetail(id!),
    enabled:  !!id,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      vin:            data.vin            ?? "",
      license_plate:  data.license_plate  ?? "",
      brand:          data.brand          ?? "",
      model:          data.model          ?? "",
      variant:        data.variant        ?? "",
      year:           String(data.year    ?? ""),
      mileage:        String(data.mileage ?? ""),
      fuel_type:      data.fuel_type      ?? "",
      transmission:   data.transmission   ?? "",
      color:          data.color          ?? "",
      purchase_price: String(data.purchase_price ?? ""),
      purchase_date:  data.purchase_date  ?? "",
      purchase_note:  data.purchase_note  ?? "",
      sale_price:     String(data.sale_price ?? ""),
      description:    data.description    ?? "",
      status:         data.status         ?? "PURCHASED",
    });
    // Chỉ lấy ảnh (loại bỏ video)
    setExistingImages(
      (data.media ?? []).filter((m) => m.media_type === "IMAGE")
    );
  }, [data]);

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. Cập nhật thông tin xe
      await updateVehicleApi(Number(id), form);
      // 2. Upload ảnh mới nếu có
      if (newImages.length > 0) {
        await uploadVehicleMedia(Number(id), newImages);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVehicle", id] });
      queryClient.invalidateQueries({ queryKey: ["adminVehicles"] });
      setSaveSuccess(true);
      setNewImages([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSaveSuccess(false), 4000);
    },
  });

  // ── Delete image mutation ──
  const deleteImageMutation = useMutation({
    mutationFn: ({ vehicleId, mediaId }: { vehicleId: number; mediaId: number }) =>
      deleteVehicleImageApi(vehicleId, mediaId),
    onSuccess: (_, { mediaId }) => {
      setExistingImages((p) => p.filter((img) => img.id !== mediaId));
    },
  });

  // ── Delete vehicle mutation ──
  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      const { default: api } = await import("../../api/client");
      await api.delete(`/vehicles/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVehicles"] });
      navigate("/admin/vehicles", { state: { deleted: true } });
    },
  });

  // ── Handlers ──
  function handleChange(field: keyof VehicleFormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as keyof VehicleFormErrors])
      setErrors((p) => ({ ...p, [field]: undefined }));
    setSaveSuccess(false);
  }

  function handleSubmit() {
    const errs = validateVehicleForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    updateMutation.mutate();
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <AdminLayout
        title="Chỉnh sửa xe"
        breadcrumb={[
          { label: "Quản lý xe", to: "/admin/vehicles" },
          { label: "Chỉnh sửa" },
        ]}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  // ── Not found ──
  if (loadError || !data) {
    return (
      <AdminLayout
        title="Không tìm thấy xe"
        breadcrumb={[
          { label: "Quản lý xe", to: "/admin/vehicles" },
          { label: "Lỗi" },
        ]}
      >
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Không tìm thấy xe
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Xe có ID <strong>#{id}</strong> không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            to="/admin/vehicles"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Quay lại danh sách xe
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`${data.brand} ${data.model}`}
      breadcrumb={[
        { label: "Quản lý xe", to: "/admin/vehicles" },
        { label: `${data.brand} ${data.model} ${data.year ?? ""}`.trim() },
      ]}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
            <Pencil size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {data.brand} {data.model} {data.year}
            </h1>
            <p className="text-sm text-gray-500">
              VIN: {data.vin} · ID #{id} · Chỉnh sửa thông tin xe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/vehicles/${id}`}
            target="_blank"
            className="flex items-center gap-2 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Eye size={15} /> Xem trang xe
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Trash2 size={15} /> Xóa xe
          </button>
        </div>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-5">
          <CheckCircle size={18} className="shrink-0" />
          <span>
            {justCreated
              ? `🎉 Xe ${data.brand} ${data.model} đã được tạo thành công!`
              : "Thông tin xe đã được cập nhật thành công."}
          </span>
        </div>
      )}

      <VehicleForm
        form={form}
        errors={errors}
        newImages={newImages}
        existingImages={existingImages}
        isPending={updateMutation.isPending}
        isError={updateMutation.isError}
        errorMessage={
          updateMutation.isError
            ? (updateMutation.error as Error)?.message
            : undefined
        }
        submitLabel="Lưu thay đổi"
        onChange={handleChange}
        onAddImages={(files) => setNewImages((p) => [...p, ...files])}
        onRemoveNewImage={(i) => setNewImages((p) => p.filter((_, idx) => idx !== i))}
        onRemoveExistingImage={(mediaId) =>
          deleteImageMutation.mutate({ vehicleId: Number(id), mediaId })
        }
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/vehicles")}
      />

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Xóa xe này?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Xe <strong>{data.brand} {data.model} {data.year}</strong> sẽ bị
                xóa vĩnh viễn cùng toàn bộ hình ảnh và dữ liệu liên quan.
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-xs text-red-600 font-medium">
                ⚠️ Hành động này không thể hoàn tác
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => deleteVehicleMutation.mutate()}
                disabled={deleteVehicleMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleteVehicleMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Trash2 size={15} /> Xác nhận xóa</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}