from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from vehicles.models import VehicleStatusLog


class VehicleLifecycleAPI(APIView):
    """
    API trả về lịch sử thay đổi trạng thái của một xe.

    Mục đích:
    - Phân tích vòng đời xe
    - Theo dõi lịch sử xử lý
    - Hiển thị timeline trong dashboard quản trị
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, vehicle_id):
        """
        Lấy lịch sử trạng thái của xe theo vehicle_id
        """

        logs = (
            VehicleStatusLog.objects.filter(vehicle_id=vehicle_id)
            .select_related("changed_by")
            .values(
                "old_status",
                "new_status",
                "changed_at",
                "changed_by__username",
                "note",
            )
            .order_by("changed_at")
        )

        data = [
            {
                "trang_thai_cu": log["old_status"],
                "trang_thai_moi": log["new_status"],
                "thoi_diem_thay_doi": log["changed_at"],
                "nguoi_thuc_hien": log["changed_by__username"],
                "ghi_chu": log["note"],
            }
            for log in logs
        ]

        return Response(
            {
                "xe_id": vehicle_id,
                "so_lan_thay_doi": len(data),
                "lich_su_trang_thai": data,
            }
        )
