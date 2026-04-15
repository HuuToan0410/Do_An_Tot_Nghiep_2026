from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from sales.audit_mixin import AuditLogMixin, log_action
from inspections.models import Inspection, InspectionCategory, InspectionItem
from inspections.permissions import (
    CanCompleteInspection,
    CanCreateInspection,
    CanEditInspection,
    CanManageInspectionItem,
    CanPublishInspection,
    CanViewInspection,
)
from inspections.serializers import (
    InspectionCategorySerializer,
    InspectionCreateSerializer,
    InspectionDetailSerializer,
    InspectionItemCreateSerializer,
    InspectionItemSerializer,
    InspectionListSerializer,
    InspectionPublicSerializer,
)


class InspectionCategoryListView(generics.ListCreateAPIView):
    """Danh mục kiểm định — nhân viên nội bộ"""

    serializer_class = InspectionCategorySerializer
    permission_classes = [CanCreateInspection]
    queryset = InspectionCategory.objects.all()


class InspectionListView(AuditLogMixin, generics.ListCreateAPIView):
    """
    GET  /api/inspections/   — danh sách (admin/inspector)
    POST /api/inspections/   — tạo phiếu mới
    """

    permission_classes = [permissions.IsAuthenticated]
    audit_model_name = "Inspection"

    def get_serializer_class(self):
        if self.request.method == "POST":
            return InspectionCreateSerializer
        return InspectionListSerializer

    def get_queryset(self):
        qs = (
            Inspection.objects.select_related("vehicle", "inspector")
            .prefetch_related("items__category")  # BẮT BUỘC để tính điểm
            .order_by("-created_at")
        )

        vehicle_id = self.request.query_params.get("vehicle")
        status_val = self.request.query_params.get("status")
        search = self.request.query_params.get("search", "").strip()

        if vehicle_id:
            qs = qs.filter(vehicle_id=vehicle_id)
        if status_val:
            qs = qs.filter(status=status_val)
        if search:
            qs = qs.filter(
                Q(vehicle__brand__icontains=search)
                | Q(vehicle__model__icontains=search)
                | Q(inspector__first_name__icontains=search)
                | Q(inspector__last_name__icontains=search)
                | Q(inspector__phone__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(inspector=self.request.user)


class InspectionCreateView(generics.CreateAPIView):
    """Tạo phiếu kiểm định mới — kỹ thuật viên kiểm định"""

    serializer_class = InspectionCreateSerializer
    permission_classes = [CanCreateInspection]


class InspectionDetailView(AuditLogMixin, generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/inspections/<id>/"""

    serializer_class = InspectionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    audit_model_name = "Inspection"

    def get_queryset(self):
        return Inspection.objects.select_related(
            "vehicle", "inspector"
        ).prefetch_related("items__category")


class InspectionDeleteView(AuditLogMixin, generics.DestroyAPIView):
    """DELETE /api/inspections/<id>/"""

    permission_classes = [permissions.IsAuthenticated]
    queryset = Inspection.objects.all()
    audit_model_name = "Inspection"


class InspectionStatusUpdateView(APIView):
    """PATCH /api/inspections/<id>/status/"""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        inspection = generics.get_object_or_404(Inspection, pk=pk)
        new_status = request.data.get("status")

        valid = [s[0] for s in Inspection.Status.choices]
        if new_status not in valid:
            return Response(
                {"detail": f"Trạng thái không hợp lệ: {new_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = inspection.status
        inspection.status = new_status
        inspection.save(update_fields=["status", "updated_at"])
        log_action(
            user=request.user,
            action="STATUS_CHANGE",
            model_name="Inspection",
            object_id=inspection.id,
            description=f"Inspection #{inspection.id}: {old_status} → {new_status}",
            old_value={"status": old_status},
            new_value={"status": new_status},
            request=request,
        )

        return Response(
            InspectionListSerializer(
                Inspection.objects.select_related("vehicle", "inspector")
                .prefetch_related("items__category")
                .get(pk=pk)
            ).data
        )


class InspectionPublicView(generics.RetrieveAPIView):
    """
    Hồ sơ kiểm định công khai cho khách hàng.
    Chỉ trả về phiếu có is_public=True và status=COMPLETED.
    """

    serializer_class = InspectionDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Inspection.objects.filter(
            is_public=True,
            status=Inspection.Status.COMPLETED,
        ).prefetch_related("items__category")


class InspectionPublishView(APIView):
    """
    Công khai / ẩn kết quả kiểm định cho khách hàng — chỉ admin.
    POST body: { "is_public": true | false }
    """

    permission_classes = [CanPublishInspection]

    def post(self, request, pk):
        inspection = generics.get_object_or_404(Inspection, pk=pk)
        is_public = request.data.get("is_public")

        if is_public is None:
            return Response(
                {"detail": "Vui lòng cung cấp trường 'is_public' (true / false)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(is_public, bool):
            return Response(
                {"detail": "Giá trị 'is_public' phải là true hoặc false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_value = inspection.is_public
        inspection.is_public = is_public
        inspection.save(update_fields=["is_public"])
        log_action(
            user=request.user,
            action="APPROVE" if is_public else "REJECT",
            model_name="Inspection",
            object_id=inspection.id,
            description=f"{'Công khai' if is_public else 'Ẩn'} inspection #{inspection.id}",
            old_value={"is_public": old_value},
            new_value={"is_public": is_public},
            request=request,
        )
        action = "Công khai" if is_public else "Ẩn"
        return Response(
            {
                "message": f"{action} kết quả kiểm định thành công.",
                "is_public": inspection.is_public,
            }
        )


class InspectionItemView(APIView):
    """
    Thêm hạng mục mới vào phiếu kiểm định.
    Hỗ trợ upload ảnh minh chứng kèm hạng mục.
    """

    permission_classes = [CanManageInspectionItem]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        inspection = generics.get_object_or_404(Inspection, pk=pk)

        # Kiểm tra object-level: không thêm nếu phiếu đã hoàn thành
        # Tạo dummy item tạm để check_object_permissions có context inspection
        if inspection.status in [
            Inspection.Status.COMPLETED,
            Inspection.Status.FAILED,
        ]:
            return Response(
                {"detail": "Phiếu kiểm định đã hoàn thành, không thể thêm hạng mục."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InspectionItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(inspection=inspection)
        log_action(
            user=request.user,
            action="CREATE",
            model_name="InspectionItem",
            object_id=item.id,
            description=f"Thêm hạng mục '{item.name}' vào inspection #{inspection.id}",
            new_value={"inspection": inspection.id, "name": item.name},
            request=request,
        )

        return Response(
            InspectionItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class InspectionItemDetailView(AuditLogMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Xem / cập nhật / xóa hạng mục kiểm định.
    Chặn thao tác nếu phiếu cha đã hoàn thành.
    """

    serializer_class = InspectionItemSerializer
    permission_classes = [CanManageInspectionItem]
    audit_model_name = "InspectionItem"
    queryset = InspectionItem.objects.select_related("inspection", "category")

    def get_object(self):
        obj = super().get_object()
        # Kiểm tra object-level permission (chặn sửa nếu phiếu đã xong)
        self.check_object_permissions(self.request, obj)
        return obj


class InspectionCompleteView(APIView):
    """
    Hoàn thành kiểm định:
    - Tính điểm trung bình và xếp loại A/B/C/D
    - Chuyển trạng thái COMPLETED hoặc FAILED tùy kết quả
    - Chỉ người được giao kiểm định hoặc admin mới thực hiện được
    """

    permission_classes = [CanCompleteInspection]

    def post(self, request, pk):
        inspection = generics.get_object_or_404(
            Inspection.objects.prefetch_related("items"), pk=pk
        )

        # Kiểm tra object-level (chỉ inspector được giao hoặc admin)
        self.check_object_permissions(request, inspection)

        if inspection.status in [
            Inspection.Status.COMPLETED,
            Inspection.Status.FAILED,
        ]:
            return Response(
                {"detail": "Phiếu kiểm định đã hoàn thành trước đó."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = inspection.items.all()
        if not items.exists():
            return Response(
                {"detail": "Phiếu kiểm định chưa có hạng mục nào."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tính điểm trung bình từ các hạng mục có điểm
        scored = [i.score for i in items if i.score is not None]
        if scored:
            avg = sum(scored) / len(scored)
            inspection.overall_score = round(avg, 1)
            if avg >= 8.5:
                inspection.quality_grade = "A"
            elif avg >= 7.0:
                inspection.quality_grade = "B"
            elif avg >= 5.0:
                inspection.quality_grade = "C"
            else:
                inspection.quality_grade = "D"

        # Nếu có bất kỳ hạng mục nào FAILED → toàn bộ phiếu FAILED
        has_failed = items.filter(condition="FAILED").exists()
        inspection.status = (
            Inspection.Status.FAILED if has_failed else Inspection.Status.COMPLETED
        )
        inspection.conclusion = request.data.get("conclusion", "")
        inspection.recommendation = request.data.get("recommendation", "")
        old_status = inspection.status
        inspection.save()
        log_action(
            user=request.user,
            action="STATUS_CHANGE",
            model_name="Inspection",
            object_id=inspection.id,
            description=f"Hoàn thành inspection #{inspection.id}: {old_status} → {inspection.status}",
            old_value={"status": old_status},
            new_value={
                "status": inspection.status,
                "overall_score": inspection.overall_score,
                "quality_grade": inspection.quality_grade,
            },
            request=request,
        )
        return Response(InspectionDetailSerializer(inspection).data)


# Thêm vào cuối file, sau InspectionCompleteView


class VehiclePublicInspectionView(APIView):
    """GET /api/vehicles/<vehicle_id>/inspection/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, vehicle_id):
        inspection = (
            Inspection.objects.filter(
                vehicle_id=vehicle_id,
                is_public=True,
                status=Inspection.Status.COMPLETED,
            )
            .select_related("vehicle", "inspector")
            .prefetch_related("items__category")
            .order_by("-inspection_date")
            .first()
        )

        if not inspection:
            return Response(
                {"detail": "Chưa có phiếu kiểm định công khai cho xe này."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(InspectionPublicSerializer(inspection).data)
