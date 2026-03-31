"""
Signal tự động cập nhật trạng thái xe
khi một phiếu kiểm định được hoàn thành.

Luồng:
    Inspection → status = COMPLETED
        ↓
    VehicleUnit → status = INSPECTED
        ↓
    VehicleStatusLog (ghi lịch sử)
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from inspections.models import Inspection
from vehicles.models import VehicleUnit, VehicleStatusLog


@receiver(post_save, sender=Inspection)
def auto_update_vehicle_status_on_inspection_complete(
    sender, instance: Inspection, **kwargs
):
    """
    Khi Inspection.status → COMPLETED:
    - Chuyển VehicleUnit.status → INSPECTED (nếu đang ở INSPECTING)
    - Ghi VehicleStatusLog
    """
    if instance.status != "COMPLETED":
        return

    vehicle: VehicleUnit = instance.vehicle

    # Chỉ chuyển nếu xe đang ở trạng thái INSPECTING
    if vehicle.status != "INSPECTING":
        return

    old_status = vehicle.status
    vehicle.status = "INSPECTED"
    vehicle.save(update_fields=["status", "updated_at"])

    VehicleStatusLog.objects.create(
        vehicle=vehicle,
        old_status=old_status,
        new_status="INSPECTED",
        changed_by=instance.inspector,  # có thể None nếu chưa assign
        note=f"Tự động cập nhật sau khi hoàn thành kiểm định #{instance.id}",
    )
