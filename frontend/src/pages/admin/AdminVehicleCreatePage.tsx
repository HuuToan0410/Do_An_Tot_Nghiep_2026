import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import VehicleForm from "../../layouts/VehicleForm";
import {
  EMPTY_VEHICLE_FORM,
  validateVehicleForm,
  createVehicleApi,
  uploadVehicleMedia,
  type VehicleFormData,
  type VehicleFormErrors,
} from "../../api/vehicles";

export default function AdminVehicleCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<VehicleFormData>(EMPTY_VEHICLE_FORM);
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [newImages, setNewImages] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Bước 1: Tạo xe với JSON
      const vehicle = await createVehicleApi(form); // ← truyền form trực tiếp

      // Bước 2: Upload ảnh riêng nếu có
      if (newImages.length > 0 && vehicle.id) {
        await uploadVehicleMedia(vehicle.id, newImages);
      }

      return vehicle;
    },
    onSuccess: (data) => {
      navigate(`/admin/vehicles/${data.id}/edit`, {
        state: { created: true },
      });
    },
  });

  function handleChange(field: keyof VehicleFormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as keyof VehicleFormErrors])
      setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function handleAddImages(files: File[]) {
    setNewImages((p) => [...p, ...files]);
  }

  function handleRemoveNewImage(index: number) {
    setNewImages((p) => p.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const errs = validateVehicleForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    mutation.mutate();
  }

  return (
    <AdminLayout
      title="Thêm xe mới"
      breadcrumb={[
        { label: "Quản lý xe", to: "/admin/vehicles" },
        { label: "Thêm xe mới" },
      ]}
    >
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
          <Plus size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Thêm xe mới</h1>
          <p className="text-sm text-gray-500">
            Điền đầy đủ thông tin để đăng xe lên hệ thống
          </p>
        </div>
      </div>

      <VehicleForm
        form={form}
        errors={errors}
        newImages={newImages}
        isPending={mutation.isPending}
        isError={mutation.isError}
        errorMessage={
          mutation.isError ? (mutation.error as Error)?.message : undefined
        }
        submitLabel="Thêm xe"
        onChange={handleChange}
        onAddImages={handleAddImages}
        onRemoveNewImage={handleRemoveNewImage}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/vehicles")}
      />
    </AdminLayout>
  );
}
