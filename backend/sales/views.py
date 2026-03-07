from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import SalesOrder, Listing
from .serializers import SalesOrderSerializer, ListingSerializer


class SalesOrderViewSet(viewsets.ModelViewSet):
    """
    API quản lý giao dịch bán xe.

    Chức năng chính:
    - Tạo đơn bán xe
    - Xem danh sách giao dịch
    - Xem chi tiết giao dịch
    - Cập nhật thông tin giao dịch
    """

    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Lấy danh sách đơn bán xe.

        Tối ưu truy vấn bằng select_related
        để giảm số lượng query tới database.
        """

        return SalesOrder.objects.select_related("vehicle", "customer").order_by(
            "-sold_at"
        )


class ListingViewSet(viewsets.ModelViewSet):
    """
    API quản lý bài đăng bán xe.

    Chức năng:
    - CRUD bài đăng
    - Tìm kiếm xe
    - Lọc theo hãng xe / model / giá
    - Sắp xếp kết quả
    - Tăng lượt xem khi xem chi tiết
    - Lấy danh sách xe mới nhất
    - Lấy danh sách xe được xem nhiều
    """

    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Bộ lọc dữ liệu
    filterset_fields = ["vehicle__brand", "vehicle__model", "listed_price"]

    # Tìm kiếm
    search_fields = ["title", "vehicle__brand", "vehicle__model"]

    # Cho phép sắp xếp
    ordering_fields = ["listed_price", "views_count", "created_at"]

    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Chỉ lấy các bài đăng đang hiển thị.

        select_related giúp giảm số lượng query
        khi lấy thông tin xe liên quan.
        """

        return Listing.objects.filter(is_active=True).select_related("vehicle")

    def retrieve(self, request, *args, **kwargs):
        """
        Xem chi tiết bài đăng.

        Khi người dùng xem chi tiết,
        hệ thống tự động tăng lượt xem.
        """

        instance = self.get_object()

        Listing.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)

        serializer = self.get_serializer(instance)

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def xe_moi_nhat(self, request):
        """
        Lấy 10 xe mới đăng gần nhất.
        """

        queryset = self.get_queryset().order_by("-created_at")[:10]

        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def xe_xem_nhieu(self, request):
        """
        Lấy 10 xe có lượt xem cao nhất.
        """

        queryset = self.get_queryset().order_by("-views_count")[:10]

        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)
