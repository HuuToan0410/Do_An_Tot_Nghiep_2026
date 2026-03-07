from django.db import transaction
from vehicles.models import VehicleUnit, VehicleStatusLog


class VehicleStatusService:
    """
    Service quản lý thay đổi trạng thái xe.

    Chức năng:
    - Kiểm tra trạng thái hợp lệ
    - Cập nhật trạng thái xe
    - Ghi log lịch sử trạng thái
    """

    # Quy định luồng trạng thái hợp lệ
    ALLOWED_TRANSITIONS = {
        VehicleUnit.Status.MOI_NHAP: [VehicleUnit.Status.CHO_KIEM_DINH],
        VehicleUnit.Status.CHO_KIEM_DINH: [VehicleUnit.Status.DA_KIEM_DINH],
        VehicleUnit.Status.DA_KIEM_DINH: [VehicleUnit.Status.SAN_SANG_BAN],
        VehicleUnit.Status.SAN_SANG_BAN: [VehicleUnit.Status.DANG_BAN],
        VehicleUnit.Status.DANG_BAN: [VehicleUnit.Status.DA_BAN],
    }

    @classmethod
    def change_status(cls, vehicle: VehicleUnit, new_status: str, user, note: str = ""):
        """
        Thay đổi trạng thái xe và ghi log.

        Args:
            vehicle: đối tượng VehicleUnit
            new_status: trạng thái mới
            user: người thực hiện thay đổi
            note: ghi chú

        Returns:
            VehicleUnit

        Raises:
            ValueError nếu trạng thái không hợp lệ
        """

        old_status = vehicle.status

        # Nếu trạng thái giống nhau thì không làm gì
        if old_status == new_status:
            return vehicle

        # Kiểm tra chuyển trạng thái hợp lệ
        allowed = cls.ALLOWED_TRANSITIONS.get(old_status, [])

        if new_status not in allowed:
            raise ValueError(
                f"Không thể chuyển trạng thái từ {old_status} sang {new_status}"
            )

        # Transaction đảm bảo tính toàn vẹn dữ liệu
        with transaction.atomic():

            vehicle.status = new_status
            vehicle.save(update_fields=["status", "updated_at"])

            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status=new_status,
                changed_by=user,
                note=note,
            )

        return vehicle
