from django.db.models import Sum
from django.db.models.functions import TruncMonth

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import SalesOrder


class RevenueByMonthAPI(APIView):
    """
    API thống kê doanh thu theo tháng.

    Mục đích:
    - phục vụ dashboard quản trị
    - hiển thị biểu đồ doanh thu
    - phân tích kinh doanh theo thời gian
    """

    def get(self, request):
        """
        Trả về danh sách doanh thu theo từng tháng.
        """

        doanh_thu_theo_thang = (
            SalesOrder.objects.only("sale_price", "sold_at")  # chỉ load field cần thiết
            .annotate(thang=TruncMonth("sold_at"))
            .values("thang")
            .annotate(tong_doanh_thu=Sum("sale_price"))
            .order_by("thang")
        )

        return Response({"thong_ke_doanh_thu": list(doanh_thu_theo_thang)})
