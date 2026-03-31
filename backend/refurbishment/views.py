# refurbishment/views.py
from datetime import date

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from refurbishment.models import RefurbishmentItem, RefurbishmentOrder
from refurbishment.permissions import (
    CanCancelRefurbishment,
    CanCompleteRefurbishment,
    CanCreateRefurbishment,
    CanEditRefurbishment,
    CanManageRefurbishmentItem,
    CanViewRefurbishment,
)
from refurbishment.serializers import (
    RefurbishmentCreateSerializer,
    RefurbishmentDetailSerializer,
    RefurbishmentItemSerializer,
    RefurbishmentListSerializer,
)
from vehicles.models import VehicleStatusLog

import logging


class RefurbishmentListView(generics.ListAPIView):
    """Danh sách lệnh tân trang — nhân viên nội bộ"""

    serializer_class = RefurbishmentListSerializer
    permission_classes = [CanViewRefurbishment]

    def get_queryset(self):
        logger = logging.getLogger(__name__)

        try:

            qs = RefurbishmentOrder.objects.select_related("vehicle", "technician")
            vehicle_id = self.request.query_params.get("vehicle")
            status_val = self.request.query_params.get("status")
            search = self.request.query_params.get("search")
            if vehicle_id:
                qs = qs.filter(vehicle_id=vehicle_id)
            if status_val:
                qs = qs.filter(status=status_val)
            if search:
                qs = qs.filter(vehicle__brand__icontains=search) | qs.filter(
                    vehicle__model__icontains=search
                )
            return qs.order_by("-created_at")
        except Exception as e:
            logger.exception("ERROR in get_queryset")
            raise


class RefurbishmentCreateView(generics.CreateAPIView):
    """
    Tạo lệnh tân trang mới — kỹ thuật viên tân trang, admin.
    Xe phải ở trạng thái WAIT_REFURBISH hoặc REFURBISHING.
    """

    serializer_class = RefurbishmentCreateSerializer
    permission_classes = [CanCreateRefurbishment]


class RefurbishmentDetailView(generics.RetrieveUpdateAPIView):
    """
    Chi tiết lệnh tân trang:
    - GET : nhân viên nội bộ
    - PUT / PATCH : kỹ thuật viên, admin — chặn nếu lệnh đã xong hoặc bị hủy
    """

    serializer_class = RefurbishmentDetailSerializer
    permission_classes = [CanEditRefurbishment]
    queryset = RefurbishmentOrder.objects.prefetch_related("items")

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj


class RefurbishmentItemView(APIView):
    """
    Thêm hạng mục tân trang vào lệnh.
    Chặn thêm nếu lệnh đã COMPLETED hoặc CANCELLED.
    """

    permission_classes = [CanManageRefurbishmentItem]

    def post(self, request, pk):
        order = generics.get_object_or_404(RefurbishmentOrder, pk=pk)

        if order.status in [
            RefurbishmentOrder.Status.COMPLETED,
            RefurbishmentOrder.Status.CANCELLED,
        ]:
            return Response(
                {"detail": "Lệnh tân trang đã kết thúc, không thể thêm hạng mục."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RefurbishmentItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(order=order)

        return Response(
            RefurbishmentItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class RefurbishmentItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Xem / cập nhật / xóa hạng mục tân trang.
    Chặn thao tác nếu lệnh cha đã hoàn thành hoặc bị hủy.
    """

    serializer_class = RefurbishmentItemSerializer
    permission_classes = [CanManageRefurbishmentItem]
    queryset = RefurbishmentItem.objects.select_related("order")

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj


class RefurbishmentCompleteView(APIView):
    """
    Nghiệm thu lệnh tân trang:
    - Cập nhật trạng thái lệnh → COMPLETED
    - Tự động chuyển trạng thái xe → READY_FOR_SALE
    - Ghi VehicleStatusLog
    - Trả về tổng chi phí tân trang
    """

    permission_classes = [CanCompleteRefurbishment]

    def post(self, request, pk):
        order = generics.get_object_or_404(
            RefurbishmentOrder.objects.select_related("vehicle"),
            pk=pk,
        )

        # Object-level permission (người được giao hoặc admin)
        self.check_object_permissions(request, order)

        if order.status == RefurbishmentOrder.Status.COMPLETED:
            return Response(
                {"detail": "Lệnh tân trang đã hoàn thành trước đó."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == RefurbishmentOrder.Status.CANCELLED:
            return Response(
                {"detail": "Lệnh tân trang đã bị hủy, không thể nghiệm thu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not order.items.exists():
            return Response(
                {"detail": "Lệnh tân trang chưa có hạng mục nào."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Hoàn thành lệnh tân trang ──────────────────────────
        order.status = RefurbishmentOrder.Status.COMPLETED
        order.completed_date = timezone.now().date()
        order.approved_by = request.user
        order.save(
            update_fields=["status", "completed_date", "approved_by", "updated_at"]
        )

        # ── Tự động chuyển trạng thái xe → READY_FOR_SALE ──────
        vehicle = order.vehicle
        if vehicle.status == "REFURBISHING":
            old_status = vehicle.status
            vehicle.status = "READY_FOR_SALE"
            vehicle.save(update_fields=["status", "updated_at"])

            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status="READY_FOR_SALE",
                changed_by=request.user,
                note=f"Tự động sau khi hoàn thành tân trang (lệnh #{order.id})",
            )

        return Response(
            {
                "message": "Nghiệm thu lệnh tân trang thành công.",
                "total_cost": str(order.total_cost),
                "vehicle_status": vehicle.status,
            }
        )


class RefurbishmentCancelView(APIView):
    """
    Hủy lệnh tân trang — chỉ admin.
    POST body: { "reason": "lý do hủy" }
    """

    permission_classes = [CanCancelRefurbishment]

    def post(self, request, pk):
        order = generics.get_object_or_404(RefurbishmentOrder, pk=pk)
        reason = request.data.get("reason", "")

        if order.status == RefurbishmentOrder.Status.COMPLETED:
            return Response(
                {"detail": "Không thể hủy lệnh tân trang đã hoàn thành."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == RefurbishmentOrder.Status.CANCELLED:
            return Response(
                {"detail": "Lệnh tân trang đã bị hủy trước đó."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = RefurbishmentOrder.Status.CANCELLED
        if reason:
            order.note = f"[Hủy] {reason}\n{order.note}".strip()
        order.save(update_fields=["status", "note", "updated_at"])

        return Response({"message": "Đã hủy lệnh tân trang."})


class RefurbishmentStartView(APIView):
    """
    Bắt đầu tân trang:
    - Chuyển order → IN_PROGRESS
    - Chuyển vehicle → REFURBISHING
    """

    permission_classes = [CanEditRefurbishment]

    def post(self, request, pk):
        order = generics.get_object_or_404(
            RefurbishmentOrder.objects.select_related("vehicle"),
            pk=pk,
        )

        self.check_object_permissions(request, order)

        if order.status != RefurbishmentOrder.Status.PENDING:
            return Response(
                {"detail": "Chỉ có thể bắt đầu từ trạng thái chờ xử lý."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # update order
        order.status = RefurbishmentOrder.Status.IN_PROGRESS
        order.start_date = timezone.now().date()
        order.save(update_fields=["status", "start_date", "updated_at"])

        # update vehicle
        vehicle = order.vehicle
        old_status = vehicle.status
        vehicle.status = "REFURBISHING"
        vehicle.save(update_fields=["status", "updated_at"])

        VehicleStatusLog.objects.create(
            vehicle=vehicle,
            old_status=old_status,
            new_status="REFURBISHING",
            changed_by=request.user,
            note=f"Bắt đầu tân trang (lệnh #{order.id})",
        )

        return Response({"message": "Đã bắt đầu tân trang."})
