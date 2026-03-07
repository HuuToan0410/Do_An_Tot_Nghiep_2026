from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import RefurbishmentOrder
from .serializers import RefurbishmentOrderSerializer
from .permissions import IsTechnicianOrAdmin


class RefurbishmentViewSet(viewsets.ModelViewSet):
    """
    API quản lý lệnh sửa chữa / tân trang xe.

    Chức năng chính:
    - Tạo lệnh sửa chữa
    - Xem danh sách lệnh
    - Cập nhật trạng thái sửa chữa
    - Phân công kỹ thuật viên
    """

    serializer_class = RefurbishmentOrderSerializer

    permission_classes = [
        IsAuthenticated,
        IsTechnicianOrAdmin,
    ]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = [
        "status",
        "vehicle",
        "technician",
    ]

    def get_queryset(self):
        """
        Tối ưu query database.

        select_related:
        giảm số lượng query khi lấy vehicle và technician

        prefetch_related:
        load danh sách items một lần
        """

        return (
            RefurbishmentOrder.objects.select_related("vehicle", "technician")
            .prefetch_related("items")
            .all()
        )

    def perform_create(self, serializer):
        """
        Khi tạo lệnh sửa chữa.
        """

        serializer.save()

    def perform_update(self, serializer):
        """
        Khi cập nhật lệnh sửa chữa.
        """

        serializer.save()
