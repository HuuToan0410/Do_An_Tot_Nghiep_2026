from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Inspection
from .serializers import InspectionSerializer
from .permissions import LaNhanVienKiemDinh


class InspectionViewSet(viewsets.ModelViewSet):
    """
    API quản lý phiên kiểm định xe.
    """

    serializer_class = InspectionSerializer
    permission_classes = [LaNhanVienKiemDinh]

    queryset = (
        Inspection.objects.select_related("vehicle", "inspector")
        .prefetch_related("items")
        .all()
    )

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "inspection_date",
        "vehicle",
        "inspector",
    ]

    search_fields = [
        "vehicle__vin",
        "vehicle__brand",
        "vehicle__model",
    ]

    ordering_fields = [
        "created_at",
        "inspection_date",
        "overall_score",
    ]

    ordering = ["-created_at"]

    def perform_create(self, serializer):
        """
        Tự động gán người kiểm định.
        """
        serializer.save(inspector=self.request.user)

    def perform_destroy(self, instance):
        """
        Không cho xóa kiểm định đã hoàn thành.
        """
        if instance.status == "COMPLETED":
            raise ValidationError("Không thể xóa kiểm định đã hoàn thành.")

        instance.delete()
