from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from vehicles.models import VehicleMedia, VehicleStatusLog, VehicleUnit
from vehicles.permissions import (
    CanCreateVehicle,
    CanDeleteVehicle,
    CanEditVehicle,
    CanTransitionVehicle,
    CanUploadVehicleMedia,
    CanViewVehicle,
)
from vehicles.serializers import (
    VehicleCreateSerializer,
    VehicleDetailSerializer,
    VehicleListSerializer,
    VehicleMediaSerializer,
    VehicleTransitionSerializer,
    VehicleUpdateSerializer,
)


# ── Custom authenticator: không raise lỗi nếu token invalid/expired ──
# Dùng cho tất cả public/semi-public endpoints
class OptionalJWTAuthentication(JWTAuthentication):
    """
    Giống JWTAuthentication nhưng KHÔNG raise lỗi khi token lỗi.
    Token hợp lệ → trả về (user, token).
    Token không có / hết hạn / lỗi → trả về None (anonymous user).
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None
        except Exception:
            return None


# ── Public list view ───────────────────────────────────────────


class VehicleListView(generics.ListAPIView):
    """Danh sách xe đang niêm yết — công khai."""

    serializer_class = VehicleListSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["brand", "fuel_type", "transmission", "year"]
    search_fields = ["brand", "model", "variant", "vin"]
    ordering_fields = ["sale_price", "year", "mileage", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = (
            VehicleUnit.objects.filter(status=VehicleUnit.Status.LISTED)
            .select_related("spec")
            .prefetch_related("media")
        )
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        body_type = self.request.query_params.get("body_type")
        if min_price:
            qs = qs.filter(sale_price__gte=min_price)
        if max_price:
            qs = qs.filter(sale_price__lte=max_price)
        if body_type:
            qs = qs.filter(spec__body_type__iexact=body_type)
        return qs


class VehicleAdminListView(generics.ListAPIView):
    """Danh sách toàn bộ xe — nhân viên nội bộ."""

    serializer_class = VehicleListSerializer
    permission_classes = [CanViewVehicle]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["brand", "fuel_type", "transmission", "year", "status"]
    search_fields = ["brand", "model", "vin", "license_plate"]
    ordering_fields = ["sale_price", "year", "mileage", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return VehicleUnit.objects.select_related("spec").prefetch_related(
            "media", "status_logs"
        )


class VehicleCreateView(generics.CreateAPIView):
    """Tạo hồ sơ xe mới — nhân viên thu mua."""

    serializer_class = VehicleCreateSerializer
    permission_classes = [CanCreateVehicle]

    def perform_create(self, serializer):
        serializer.save()


class VehicleDetailView(generics.RetrieveUpdateAPIView):
    """
    Chi tiết xe — PUBLIC cho xe LISTED, nội bộ cho trạng thái khác.

    Dùng OptionalJWTAuthentication để:
    - Token hợp lệ → request.user = user đã đăng nhập
    - Token hết hạn / không có → request.user = AnonymousUser (KHÔNG raise 403)

    CanViewVehicle.has_object_permission() sẽ quyết định:
    - Xe LISTED → cho phép tất cả
    - Xe trạng thái khác → yêu cầu nhân viên nội bộ
    """

    queryset = VehicleUnit.objects.select_related("spec").prefetch_related(
        "media", "status_logs__changed_by"
    )
    # ✅ QUAN TRỌNG: OptionalJWT không raise lỗi → anonymous user đi qua được
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]

    def get_serializer_class(self):
        return VehicleDetailSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [CanViewVehicle()]
        return [CanEditVehicle()]

    def get_object(self):
        # ✅ QUAN TRỌNG: phải override để gọi check_object_permissions
        # DRF generic views gọi get_object() → check_object_permissions() tự động
        # nhưng cần đảm bảo nó thực sự được gọi
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj


class VehicleTransitionView(APIView):
    """Chuyển trạng thái vòng đời xe."""

    def get_permissions(self):
        return [CanTransitionVehicle()]

    def post(self, request, pk):
        vehicle = generics.get_object_or_404(VehicleUnit, pk=pk)
        self.check_object_permissions(request, vehicle)

        serializer = VehicleTransitionSerializer(
            data=request.data,
            context={"vehicle": vehicle, "request": request},
        )
        serializer.is_valid(raise_exception=True)

        old_status = vehicle.status
        new_status = serializer.validated_data["new_status"]
        note = serializer.validated_data.get("note", "")

        if new_status == VehicleUnit.Status.LISTED:
            if old_status != VehicleUnit.Status.READY_FOR_SALE:
                return Response(
                    {
                        "detail": "Xe phải ở trạng thái 'Sẵn sàng bán' trước khi niêm yết."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        vehicle.status = new_status
        vehicle.save(update_fields=["status", "updated_at"])
        VehicleStatusLog.objects.create(
            vehicle=vehicle,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            note=note,
        )

        return Response(
            {
                "message": f"Đã chuyển trạng thái sang '{vehicle.get_status_display()}'.",
                "status": new_status,
            }
        )


class VehicleMediaUploadView(APIView):
    """Upload / xóa hình ảnh, video xe."""

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [CanUploadVehicleMedia()]

    def post(self, request, pk):
        vehicle = generics.get_object_or_404(VehicleUnit, pk=pk)
        files = request.FILES.getlist("files")
        if not files:
            return Response(
                {"detail": "Vui lòng chọn ít nhất một file."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        created = []
        for i, f in enumerate(files):
            media_type = "VIDEO" if f.content_type.startswith("video") else "IMAGE"
            media = VehicleMedia.objects.create(
                vehicle=vehicle,
                file=f,
                media_type=media_type,
                display_order=i,
            )
            created.append(
                VehicleMediaSerializer(media, context={"request": request}).data
            )
        return Response(
            {"message": f"Đã tải lên {len(created)} file.", "media": created},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk):
        media_id = request.data.get("media_id")
        if not media_id:
            return Response(
                {"detail": "Vui lòng cung cấp media_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        media = generics.get_object_or_404(VehicleMedia, pk=media_id, vehicle_id=pk)
        media.file.delete(save=False)
        media.delete()
        return Response(
            {"message": "Đã xóa ảnh / video."}, status=status.HTTP_204_NO_CONTENT
        )


class VehicleLifecycleView(APIView):
    """Lịch sử thay đổi trạng thái xe."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, vehicle_id):
        logs = (
            VehicleStatusLog.objects.filter(vehicle_id=vehicle_id)
            .select_related("changed_by")
            .order_by("changed_at")
            .values(
                "id",
                "old_status",
                "new_status",
                "changed_at",
                "changed_by__username",
                "note",
            )
        )
        data = [
            {
                "id": log["id"],
                "old_status": log["old_status"],
                "new_status": log["new_status"],
                "changed_at": log["changed_at"].isoformat(),
                "changed_by": log["changed_by__username"] or "system",
                "note": log["note"] or "",
            }
            for log in logs
        ]
        return Response(
            {"vehicle_id": vehicle_id, "total_changes": len(data), "status_logs": data}
        )


class VehicleMediaDeleteView(APIView):
    """Xóa một ảnh/video cụ thể."""

    def get_permissions(self):
        return [CanUploadVehicleMedia()]

    def delete(self, request, pk, media_id):
        media = generics.get_object_or_404(VehicleMedia, pk=media_id, vehicle_id=pk)
        was_primary = media.is_primary
        try:
            media.file.delete(save=False)
        except Exception:
            pass
        media.delete()
        if was_primary:
            next_primary = (
                VehicleMedia.objects.filter(vehicle_id=pk, media_type="IMAGE")
                .order_by("display_order", "created_at")
                .first()
            )
            if next_primary:
                next_primary.is_primary = True
                next_primary.save(update_fields=["is_primary"])
        return Response(
            {"message": "Đã xóa ảnh / video thành công."},
            status=status.HTTP_204_NO_CONTENT,
        )


class VehicleAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VehicleUnit.objects.select_related("spec").prefetch_related(
        "media", "status_logs__changed_by"
    )

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return VehicleUpdateSerializer
        return VehicleDetailSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [CanDeleteVehicle()]
        if self.request.method in permissions.SAFE_METHODS:
            return [CanViewVehicle()]
        return [CanEditVehicle()]

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        vehicle = self.get_object()
        for media in vehicle.media.all():
            try:
                media.file.delete(save=False)
            except Exception:
                pass
        vehicle.delete()
        return Response(
            {"message": "Đã xóa xe thành công."}, status=status.HTTP_204_NO_CONTENT
        )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def vehicle_status_choices(request):
    """Danh sách các trạng thái vòng đời xe."""
    return Response([{"value": k, "label": v} for k, v in VehicleUnit.Status.choices])
