from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend

from .models import VehicleUnit, VehicleStatusLog
from .serializers import VehicleSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


@method_decorator(cache_page(60 * 5), name="dispatch")
class VehicleViewSet(ModelViewSet):
    """
    API quản lý xe trong hệ thống.

    Chức năng chính:
    - Tạo xe mới
    - Xem danh sách xe
    - Xem chi tiết xe
    - Cập nhật thông tin xe
    - Xóa xe
    - Tìm kiếm xe
    - Lọc dữ liệu xe
    - Sắp xếp danh sách xe

    API này phục vụ cho:
    - quản lý xe nội bộ
    - hệ thống bán xe
    """

    permission_classes = [IsAuthenticated]

    serializer_class = VehicleSerializer

    # -------------------------
    # Queryset tối ưu
    # -------------------------

    queryset = (
        VehicleUnit.objects.select_related(
            "created_by", "spec"
        )  # quan hệ 1-1 / foreign key
        .prefetch_related("media")  # quan hệ nhiều
        .all()
    )

    # -------------------------
    # Filter backend
    # -------------------------

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    # -------------------------
    # Bộ lọc dữ liệu
    # -------------------------

    filterset_fields = [
        "brand",
        "fuel_type",
        "transmission",
        "status",
        "year",
        "color",
    ]

    # -------------------------
    # Tìm kiếm
    # -------------------------

    search_fields = [
        "brand",
        "model",
        "vin",
    ]

    # -------------------------
    # Sắp xếp
    # -------------------------

    ordering_fields = [
        "sale_price",
        "year",
        "mileage",
        "created_at",
    ]

    ordering = ["-created_at"]

    # ---------------------------------------------------
    # Ghi nhận người tạo xe
    # ---------------------------------------------------

    def perform_create(self, serializer):
        """
        Khi tạo xe mới:
        - tự động ghi người tạo
        """

        serializer.save(created_by=self.request.user)

    # ---------------------------------------------------
    # Ghi log khi thay đổi trạng thái xe
    # ---------------------------------------------------

    def perform_update(self, serializer):
        """
        Khi cập nhật xe:
        - nếu trạng thái thay đổi
        - ghi log lịch sử trạng thái
        """

        vehicle_cu = self.get_object()

        trang_thai_cu = vehicle_cu.status

        vehicle_moi = serializer.save()

        if trang_thai_cu != vehicle_moi.status:

            VehicleStatusLog.objects.create(
                vehicle=vehicle_moi,
                old_status=trang_thai_cu,
                new_status=vehicle_moi.status,
                changed_by=self.request.user,
                note="Thay đổi trạng thái xe",
            )
