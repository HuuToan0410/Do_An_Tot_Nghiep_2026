# ================================================================
# sales/audit_mixin.py
# Mixin tự động ghi AuditLog khi Create / Update / Delete
# Thêm vào các View quan trọng bằng cách kế thừa AuditLogMixin
# ================================================================

import json
from django.utils import timezone
from sales.models import AuditLog


def _get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _serialize_instance(instance):
    """Chuyển model instance thành dict đơn giản để lưu vào JSON."""
    from django.forms.models import model_to_dict
    try:
        data = {}
        for field in instance._meta.fields:
            val = getattr(instance, field.name, None)
            if hasattr(val, "pk"):        # FK → lấy pk
                data[field.name] = val.pk
            elif hasattr(val, "isoformat"):  # datetime
                data[field.name] = val.isoformat()
            else:
                data[field.name] = val
        return data
    except Exception:
        return {}


def log_action(user, action, model_name, object_id, description,
               old_value=None, new_value=None, request=None):
    """
    Helper ghi AuditLog thủ công.
    Ví dụ:
        log_action(
            user=request.user,
            action="STATUS_CHANGE",
            model_name="VehicleUnit",
            object_id=vehicle.id,
            description=f"Chuyển xe #{vehicle.id} sang LISTED",
            old_value={"status": "READY_FOR_SALE"},
            new_value={"status": "LISTED"},
            request=request,
        )
    """
    ip = _get_client_ip(request) if request else None
    try:
        AuditLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            action=action,
            model_name=model_name,
            object_id=object_id,
            description=description,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip,
        )
    except Exception as e:
        # Không để lỗi log làm hỏng transaction chính
        import logging
        logging.getLogger("audit").warning(f"Failed to write audit log: {e}")


class AuditLogMixin:
    """
    Mixin cho DRF APIView / GenericAPIView.
    Ghi log tự động sau CREATE / UPDATE / DELETE.

    Cách dùng:
        class VehicleAdminDetailView(AuditLogMixin, generics.RetrieveUpdateDestroyAPIView):
            audit_model_name = "VehicleUnit"
            audit_description_field = "display_name"  # field để lấy tên mô tả
    """

    # Tên model hiển thị trong log
    audit_model_name: str = ""
    # Field của object dùng để mô tả (vd: "display_name", "name", "__str__")
    audit_description_field: str = "__str__"

    def _get_description(self, instance, action):
        try:
            name = getattr(instance, self.audit_description_field, None)
            if callable(name):
                name = name()
            name = name or str(instance)
        except Exception:
            name = f"ID #{instance.pk}"

        model = self.audit_model_name or instance.__class__.__name__
        action_labels = {
            "CREATE": "Tạo mới",
            "UPDATE": "Cập nhật",
            "DELETE": "Xóa",
            "STATUS_CHANGE": "Đổi trạng thái",
            "APPROVE": "Phê duyệt",
            "REJECT": "Từ chối",
        }
        label = action_labels.get(action, action)
        return f"{label} {model}: {name}"

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(
            user=self.request.user,
            action="CREATE",
            model_name=self.audit_model_name or instance.__class__.__name__,
            object_id=instance.pk,
            description=self._get_description(instance, "CREATE"),
            old_value=None,
            new_value=_serialize_instance(instance),
            request=self.request,
        )

    def perform_update(self, serializer):
        # Lưu snapshot trước khi cập nhật
        instance = serializer.instance
        old_snapshot = _serialize_instance(instance)
        instance = serializer.save()
        new_snapshot = _serialize_instance(instance)
        # Chỉ lưu những field thay đổi
        changed_old = {k: v for k, v in old_snapshot.items() if new_snapshot.get(k) != v}
        changed_new = {k: new_snapshot[k] for k in changed_old}
        log_action(
            user=self.request.user,
            action="UPDATE",
            model_name=self.audit_model_name or instance.__class__.__name__,
            object_id=instance.pk,
            description=self._get_description(instance, "UPDATE"),
            old_value=changed_old or None,
            new_value=changed_new or None,
            request=self.request,
        )

    def perform_destroy(self, instance):
        snapshot = _serialize_instance(instance)
        description = self._get_description(instance, "DELETE")
        model_name = self.audit_model_name or instance.__class__.__name__
        obj_id = instance.pk
        instance.delete()
        log_action(
            user=self.request.user,
            action="DELETE",
            model_name=model_name,
            object_id=obj_id,
            description=description,
            old_value=snapshot,
            new_value=None,
            request=self.request,
        )


# ================================================================
# Áp dụng AuditLogMixin vào các View chính
# Chỉ cần thêm mixin vào class + đặt audit_model_name
# ================================================================

# --- vehicles/views.py ---
