# inspections/serializers.py — FIX ĐÚNG THEO MODEL THỰC TẾ
#
# Model Inspection CÓ: vehicle, inspector, status, quality_grade,
#   overall_score, conclusion, recommendation, inspection_date,
#   is_public, created_at, updated_at
#
# Model KHÔNG CÓ: scheduled_date, result_note,
#   engine_score, body_score, interior_score, electrical_score
#
# → Các field không có trên model phải dùng SerializerMethodField,
#   KHÔNG được đưa vào Meta.fields[]

from collections import defaultdict

from rest_framework import serializers
from inspections.models import Inspection, InspectionCategory, InspectionItem


# ── Item serializers ───────────────────────────────────────────


class InspectionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionCategory
        fields = ["id", "name", "display_order"]


class InspectionItemSerializer(serializers.ModelSerializer):
    condition_display = serializers.CharField(
        source="get_condition_display", read_only=True
    )
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = InspectionItem
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "condition",
            "condition_display",
            "score",
            "note",
            "image",
            "needs_repair",
            "estimated_repair_cost",
        ]


# ── Helpers ────────────────────────────────────────────────────


def _vehicle_name(obj) -> str:
    try:
        v = obj.vehicle
        return f"{v.brand} {v.model} {v.variant or ''} {v.year or ''}".strip()
    except Exception:
        return f"Xe #{obj.vehicle_id}"


def _inspector_name(obj) -> str:
    try:
        if obj.inspector:
            return obj.inspector.get_full_name() or obj.inspector.username
    except Exception:
        pass
    return "Chưa phân công"


def _phone(obj) -> str:
    try:
        if obj.inspector and hasattr(obj.inspector, "phone") and obj.inspector.phone:
            return obj.inspector.phone
    except Exception:
        pass
    return ""


def _customer_name(obj) -> str:
    try:
        deposit = obj.vehicle.deposits.filter(
            status__in=["PENDING", "CONFIRMED"]
        ).first()
        if deposit:
            return deposit.customer_name or ""
    except Exception:
        pass
    return ""


def _category_avg(obj, keyword: str):
    """Tính điểm TB từ items theo tên category."""
    try:
        scores = [
            float(item.score)
            for item in obj.items.all()
            if item.score is not None
            and item.category
            and keyword.lower() in item.category.name.lower()
        ]
        if scores:
            return round(sum(scores) / len(scores), 1)
    except Exception:
        pass
    return None


# ── InspectionListSerializer ───────────────────────────────────
# Dùng cho GET /api/inspections/ — bảng admin


class InspectionListSerializer(serializers.ModelSerializer):
    # Fields CÓ trên model — khai báo trực tiếp
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    quality_grade_display = serializers.CharField(
        source="get_quality_grade_display", read_only=True
    )

    # Fields KHÔNG có trên model → SerializerMethodField
    vehicle_name = serializers.SerializerMethodField()
    inspector_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    scheduled_date = serializers.SerializerMethodField()  # alias cho inspection_date
    result_note = serializers.SerializerMethodField()  # alias cho conclusion
    engine_score = serializers.SerializerMethodField()
    body_score = serializers.SerializerMethodField()
    interior_score = serializers.SerializerMethodField()
    electrical_score = serializers.SerializerMethodField()

    class Meta:
        model = Inspection
        # CHỈ liệt kê fields THỰC SỰ CÓ trên model + SerializerMethodField
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "inspector",
            "inspector_name",
            "customer_name",
            "phone",
            "status",
            "status_display",
            "quality_grade",
            "quality_grade_display",
            "overall_score",
            "conclusion",
            "recommendation",
            "inspection_date",
            "is_public",
            "created_at",
            # SerializerMethodField — không có trên model
            "scheduled_date",
            "result_note",
            "engine_score",
            "body_score",
            "interior_score",
            "electrical_score",
        ]

    def get_vehicle_name(self, obj):
        return _vehicle_name(obj)

    def get_inspector_name(self, obj):
        return _inspector_name(obj)

    def get_customer_name(self, obj):
        return _customer_name(obj)

    def get_phone(self, obj):
        return _phone(obj)

    def get_scheduled_date(self, obj):
        # Model chỉ có inspection_date, trả về đó
        val = obj.inspection_date
        return str(val) if val else None

    def get_result_note(self, obj):
        # Model có conclusion và recommendation, không có result_note
        return obj.conclusion or obj.recommendation or ""

    def get_engine_score(self, obj):
        return _category_avg(obj, "động cơ")

    def get_body_score(self, obj):
        return _category_avg(obj, "thân xe")

    def get_interior_score(self, obj):
        return _category_avg(obj, "nội thất")

    def get_electrical_score(self, obj):
        return _category_avg(obj, "điện")


# ── InspectionDetailSerializer ─────────────────────────────────


class InspectionDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    quality_grade_display = serializers.CharField(
        source="get_quality_grade_display", read_only=True
    )
    vehicle_name = serializers.SerializerMethodField()
    inspector_name = serializers.SerializerMethodField()
    items = InspectionItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    passed_items = serializers.SerializerMethodField()
    needs_repair_count = serializers.SerializerMethodField()
    scheduled_date = serializers.SerializerMethodField()
    result_note = serializers.SerializerMethodField()

    class Meta:
        model = Inspection
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "inspector",
            "inspector_name",
            "status",
            "status_display",
            "quality_grade",
            "quality_grade_display",
            "overall_score",
            "conclusion",
            "recommendation",
            "inspection_date",
            "is_public",
            "items",
            "total_items",
            "passed_items",
            "needs_repair_count",
            "created_at",
            "updated_at",
            # aliases
            "scheduled_date",
            "result_note",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_vehicle_name(self, obj):
        return _vehicle_name(obj)

    def get_inspector_name(self, obj):
        return _inspector_name(obj)

    def get_scheduled_date(self, obj):
        return str(obj.inspection_date) if obj.inspection_date else None

    def get_result_note(self, obj):
        return obj.conclusion or obj.recommendation or ""

    def get_total_items(self, obj):
        try:
            return obj.items.count()
        except Exception:
            return 0

    def get_passed_items(self, obj):
        try:
            return obj.items.filter(condition__in=["GOOD", "FAIR"]).count()
        except Exception:
            return 0

    def get_needs_repair_count(self, obj):
        try:
            return obj.items.filter(needs_repair=True).count()
        except Exception:
            return 0


# ── InspectionPublicSerializer ─────────────────────────────────


class InspectionPublicSerializer(serializers.ModelSerializer):
    quality_grade_display = serializers.CharField(
        source="get_quality_grade_display", read_only=True
    )
    inspector_name = serializers.SerializerMethodField()
    vehicle_name = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    passed_count = serializers.SerializerMethodField()
    failed_count = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Inspection
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "inspector_name",
            "quality_grade",
            "quality_grade_display",
            "overall_score",
            "conclusion",
            "recommendation",
            "inspection_date",
            "categories",
            "passed_count",
            "failed_count",
            "total_items",
            "created_at",
        ]

    def get_inspector_name(self, obj):
        return _inspector_name(obj) or "Kỹ thuật viên AUTO Leng Art"

    def get_vehicle_name(self, obj):
        return _vehicle_name(obj)

    def get_categories(self, obj):
        groups = defaultdict(list)
        try:
            for item in obj.items.select_related("category").order_by(
                "category__display_order", "category__name", "name"
            ):
                cat_name = item.category.name if item.category else "Khác"
                groups[cat_name].append(
                    {
                        "id": item.id,
                        "name": item.name,
                        "condition": item.condition,
                        "condition_display": item.get_condition_display(),
                        "score": item.score,
                        "note": item.note or "",
                        "needs_repair": item.needs_repair,
                        "estimated_repair_cost": str(item.estimated_repair_cost or 0),
                        "is_passed": item.condition in ("GOOD", "FAIR"),
                    }
                )
        except Exception:
            pass
        return [{"category": cat, "items": items} for cat, items in groups.items()]

    def get_passed_count(self, obj):
        try:
            return obj.items.filter(condition__in=["GOOD", "FAIR"]).count()
        except Exception:
            return 0

    def get_failed_count(self, obj):
        try:
            return obj.items.filter(condition__in=["POOR", "FAILED"]).count()
        except Exception:
            return 0

    def get_total_items(self, obj):
        try:
            return obj.items.count()
        except Exception:
            return 0


# ── Create Serializers ─────────────────────────────────────────


class InspectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inspection
        # Chỉ fields có trên model
        fields = ["vehicle", "inspection_date", "note"]

    def validate(self, attrs):
        # Model không có field 'note', map về conclusion nếu cần
        return attrs

    def validate_vehicle(self, value):
        from vehicles.models import VehicleUnit

        allowed = [VehicleUnit.Status.WAIT_INSPECTION, VehicleUnit.Status.INSPECTING]
        if value.status not in allowed:
            raise serializers.ValidationError(
                "Xe phải ở trạng thái 'Chờ kiểm định' hoặc 'Đang kiểm định'."
            )
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        # Map note → conclusion nếu model không có field note
        note = validated_data.pop("note", "")
        return Inspection.objects.create(
            **validated_data,
            conclusion=note,
            inspector=request.user if request else None,
        )


class InspectionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = [
            "category",
            "name",
            "condition",
            "score",
            "note",
            "image",
            "needs_repair",
            "estimated_repair_cost",
        ]
