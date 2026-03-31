from django.db import transaction

from vehicles.models import VehicleUnit, VehicleStatusLog


# ── Workflow transition map ────────────────────────────────────
# Khớp với WORKFLOW_TRANSITIONS trong api/workflow.ts
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "PURCHASED":       ["WAIT_INSPECTION"],
    "WAIT_INSPECTION": ["INSPECTING"],
    "INSPECTING":      ["INSPECTED", "WAIT_INSPECTION"],   # có thể trả lại
    "INSPECTED":       ["WAIT_REFURBISH", "READY_FOR_SALE"],
    "WAIT_REFURBISH":  ["REFURBISHING"],
    "REFURBISHING":    ["READY_FOR_SALE"],
    "READY_FOR_SALE":  ["LISTED"],
    "LISTED":          ["RESERVED", "READY_FOR_SALE"],     # có thể hủy đăng
    "RESERVED":        ["SOLD", "LISTED"],                 # hủy cọc → về LISTED
    "SOLD":            ["WARRANTY"],
    "WARRANTY":        [],
}

# Role nào được phép thực hiện transition nào (tùy chỉnh theo yêu cầu)
ROLE_ALLOWED_FROM: dict[str, list[str]] = {
    "PURCHASING":  ["PURCHASED"],
    "INSPECTOR":   ["WAIT_INSPECTION", "INSPECTING"],
    "TECHNICIAN":  ["WAIT_REFURBISH", "REFURBISHING"],
    "PRICING":     ["INSPECTED"],
    "SALES":       ["READY_FOR_SALE", "LISTED", "RESERVED", "SOLD"],
    "ADMIN":       list(ALLOWED_TRANSITIONS.keys()),       # admin được tất cả
}


class VehicleStatusService:
    """
    Service duy nhất xử lý chuyển trạng thái xe.
    Đảm bảo toàn vẹn dữ liệu và ghi log đầy đủ.
    """

    @classmethod
    def can_transition(cls, user, from_status: str, to_status: str) -> bool:
        """Kiểm tra user có quyền thực hiện transition này không."""
        role = getattr(user, "role", "ADMIN")
        allowed_from = ROLE_ALLOWED_FROM.get(role, [])

        # Admin bypass role check
        if role == "ADMIN":
            return to_status in ALLOWED_TRANSITIONS.get(from_status, [])

        if from_status not in allowed_from:
            return False
        return to_status in ALLOWED_TRANSITIONS.get(from_status, [])

    @classmethod
    def change_status(
        cls,
        vehicle: VehicleUnit,
        new_status: str,
        user,
        note: str = "",
    ) -> VehicleUnit:
        """
        Chuyển trạng thái xe + ghi VehicleStatusLog.

        Raises:
            ValueError: nếu transition không hợp lệ
            PermissionError: nếu user không có quyền
        """
        old_status = vehicle.status

        if old_status == new_status:
            return vehicle

        # Kiểm tra workflow
        if new_status not in ALLOWED_TRANSITIONS.get(old_status, []):
            raise ValueError(
                f"Không thể chuyển trạng thái từ '{old_status}' sang '{new_status}'."
            )

        # Kiểm tra role
        if not cls.can_transition(user, old_status, new_status):
            raise PermissionError(
                f"Bạn không có quyền thực hiện thao tác này."
            )

        with transaction.atomic():
            vehicle.status = new_status
            vehicle.save(update_fields=["status", "updated_at"])

            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status=new_status,
                changed_by=user,
                note=note or "",
            )

        return vehicle