import uuid

from rest_framework import generics, permissions, status
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from sales.momo import create_momo_payment, verify_ipn
from vehicles.models import VehicleStatusLog, VehicleUnit
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncWeek, TruncMonth, ExtractQuarter, ExtractYear
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from sales.models import Favorite
from sales.serializers import FavoriteSerializer
from sales.permissions import CanViewDashboard
from sales.models import (
    Appointment,
    AuditLog,
    Deposit,
    HandoverRecord,
    Listing,
    SalesOrder,
    WarrantyRecord,
    VehiclePricing,
)
from sales.permissions import (
    CanApprovePricing,
    CanConfirmDeposit,
    CanManageAppointment,
    CanManageDeposit,
    CanManageHandover,
    CanManageListing,
    CanManagePricing,
    CanManageSalesOrder,
    CanManageWarranty,
    CanViewAuditLog,
    CanViewDashboard,
    CanViewPricing,
)
from sales.serializers import (
    AppointmentSerializer,
    AuditLogSerializer,
    DepositSerializer,
    HandoverSerializer,
    ListingSerializer,
    SalesOrderSerializer,
    WarrantySerializer,
    VehiclePricingSerializer,
    VehiclePricingCreateSerializer,
    VehiclePricingApproveSerializer,
)


# ── Permission helper ──────────────────────────────────────────


class OptionalJWTAuthentication(JWTAuthentication):
    """Token hợp lệ → authenticate, token lỗi/không có → anonymous user"""

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None


class IsPricingOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "ADMIN",
            "PRICING",
        )


# ── VehiclePricing views ───────────────────────────────────────


class PricingListView(generics.ListCreateAPIView):
    """
    GET  /api/admin/pricings/  — danh sách phiếu định giá
    POST /api/admin/pricings/  — tạo phiếu mới
    """

    permission_classes = [IsPricingOrAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return VehiclePricingCreateSerializer
        return VehiclePricingSerializer

    def get_queryset(self):
        qs = VehiclePricing.objects.select_related(
            "vehicle", "created_by", "approved_by"
        ).order_by("-created_at")
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(vehicle__brand__icontains=search) | qs.filter(
                vehicle__model__icontains=search
            )
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        pricing = serializer.save()
        return Response(
            VehiclePricingSerializer(pricing).data,
            status=status.HTTP_201_CREATED,
        )


class PricingDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/admin/pricings/<id>/"""

    queryset = VehiclePricing.objects.select_related(
        "vehicle", "created_by", "approved_by"
    )
    serializer_class = VehiclePricingSerializer
    permission_classes = [IsPricingOrAdmin]


class PricingApproveView(APIView):
    permission_classes = [IsPricingOrAdmin]

    def post(self, request, pk):
        pricing = generics.get_object_or_404(
            VehiclePricing.objects.select_related("vehicle"), pk=pk
        )

        if pricing.status == VehiclePricing.Status.APPROVED:
            return Response(
                {"detail": "Phiếu đã được phê duyệt trước đó."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VehiclePricingApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        approved_price = serializer.validated_data["approved_price"]
        note = serializer.validated_data.get("note", "")

        pricing.approved_price = approved_price
        pricing.approved_by = request.user
        pricing.approved_at = timezone.now()
        pricing.status = VehiclePricing.Status.APPROVED
        if note:
            pricing.note = note
        pricing.save()

        # ── Cập nhật sale_price xe ─────────────────────────────
        vehicle = pricing.vehicle
        vehicle.sale_price = approved_price
        vehicle.save(update_fields=["sale_price", "updated_at"])

        # ── Tự động chuyển xe → LISTED nếu đang READY_FOR_SALE ─
        if vehicle.status == "READY_FOR_SALE":
            old_status = vehicle.status
            vehicle.status = "LISTED"
            vehicle.save(update_fields=["status", "updated_at"])
            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status="LISTED",
                changed_by=request.user,
                note=f"Tự động sau khi phê duyệt định giá (phiếu #{pricing.id})",
            )

        return Response(VehiclePricingSerializer(pricing).data)


class PricingRejectView(APIView):
    """POST /api/admin/pricings/<id>/reject/"""

    permission_classes = [IsPricingOrAdmin]

    def post(self, request, pk):
        pricing = generics.get_object_or_404(VehiclePricing, pk=pk)

        if pricing.status != VehiclePricing.Status.PENDING:
            return Response(
                {"detail": "Chỉ phiếu đang chờ duyệt mới có thể từ chối."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get("note", "")
        pricing.status = VehiclePricing.Status.REJECTED
        if note:
            pricing.note = f"[Từ chối] {note}"
        pricing.approved_by = request.user
        pricing.approved_at = timezone.now()
        pricing.save()

        return Response({"message": "Đã từ chối phiếu định giá."})


# ── Listing ────────────────────────────────────────────────────


class ListingListView(generics.ListAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Listing.objects.filter(is_active=True).select_related("vehicle")


class ListingCreateView(generics.CreateAPIView):
    serializer_class = ListingSerializer
    permission_classes = [CanManageListing]

    def perform_create(self, serializer):
        listing = serializer.save()
        vehicle = listing.vehicle
        old_status = vehicle.status
        vehicle.status = VehicleUnit.Status.LISTED
        vehicle.save(update_fields=["status", "updated_at"])
        VehicleStatusLog.objects.create(
            vehicle=vehicle,
            old_status=old_status,
            new_status=VehicleUnit.Status.LISTED,
            changed_by=self.request.user,
            note="Đã niêm yết lên website.",
        )


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [CanManageListing]
    queryset = Listing.objects.select_related("vehicle")


# ── Appointment ────────────────────────────────────────────────


class AppointmentListView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    """ permission_classes = [CanManageAppointment] """

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]   # cho khách tạo
        return [CanManageAppointment()] 
    
    def get_queryset(self):
        qs = Appointment.objects.select_related("vehicle", "customer", "handled_by")
        if self.request.user.role == "CUSTOMER":
            qs = qs.filter(customer=self.request.user)
        vehicle_id = self.request.query_params.get("vehicle")
        status_val = self.request.query_params.get("status")
        if vehicle_id:
            qs = qs.filter(vehicle_id=vehicle_id)
        if status_val:
            qs = qs.filter(status=status_val)
        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [CanManageAppointment]
    queryset = Appointment.objects.select_related("vehicle", "customer", "handled_by")

    def perform_update(self, serializer):
        serializer.save(handled_by=self.request.user)


# ── Deposit ────────────────────────────────────────────────────


class DepositListView(generics.ListCreateAPIView):
    serializer_class = DepositSerializer
    permission_classes = [CanManageDeposit]

    def get_queryset(self):
        qs = Deposit.objects.select_related("vehicle", "customer", "confirmed_by")
        if self.request.user.role == "CUSTOMER":
            qs = qs.filter(customer=self.request.user)
        vehicle_id = self.request.query_params.get("vehicle")
        status_val = self.request.query_params.get("status")
        if vehicle_id:
            qs = qs.filter(vehicle_id=vehicle_id)
        if status_val:
            qs = qs.filter(status=status_val)
        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class DepositDetailView(generics.RetrieveAPIView):
    serializer_class = DepositSerializer
    permission_classes = [CanManageDeposit]
    queryset = Deposit.objects.select_related("vehicle", "customer", "confirmed_by")


class DepositConfirmView(APIView):
    permission_classes = [CanConfirmDeposit]

    def post(self, request, pk):
        deposit = generics.get_object_or_404(Deposit, pk=pk)

        if deposit.status != Deposit.Status.PENDING:
            return Response(
                {"detail": "Chỉ xác nhận được đặt cọc ở trạng thái 'Chờ xác nhận'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        already = (
            Deposit.objects.filter(
                vehicle=deposit.vehicle,
                status=Deposit.Status.CONFIRMED,
            )
            .exclude(pk=pk)
            .exists()
        )
        if already:
            return Response(
                {"detail": "Xe này đã có đặt cọc được xác nhận từ khách hàng khác."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deposit.status = Deposit.Status.CONFIRMED
        deposit.confirmed_by = request.user
        deposit.save(update_fields=["status", "confirmed_by", "updated_at"])

        vehicle = deposit.vehicle
        old_status = vehicle.status
        vehicle.status = VehicleUnit.Status.RESERVED
        vehicle.save(update_fields=["status", "updated_at"])
        VehicleStatusLog.objects.create(
            vehicle=vehicle,
            old_status=old_status,
            new_status=VehicleUnit.Status.RESERVED,
            changed_by=request.user,
            note=f"Đặt cọc #{deposit.pk} được xác nhận.",
        )

        return Response({"message": "Xác nhận đặt cọc thành công. Xe đã được khóa."})


class DepositCancelView(APIView):
    permission_classes = [CanConfirmDeposit]

    def post(self, request, pk):
        deposit = generics.get_object_or_404(Deposit, pk=pk)

        if deposit.status in [Deposit.Status.CANCELLED, Deposit.Status.CONVERTED]:
            return Response(
                {"detail": "Đặt cọc này không thể hủy."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_confirmed = deposit.status == Deposit.Status.CONFIRMED
        deposit.status = Deposit.Status.CANCELLED
        deposit.save(update_fields=["status", "updated_at"])

        if was_confirmed:
            vehicle = deposit.vehicle
            old_status = vehicle.status
            vehicle.status = VehicleUnit.Status.LISTED
            vehicle.save(update_fields=["status", "updated_at"])
            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status=VehicleUnit.Status.LISTED,
                changed_by=request.user,
                note=f"Hủy đặt cọc #{deposit.pk} — xe mở lại để bán.",
            )

        return Response({"message": "Đã hủy đặt cọc thành công."})


# ── Sales Order ────────────────────────────────────────────────


class SalesOrderListView(generics.ListCreateAPIView):
    serializer_class = SalesOrderSerializer
    permission_classes = [CanManageSalesOrder]
    queryset = SalesOrder.objects.select_related("vehicle", "customer", "sold_by")

    def perform_create(self, serializer):
        order = serializer.save(sold_by=self.request.user)
        vehicle = order.vehicle
        old_status = vehicle.status
        vehicle.status = VehicleUnit.Status.SOLD
        vehicle.save(update_fields=["status", "updated_at"])
        VehicleStatusLog.objects.create(
            vehicle=vehicle,
            old_status=old_status,
            new_status=VehicleUnit.Status.SOLD,
            changed_by=self.request.user,
            note=f"Đơn bán #{order.contract_number}.",
        )


class SalesOrderDetailView(generics.RetrieveAPIView):
    serializer_class = SalesOrderSerializer
    permission_classes = [CanManageSalesOrder]
    queryset = SalesOrder.objects.select_related(
        "vehicle", "customer", "sold_by", "deposit"
    )


# ── Handover ───────────────────────────────────────────────────


class HandoverCreateView(generics.CreateAPIView):
    serializer_class = HandoverSerializer
    permission_classes = [CanManageHandover]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)


class HandoverDetailView(generics.RetrieveAPIView):
    serializer_class = HandoverSerializer
    permission_classes = [CanManageHandover]
    queryset = HandoverRecord.objects.select_related("sales_order__vehicle", "staff")


# ── Warranty ───────────────────────────────────────────────────


class WarrantyListView(generics.ListCreateAPIView):
    serializer_class = WarrantySerializer
    permission_classes = [CanManageWarranty]

    def get_queryset(self):
        qs = WarrantyRecord.objects.select_related(
            "sales_order__vehicle", "sales_order__customer"
        )
        if self.request.user.role == "CUSTOMER":
            qs = qs.filter(sales_order__customer=self.request.user)
        return qs


class WarrantyDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = WarrantySerializer
    permission_classes = [CanManageWarranty]
    queryset = WarrantyRecord.objects.select_related("sales_order__vehicle")


# ── Audit Log ──────────────────────────────────────────────────


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [CanViewAuditLog]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user")
        model_name = self.request.query_params.get("model")
        object_id = self.request.query_params.get("object_id")
        if model_name:
            qs = qs.filter(model_name__iexact=model_name)
        if object_id:
            qs = qs.filter(object_id=object_id)
        return qs


# ── Dashboard ──────────────────────────────────────────────────


class DashboardStatsView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        try:
            from inspections.models import Inspection

            total_inspections = Inspection.objects.count()
        except Exception:
            total_inspections = 0

        brands = list(
            VehicleUnit.objects.values("brand")
            .annotate(total=Count("id"))
            .order_by("-total")[:8]
        )

        return Response(
            {
                "total_vehicles": VehicleUnit.objects.count(),
                "total_deposits": Deposit.objects.count(),
                "total_inspections": total_inspections,
                "pending_deposits": Deposit.objects.filter(
                    status=Deposit.Status.PENDING
                ).count(),
                "sold_cars": VehicleUnit.objects.filter(
                    status=VehicleUnit.Status.SOLD
                ).count(),
                "brands": brands,
            }
        )


class RecentDepositsView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        deposits = Deposit.objects.select_related("vehicle", "customer").order_by(
            "-created_at"
        )[:10]

        data = []
        for d in deposits:
            display_name = (
                d.customer_name
                or (d.customer and (d.customer.get_full_name() or d.customer.username))
                or "Khách vãng lai"
            )
            vehicle_name = (
                f"{d.vehicle.brand} {d.vehicle.model} "
                f"{d.vehicle.variant or ''} {d.vehicle.year or ''}".strip()
                if d.vehicle
                else ""
            )
            data.append(
                {
                    "id": d.id,
                    "customer_name_display": display_name,
                    "phone": d.customer_phone or "",
                    "vehicle_name": vehicle_name,
                    "status": d.status,
                    "amount": str(d.amount),
                    "created_at": d.created_at.isoformat(),
                }
            )

        return Response(data)


class DashboardOverviewView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        try:
            from refurbishment.models import RefurbishmentOrder

            refurbishing = RefurbishmentOrder.objects.filter(
                status=RefurbishmentOrder.Status.IN_PROGRESS
            ).count()
        except Exception:
            refurbishing = 0

        vehicle_stats = VehicleUnit.objects.aggregate(
            total=Count("id"),
            listed=Count("id", filter=Q(status=VehicleUnit.Status.LISTED)),
            sold=Count("id", filter=Q(status=VehicleUnit.Status.SOLD)),
            reserved=Count("id", filter=Q(status=VehicleUnit.Status.RESERVED)),
        )
        total_revenue = (
            SalesOrder.objects.aggregate(total=Sum("sale_price"))["total"] or 0
        )

        return Response(
            {
                "total_vehicles": vehicle_stats["total"],
                "listed_vehicles": vehicle_stats["listed"],
                "sold_vehicles": vehicle_stats["sold"],
                "reserved_vehicles": vehicle_stats["reserved"],
                "refurbishing": refurbishing,
                "total_revenue": str(total_revenue),
            }
        )


class VehicleLifecycleView(APIView):
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
            {
                "vehicle_id": vehicle_id,
                "total_changes": len(data),
                "status_logs": data,
            }
        )


# Thêm vào cuối sales/views.py


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("vehicle")
            .prefetch_related("vehicle__media")
            .order_by("-created_at")
        )


class FavoriteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]

    def post(self, request, vehicle_id):
        from vehicles.models import VehicleUnit

        vehicle = generics.get_object_or_404(VehicleUnit, pk=vehicle_id)

        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            vehicle=vehicle,
        )

        if not created:
            favorite.delete()
            return Response(
                {
                    "favorited": False,
                    "message": "Đã xóa khỏi danh sách yêu thích.",
                }
            )

        return Response(
            {
                "favorited": True,
                "message": "Đã thêm vào danh sách yêu thích.",
                "id": favorite.id,
            },
            status=status.HTTP_201_CREATED,
        )


class FavoriteStatusView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]

    def get(self, request, vehicle_id):
        if not request.user or not request.user.is_authenticated:
            return Response({"favorited": False})

        favorited = Favorite.objects.filter(
            user=request.user,
            vehicle_id=vehicle_id,
        ).exists()
        return Response({"favorited": favorited})


class DepositCreateWithMoMoView(APIView):
    """
    POST /api/deposits/
    Body: { vehicle, amount, customer_name, customer_phone, customer_email, note }

    1. Tạo Deposit record (status=PENDING)
    2. Gọi MoMo API tạo link thanh toán
    3. Trả về { deposit_id, pay_url, qr_code_url }

    Frontend redirect khách sang pay_url.
    """

    permission_classes = [permissions.AllowAny]  # Cho phép khách chưa login

    def post(self, request):
        # ── Validate dữ liệu đầu vào ──────────────────────────
        vehicle_id = request.data.get("vehicle")
        amount = request.data.get("amount")
        customer_name = request.data.get("customer_name", "").strip()
        customer_phone = request.data.get("customer_phone", "").strip()
        customer_email = request.data.get("customer_email", "").strip()
        note = request.data.get("note", "")

        if not vehicle_id or not amount:
            return Response(
                {"detail": "Vui lòng cung cấp vehicle và amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not customer_name or not customer_phone:
            return Response(
                {"detail": "Vui lòng nhập họ tên và số điện thoại."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_int = int(float(amount))
        if amount_int < 100_000:
            return Response(
                {"detail": "Số tiền đặt cọc tối thiểu 100.000 đ."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Kiểm tra xe có thể đặt cọc ────────────────────────
        from vehicles.models import VehicleUnit

        try:
            vehicle = VehicleUnit.objects.get(pk=vehicle_id)
        except VehicleUnit.DoesNotExist:
            return Response({"detail": "Xe không tồn tại."}, status=404)

        if vehicle.status not in ["LISTED", "READY_FOR_SALE"]:
            return Response(
                {
                    "detail": f"Xe không thể đặt cọc ở trạng thái '{vehicle.status_display}'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Kiểm tra đã có đặt cọc confirmed chưa
        if Deposit.objects.filter(vehicle=vehicle, status="CONFIRMED").exists():
            return Response(
                {"detail": "Xe này đã có người đặt cọc thành công."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Tạo Deposit record ─────────────────────────────────
        momo_order_id = f"DEPOSIT_{uuid.uuid4().hex[:16].upper()}"

        deposit = Deposit.objects.create(
            vehicle=vehicle,
            customer=request.user if request.user.is_authenticated else None,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            amount=amount_int,
            note=note,
            status=Deposit.Status.PENDING,
            momo_order_id=momo_order_id,  # cần thêm field này vào model
        )

        # ── Gọi MoMo API ───────────────────────────────────────
        order_info = (
            f"Dat coc xe {vehicle.brand} {vehicle.model} {vehicle.year} "
            f"- {customer_name} - {customer_phone}"
        )

        momo_resp = create_momo_payment(
            order_id=momo_order_id,
            amount=amount_int,
            order_info=order_info,
            extra_data=str(deposit.id),  # gửi kèm deposit_id để IPN nhận lại
        )

        if not momo_resp.success:
            # Xóa deposit nếu MoMo lỗi
            deposit.delete()
            return Response(
                {"detail": f"Không thể tạo thanh toán MoMo: {momo_resp.message}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Lưu pay_url để có thể kiểm tra lại
        deposit.momo_pay_url = momo_resp.pay_url
        deposit.save(update_fields=["momo_pay_url"])

        return Response(
            {
                "deposit_id": deposit.id,
                "pay_url": momo_resp.pay_url,
                "qr_code_url": momo_resp.qr_code_url,
                "deep_link": momo_resp.deep_link,
                "order_id": momo_order_id,
                "amount": amount_int,
                "message": "Đã tạo link thanh toán MoMo. Vui lòng hoàn tất trong 15 phút.",
            },
            status=status.HTTP_201_CREATED,
        )


class MoMoIPNView(APIView):
    """
    POST /api/momo/ipn/
    MoMo gọi về đây sau khi khách thanh toán.
    Cần đảm bảo URL này accessible từ internet (dùng ngrok khi dev).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        result_code = int(data.get("resultCode", -1))
        order_id = data.get("orderId", "")
        trans_id = data.get("transId", "")

        # ── Xác thực chữ ký ────────────────────────────────────
        if not verify_ipn(data):
            return Response({"message": "Invalid signature"}, status=400)

        # ── Tìm Deposit theo momo_order_id ─────────────────────
        try:
            deposit = Deposit.objects.select_related("vehicle").get(
                momo_order_id=order_id
            )
        except Deposit.DoesNotExist:
            return Response({"message": "Order not found"}, status=404)

        # ── Xử lý kết quả ──────────────────────────────────────
        if result_code == 0:
            # Thanh toán thành công
            if deposit.status == Deposit.Status.PENDING:
                deposit.status = Deposit.Status.CONFIRMED
                deposit.momo_trans_id = str(trans_id)
                deposit.save(update_fields=["status", "momo_trans_id"])

                # Chuyển trạng thái xe → RESERVED
                from vehicles.models import VehicleStatusLog

                vehicle = deposit.vehicle
                old_status = vehicle.status
                vehicle.status = "RESERVED"
                vehicle.save(update_fields=["status", "updated_at"])

                VehicleStatusLog.objects.create(
                    vehicle=vehicle,
                    old_status=old_status,
                    new_status="RESERVED",
                    note=f"Đặt cọc MoMo #{deposit.id} thành công (transId: {trans_id})",
                )

        else:
            # Thanh toán thất bại / hủy
            if deposit.status == Deposit.Status.PENDING:
                deposit.status = Deposit.Status.CANCELLED
                deposit.save(update_fields=["status"])

        # MoMo yêu cầu trả về 200 để xác nhận đã nhận IPN
        return Response({"message": "OK"}, status=200)


class DepositMoMoStatusView(APIView):
    """
    GET /api/deposits/<pk>/momo/
    Frontend polling để kiểm tra thanh toán đã xong chưa
    (dùng khi khách quay lại từ MoMo redirect).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            deposit = Deposit.objects.select_related("vehicle").get(pk=pk)
        except Deposit.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn đặt cọc."}, status=404)

        STATUS_LABELS = {
            "PENDING": "Chờ thanh toán",
            "CONFIRMED": "Thanh toán thành công",
            "CANCELLED": "Đã hủy / Thanh toán thất bại",
            "REFUNDED": "Đã hoàn tiền",
            "CONVERTED": "Đã chuyển thành đơn bán",
        }

        return Response(
            {
                "deposit_id": deposit.id,
                "status": deposit.status,
                "status_label": STATUS_LABELS.get(deposit.status, deposit.status),
                "amount": str(deposit.amount),
                "vehicle_name": f"{deposit.vehicle.brand} {deposit.vehicle.model} {deposit.vehicle.year}",
                "vehicle_status": deposit.vehicle.status,
                "momo_trans_id": getattr(deposit, "momo_trans_id", ""),
                "created_at": deposit.created_at.isoformat(),
            }
        )


class RevenueStatsView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        period = request.query_params.get("period", "month")

        qs = SalesOrder.objects.all()

        # ── GROUP BY theo period ─────────────────────────
        if period == "week":
            qs = qs.annotate(week=TruncWeek("created_at")).values("week")
        elif period == "quarter":
            qs = qs.annotate(
                year=ExtractYear("created_at"),
                quarter=ExtractQuarter("created_at"),
            ).values("year", "quarter")
        else:  # default month
            qs = qs.annotate(month=TruncMonth("created_at")).values("month")

        # ── Aggregate ───────────────────────────────────
        qs = qs.annotate(
            total=Sum("sale_price"),
            count=Count("id"),
        ).order_by(list(qs.query.annotations.keys())[0])

        # ── Format output cho frontend ───────────────────
        data = []

        for row in qs:
            item = {
                "total": row["total"] or 0,
                "count": row["count"],
            }

            if period == "week":
                item["week"] = row["week"].isoformat()
            elif period == "quarter":
                item["quarter"] = f"Q{row['quarter']}/{row['year']}"
            else:
                item["month"] = row["month"].isoformat()

            data.append(item)

        return Response(data)

# Trong RevenueView — fix field name và date format
""" class RevenueView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        period = request.query_params.get("period", "month")
        qs = SalesOrder.objects.all()

        if period == "week":
            data = (
                qs.annotate(week=TruncWeek("sold_at")) 
                .values("week")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("week")
            )
            return Response([
                {
                    "week": d["week"].strftime("%Y-%m-%d"), 
                    "total": str(d["total"] or 0),
                    "count": d["count"],
                }
                for d in data if d["week"]
            ])

        elif period == "quarter":
            data = (
                qs.annotate(
                    year=ExtractYear("sold_at"),      
                    quarter=ExtractQuarter("sold_at"),
                )
                .values("year", "quarter")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("year", "quarter")
            )
            return Response([
                {
                    "quarter": f"Q{d['quarter']}/{d['year']}",  # ✅ Q1/2026
                    "total": str(d["total"] or 0),
                    "count": d["count"],
                }
                for d in data
            ])

        else:  # month
            data = (
                qs.annotate(month=TruncMonth("sold_at"))  
                .values("month")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("month")
            )
            return Response([
                {
                    "month": d["month"].strftime("%Y-%m"), 
                    "total": str(d["total"] or 0),
                    "count": d["count"],
                }
                for d in data if d["month"]
            ]) """
        
class RevenueView(APIView):
    """
    GET /api/dashboard/revenue/?period=month|week|quarter
    
    Trả về array trực tiếp (không wrap trong object).
    Dùng sold_at (không phải created_at).
    Format date thành string ngắn gọn cho frontend.
    """
    permission_classes = [CanViewDashboard]
 
    def get(self, request):
        period = request.query_params.get("period", "month")
        qs = SalesOrder.objects.all()
 
        if period == "week":
            data = (
                qs.annotate(week=TruncWeek("sold_at"))   # ✅ sold_at
                .values("week")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("week")
            )
            return Response([
                {
                    "week":  row["week"].strftime("%Y-%m-%d") if row["week"] else None,
                    "total": str(row["total"] or 0),
                    "count": row["count"],
                }
                for row in data if row["week"]
            ])
 
        elif period == "quarter":
            data = (
                qs.annotate(
                    year=ExtractYear("sold_at"),       
                    quarter=ExtractQuarter("sold_at"),
                )
                .values("year", "quarter")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("year", "quarter")
            )
            return Response([
                {
                    "quarter": f"Q{row['quarter']}/{row['year']}",  
                    "total":   str(row["total"] or 0),
                    "count":   row["count"],
                }
                for row in data
            ])
 
        else:  # month (default)
            data = (
                qs.annotate(month=TruncMonth("sold_at"))  # ✅ sold_at
                .values("month")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("month")
            )
            return Response([
                {
                    "month": row["month"].strftime("%Y-%m") if row["month"] else None,
                    # ✅ "2026-03" — không phải ISO full datetime
                    "total": str(row["total"] or 0),
                    "count": row["count"],
                }
                for row in data if row["month"]
            ])
 
class HandoverListView(generics.ListAPIView):
    serializer_class = HandoverSerializer
    permission_classes = [CanManageHandover]

    def get_queryset(self):
        qs = HandoverRecord.objects.select_related(
            "sales_order__vehicle",
            "staff"
        ).order_by("-created_at")

        search = self.request.query_params.get("search")

        if search:
            qs = qs.filter(
                Q(sales_order__id__icontains=search)
                | Q(sales_order__contract_number__icontains=search)
            )

        return qs