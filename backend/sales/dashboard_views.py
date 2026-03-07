from django.db.models import Count, Sum, Q
from rest_framework.views import APIView
from rest_framework.response import Response

from vehicles.models import VehicleUnit
from sales.models import SalesOrder
from refurbishment.models import RefurbishmentOrder


class DashboardOverviewAPI(APIView):
    """
    API tổng quan hệ thống.

    Trả về các thông tin chính phục vụ dashboard quản trị:
    - Tổng số xe trong hệ thống
    - Số xe đang đăng bán
    - Số xe đã bán
    - Số xe đang sửa chữa
    - Tổng doanh thu bán xe
    """

    def get(self, request):

        # ==============================
        # Thống kê xe trong hệ thống
        # ==============================

        vehicle_stats = VehicleUnit.objects.aggregate(
            tong_xe=Count("id"),
            xe_dang_ban=Count("id", filter=Q(status=VehicleUnit.Status.DANG_BAN)),
            xe_da_ban=Count("id", filter=Q(status=VehicleUnit.Status.DA_BAN)),
        )

        # ==============================
        # Xe đang sửa chữa
        # ==============================

        dang_sua = RefurbishmentOrder.objects.filter(
            status=RefurbishmentOrder.Status.IN_PROGRESS
        ).count()

        # ==============================
        # Tổng doanh thu
        # ==============================

        doanh_thu = (
            SalesOrder.objects.aggregate(tong_doanh_thu=Sum("sale_price"))[
                "tong_doanh_thu"
            ]
            or 0
        )

        # ==============================
        # Kết quả trả về
        # ==============================

        data = {
            "tong_so_xe": vehicle_stats["tong_xe"],
            "xe_dang_ban": vehicle_stats["xe_dang_ban"],
            "xe_da_ban": vehicle_stats["xe_da_ban"],
            "xe_dang_sua": dang_sua,
            "tong_doanh_thu": doanh_thu,
        }

        return Response(data)
