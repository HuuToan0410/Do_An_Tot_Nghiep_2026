from rest_framework import serializers
from sales.models import (
    Appointment,
    AuditLog,
    Deposit,
    HandoverRecord,
    Listing,
    SalesOrder,
    WarrantyRecord,
    VehiclePricing,
    SellInquiry,
    ContactInquiry,
    Favorite,
)


class AppointmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    vehicle_name = serializers.SerializerMethodField()
    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "customer",
            "customer_name",
            "customer_phone",
            "customer_email",
            "scheduled_at",
            "status",
            "status_display",
            "note",
            "handled_by",
            "handled_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "customer", "handled_by", "created_at"]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()

    def get_handled_by_name(self, obj):
        if obj.handled_by:
            return obj.handled_by.get_full_name() or obj.handled_by.username
        return None


class DepositSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    vehicle_name = serializers.SerializerMethodField()
    confirmed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Deposit
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "customer",
            "customer_name",
            "customer_phone",
            "customer_email",
            "amount",
            "status",
            "status_display",
            "note",
            "confirmed_by",
            "confirmed_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "confirmed_by",
            "created_at",
            "updated_at",
        ]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()

    def get_confirmed_by_name(self, obj):
        if obj.confirmed_by:
            return obj.confirmed_by.get_full_name() or obj.confirmed_by.username
        return None

    def validate_vehicle(self, value):
        from vehicles.models import VehicleUnit

        if value.status not in [VehicleUnit.Status.LISTED, VehicleUnit.Status.RESERVED]:
            raise serializers.ValidationError(
                "Xe phải ở trạng thái 'Đang đăng bán' để đặt cọc."
            )
        if Deposit.objects.filter(
            vehicle=value,
            status=Deposit.Status.CONFIRMED,
        ).exists():
            raise serializers.ValidationError(
                "Xe này đã có đặt cọc được xác nhận. Không thể đặt cọc thêm."
            )
        return value


class VehiclePricingSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    profit = serializers.SerializerMethodField()
    profit_margin = serializers.SerializerMethodField()

    def get_profit(self, obj):
        price = obj.approved_price or obj.target_price
        return float(price) - float(obj.total_cost) if price else 0

    def get_profit_margin(self, obj):
        price = obj.approved_price or obj.target_price
        if not price or float(price) == 0:
            return 0
        return round(((float(price) - float(obj.total_cost)) / float(price)) * 100, 1)


class ListingSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "title",
            "slug",
            "description",
            "listed_price",
            "is_active",
            "is_featured",
            "views_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "views_count", "created_at", "updated_at"]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()

    def validate_vehicle(self, value):
        from vehicles.models import VehicleUnit

        if value.status != VehicleUnit.Status.READY_FOR_SALE:
            raise serializers.ValidationError(
                "Xe phải ở trạng thái 'Sẵn sàng bán' mới được niêm yết."
            )
        return value


class SalesOrderSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    sold_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "customer",
            "customer_name",
            "customer_phone",
            "deposit",
            "sale_price",
            "contract_number",
            "sold_by",
            "sold_by_name",
            "note",
            "sold_at",
        ]
        read_only_fields = ["id", "sold_by", "sold_at"]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()

    def get_sold_by_name(self, obj):
        if obj.sold_by:
            return obj.sold_by.get_full_name() or obj.sold_by.username
        return None


class HandoverSerializer(serializers.ModelSerializer):
    class Meta:
        model = HandoverRecord
        fields = [
            "id",
            "sales_order",
            "handover_date",
            "mileage_at_handover",
            "staff",
            "note",
            "customer_signature",
            "created_at",
        ]
        read_only_fields = ["id", "staff", "created_at"]


class WarrantySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = WarrantyRecord
        fields = [
            "id",
            "sales_order",
            "warranty_months",
            "max_mileage",
            "coverage_note",
            "status",
            "status_display",
            "start_date",
            "end_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_name",
            "action",
            "action_display",
            "model_name",
            "object_id",
            "description",
            "old_value",
            "new_value",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "system"


# ── VehiclePricing serializers ────────────────────────────────


class VehiclePricingSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    vehicle_name = serializers.SerializerMethodField()
    total_cost = serializers.DecimalField(
        max_digits=14, decimal_places=0, read_only=True
    )
    profit = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    profit_margin = serializers.FloatField(read_only=True)

    class Meta:
        model = VehiclePricing
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "purchase_price",
            "refurbish_cost",
            "other_cost",
            "total_cost",
            "target_price",
            "approved_price",
            "profit",
            "profit_margin",
            "note",
            "status",
            "status_display",
            "created_by",
            "created_by_name",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_cost",
            "profit",
            "profit_margin",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.year or ''}".strip()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "—"

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return "—"


class VehiclePricingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiclePricing
        fields = [
            "vehicle",
            "purchase_price",
            "refurbish_cost",
            "other_cost",
            "target_price",
            "note",
        ]

    def validate_vehicle(self, vehicle):
        from vehicles.models import VehicleUnit

        allowed = [
            VehicleUnit.Status.INSPECTED,
            VehicleUnit.Status.READY_FOR_SALE,
            VehicleUnit.Status.WAIT_REFURBISH,
        ]
        if vehicle.status not in allowed:
            raise serializers.ValidationError(
                "Xe phải đã kiểm định hoặc hoàn thành tân trang."
            )
        if (
            hasattr(vehicle, "pricing")
            and vehicle.pricing.status == VehiclePricing.Status.PENDING
        ):
            raise serializers.ValidationError(
                "Xe này đã có phiếu định giá đang chờ phê duyệt."
            )
        return vehicle

    def create(self, validated_data):
        request = self.context.get("request")
        # Tự động lấy chi phí tân trang nếu chưa nhập
        if not validated_data.get("refurbish_cost"):
            vehicle = validated_data["vehicle"]
            try:
                from refurbishment.models import RefurbishmentOrder

                order = vehicle.refurbishment_orders.filter(status="COMPLETED").last()
                if order:
                    validated_data["refurbish_cost"] = order.total_cost()
            except Exception:
                pass
        return VehiclePricing.objects.create(
            **validated_data,
            created_by=request.user if request else None,
        )


class VehiclePricingApproveSerializer(serializers.Serializer):
    approved_price = serializers.DecimalField(
        max_digits=14, decimal_places=0, required=True
    )
    note = serializers.CharField(required=False, allow_blank=True)


# Thêm vào cuối sales/serializers.py


class FavoriteSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    vehicle_thumbnail = serializers.SerializerMethodField()
    vehicle_price = serializers.SerializerMethodField()
    vehicle_status = serializers.SerializerMethodField()
    vehicle_year = serializers.SerializerMethodField()
    vehicle_mileage = serializers.SerializerMethodField()

    class Meta:
        model = Favorite
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "vehicle_thumbnail",
            "vehicle_price",
            "vehicle_status",
            "vehicle_year",
            "vehicle_mileage",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_vehicle_name(self, obj):
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()

    def get_vehicle_thumbnail(self, obj):
        request = self.context.get("request")
        media = obj.vehicle.media.filter(media_type="IMAGE", is_primary=True).first()
        if not media:
            media = obj.vehicle.media.filter(media_type="IMAGE").first()
        if media and request:
            return request.build_absolute_uri(media.file.url)
        return None

    def get_vehicle_price(self, obj):
        return str(obj.vehicle.sale_price) if obj.vehicle.sale_price else None

    def get_vehicle_status(self, obj):
        return obj.vehicle.status

    def get_vehicle_year(self, obj):
        return obj.vehicle.year

    def get_vehicle_mileage(self, obj):
        return obj.vehicle.mileage
