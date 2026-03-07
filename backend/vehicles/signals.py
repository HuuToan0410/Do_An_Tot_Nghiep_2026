"""
Signal tự động cập nhật trạng thái xe
khi một phiên kiểm định được hoàn thành.

Luồng nghiệp vụ:

Inspection COMPLETED
        ↓
Vehicle.status = INSPECTED
        ↓
Ghi lịch sử thay đổi trạng thái (VehicleStatusLog)
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from inspections.models import Inspection
from vehicles.models import VehicleUnit, VehicleStatusLog


@receiver(post_save, sender=Inspection)
def cap_nhat_trang_thai_xe_sau_kiem_dinh(sender, instance, created, **kwargs):
    """
    Tự động cập nhật trạng thái xe khi kiểm định hoàn thành.

    Điều kiện kích hoạt:
    - Inspection.status = COMPLETED
    - Trạng thái xe hiện tại chưa phải INSPECTED

    Mục tiêu:
    - Tránh save database không cần thiết
    - Ghi lại lịch sử trạng thái
    """

    # Chỉ xử lý khi kiểm định đã hoàn thành
    if instance.status != Inspection.Status.HOAN_THANH:
        return

    vehicle = instance.vehicle

    # Nếu xe đã ở trạng thái "Đã kiểm định" thì bỏ qua
    if vehicle.status == VehicleUnit.Status.DA_KIEM_DINH:
        return

    old_status = vehicle.status

    # Cập nhật trạng thái xe
    vehicle.status = VehicleUnit.Status.DA_KIEM_DINH

    # Chỉ update field cần thiết để giảm tải database
    vehicle.save(update_fields=["status", "updated_at"])

    # Ghi log thay đổi trạng thái
    VehicleStatusLog.objects.create(
        vehicle=vehicle,
        old_status=old_status,
        new_status=VehicleUnit.Status.DA_KIEM_DINH,
        changed_by=instance.inspector,
        note="Xe đã hoàn thành kiểm định",
    )
