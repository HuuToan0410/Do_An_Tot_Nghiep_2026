import datetime
from rest_framework import serializers

from vehicles.models import (
    VehicleMedia,
    VehicleSpec,
    VehicleStatusLog,
    VehicleUnit,
)


# ── Media ──────────────────────────────────────────────────────


class VehicleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleMedia
        fields = [
            "id",
            "file",
            "media_type",
            "is_primary",
            "caption",
            "display_order",
        ]


# ── Spec ───────────────────────────────────────────────────────


class VehicleSpecSerializer(serializers.ModelSerializer):
    body_type_display = serializers.CharField(
        source="get_body_type_display", read_only=True
    )
    origin_display = serializers.CharField(source="get_origin_display", read_only=True)

    class Meta:
        model = VehicleSpec
        fields = [
            "id",
            "body_type",
            "body_type_display",
            "engine_capacity",
            "horsepower",
            "doors",
            "seats",
            "origin",
            "origin_display",
            "has_abs",
            "has_airbags",
            "airbag_count",
            "has_camera",
            "has_360_camera",
            "has_sunroof",
            "tire_condition",
            "brake_condition",
            "engine_condition",
            "electrical_condition",
        ]


# ── Status Log ─────────────────────────────────────────────────


class VehicleStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VehicleStatusLog
        fields = [
            "id",
            "old_status",
            "new_status",
            "changed_by",
            "changed_by_name",
            "note",
            "changed_at",
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return "system"


# ── List (nhẹ) ─────────────────────────────────────────────────


class VehicleListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    fuel_type_display = serializers.CharField(
        source="get_fuel_type_display", read_only=True
    )
    transmission_display = serializers.CharField(
        source="get_transmission_display", read_only=True
    )
    thumbnail = serializers.SerializerMethodField()
    has_appointment = serializers.SerializerMethodField()

    class Meta:
        model = VehicleUnit
        fields = [
            "id",
            "vin",
            "brand",
            "model",
            "variant",
            "year",
            "mileage",
            "color",
            "fuel_type",
            "fuel_type_display",
            "transmission",
            "transmission_display",
            "sale_price",
            "status",
            "status_display",
            "thumbnail",
            "created_at",
            "has_appointment",
        ]

    def get_thumbnail(self, obj):
        primary = obj.media.filter(is_primary=True, media_type="IMAGE").first()
        if not primary:
            primary = obj.media.filter(media_type="IMAGE").first()
        if primary:
            request = self.context.get("request")
            return request.build_absolute_uri(primary.file.url) if request else primary.file.url
        return None
    def get_has_appointment(self, obj):
        """True nếu xe có lịch hẹn PENDING hoặc CONFIRMED đang chờ."""
        try:
            return any(
                a.status in ("PENDING", "CONFIRMED")
                for a in obj.appointments.all()
            )
        except Exception:
            return False
# ── Detail (đầy đủ) ────────────────────────────────────────────


class VehicleDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    fuel_type_display = serializers.CharField(
        source="get_fuel_type_display", read_only=True
    )
    transmission_display = serializers.CharField(
        source="get_transmission_display", read_only=True
    )
    spec = VehicleSpecSerializer(read_only=True)
    media = VehicleMediaSerializer(many=True, read_only=True)
    status_logs = VehicleStatusLogSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VehicleUnit
        fields = [
            "id",
            "vin",
            "license_plate",
            "brand",
            "model",
            "variant",
            "year",
            "mileage",
            "color",
            "fuel_type",
            "fuel_type_display",
            "transmission",
            "transmission_display",
            "sale_price",
            "purchase_price",
            "purchase_date",
            "purchase_note",
            "description",
            "status",
            "status_display",
            "spec",
            "media",
            "status_logs",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status_logs", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "system"


# ── Create ─────────────────────────────────────────────────────


class VehicleCreateSerializer(serializers.ModelSerializer):
    """
    Tạo xe mới — nhân viên thu mua.
    Nhận thêm `body_type` để tạo VehicleSpec tương ứng.
    """

    # body_type lưu vào VehicleSpec, không phải VehicleUnit
    body_type = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        label="Kiểu dáng xe",
    )

    class Meta:
        model = VehicleUnit
        fields = [
            "id",
            "vin",
            "license_plate",
            "brand",
            "model",
            "variant",
            "year",
            "mileage",
            "color",
            "fuel_type",
            "transmission",
            "purchase_price",
            "purchase_date",
            "purchase_note",
            "sale_price",  # ← bắt buộc để FE nhận giá
            "description",
            "status",
            "body_type",  # ← write-only, dùng để tạo VehicleSpec
        ]
        read_only_fields = ["id"]

    # ── Validators ──────────────────────────────────────────────

    def validate_vin(self, value: str) -> str:
        value = value.strip().upper()
        if VehicleUnit.objects.filter(vin=value).exists():
            raise serializers.ValidationError(
                "Số khung (VIN) này đã tồn tại trong hệ thống."
            )
        return value

    def validate_year(self, value: int) -> int:
        current_year = datetime.date.today().year
        if value < 1990 or value > current_year + 1:
            raise serializers.ValidationError(
                f"Năm sản xuất phải từ 1990 đến {current_year + 1}."
            )
        return value

    def validate_mileage(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("Số km không thể âm.")
        return value

    def validate_sale_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Giá bán không thể âm.")
        return value

    # ── Create ──────────────────────────────────────────────────

    def create(self, validated_data):
        # Tách body_type ra — không phải field của VehicleUnit
        body_type = validated_data.pop("body_type", None)

        request = self.context.get("request")
        vehicle = VehicleUnit.objects.create(
            **validated_data,
            created_by=request.user if request else None,
        )

        # Tạo VehicleSpec nếu có body_type
        if body_type:
            VehicleSpec.objects.get_or_create(
                vehicle=vehicle,
                defaults={"body_type": body_type},
            )
        else:
            # Tạo spec rỗng để sau này có thể cập nhật
            VehicleSpec.objects.get_or_create(vehicle=vehicle)

        return vehicle


# ── Update (PATCH) ─────────────────────────────────────────────


class VehicleUpdateSerializer(serializers.ModelSerializer):
    """
    Cập nhật thông tin xe — PATCH /api/admin/vehicles/<id>/
    Cũng nhận body_type để cập nhật VehicleSpec.
    """

    body_type = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        label="Kiểu dáng xe",
    )

    class Meta:
        model = VehicleUnit
        fields = [
            "vin",
            "license_plate",
            "brand",
            "model",
            "variant",
            "year",
            "mileage",
            "color",
            "fuel_type",
            "transmission",
            "purchase_price",
            "purchase_date",
            "purchase_note",
            "sale_price",
            "description",
            "status",
            "body_type",
        ]

    def validate_vin(self, value: str) -> str:
        value = value.strip().upper()
        instance = self.instance
        qs = VehicleUnit.objects.filter(vin=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Số khung (VIN) này đã tồn tại trong hệ thống."
            )
        return value

    def update(self, instance, validated_data):
        body_type = validated_data.pop("body_type", None)

        # Cập nhật VehicleUnit fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Cập nhật VehicleSpec.body_type nếu có
        if body_type is not None:
            spec, _ = VehicleSpec.objects.get_or_create(vehicle=instance)
            spec.body_type = body_type
            spec.save(update_fields=["body_type"])

        return instance


# ── Transition ─────────────────────────────────────────────────


class VehicleTransitionSerializer(serializers.Serializer):
    """
    Chuyển trạng thái xe.
    POST /api/admin/vehicles/<id>/transition/
    Body: { "new_status": "WAIT_INSPECTION", "note": "..." }
    """

    ALLOWED_TRANSITIONS = {
        VehicleUnit.Status.PURCHASED: [VehicleUnit.Status.WAIT_INSPECTION],
        VehicleUnit.Status.WAIT_INSPECTION: [VehicleUnit.Status.INSPECTING],
        VehicleUnit.Status.INSPECTING: [
            VehicleUnit.Status.INSPECTED,
            VehicleUnit.Status.WAIT_INSPECTION,
        ],
        VehicleUnit.Status.INSPECTED: [
            VehicleUnit.Status.WAIT_REFURBISH,
            VehicleUnit.Status.READY_FOR_SALE,
        ],
        VehicleUnit.Status.WAIT_REFURBISH: [VehicleUnit.Status.REFURBISHING],
        VehicleUnit.Status.REFURBISHING: [VehicleUnit.Status.READY_FOR_SALE],
        VehicleUnit.Status.READY_FOR_SALE: [VehicleUnit.Status.LISTED],
        VehicleUnit.Status.LISTED: [
            VehicleUnit.Status.RESERVED,
            VehicleUnit.Status.READY_FOR_SALE,
        ],
        VehicleUnit.Status.RESERVED: [
            VehicleUnit.Status.SOLD,
            VehicleUnit.Status.LISTED,
        ],
        VehicleUnit.Status.SOLD: [VehicleUnit.Status.WARRANTY],
    }

    new_status = serializers.ChoiceField(
        choices=VehicleUnit.Status.choices,
        label="Trạng thái mới",
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        label="Ghi chú",
    )

    def validate(self, attrs):
        vehicle = self.context["vehicle"]
        new_status = attrs["new_status"]
        allowed = self.ALLOWED_TRANSITIONS.get(vehicle.status, [])

        if new_status not in allowed:
            allowed_labels = [
                dict(VehicleUnit.Status.choices).get(s, s) for s in allowed
            ]
            raise serializers.ValidationError(
                {
                    "new_status": (
                        f"Không thể chuyển từ '{vehicle.get_status_display()}' "
                        f"sang '{dict(VehicleUnit.Status.choices).get(new_status)}'. "
                        f"Chỉ được chuyển sang: {', '.join(allowed_labels) or 'không có'}."
                    )
                }
            )
        return attrs
