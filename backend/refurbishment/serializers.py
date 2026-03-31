from rest_framework import serializers
from refurbishment.models import RefurbishmentItem, RefurbishmentOrder


class RefurbishmentItemSerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(
        source="get_item_type_display", read_only=True
    )
    cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = RefurbishmentItem
        fields = [
            "id",
            "name",
            "item_type",
            "item_type_display",
            "quantity",
            "unit_cost",
            "cost",
            "description",
            "is_completed",
            "created_at",
        ]
        read_only_fields = ["id", "cost", "created_at"]


# refurbishment/serializers.py
class RefurbishmentOrderSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder
        fields = "__all__"

    def get_vehicle_name(self, obj):
        return f"{obj.vehicle.brand} {obj.vehicle.model} {obj.vehicle.year}"

    def get_technician_name(self, obj):
        return obj.technician.get_full_name() if obj.technician else ""


""" class RefurbishmentOrderSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder
        fields = "__all__"

    def get_vehicle_name(self, obj):
        return str(obj.vehicle)

    def get_technician_name(self, obj):
        if obj.technician:
            return obj.technician.get_full_name()
        return "" """


class RefurbishmentListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    technician_name = serializers.CharField(
        source="technician.get_full_name", read_only=True
    )
    vehicle_name = serializers.CharField(source="vehicle.display_name", read_only=True)
    """ total_cost = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True, source="total_cost"
    ) """
    total_cost = serializers.SerializerMethodField()

    def get_total_cost(self, obj):
        return obj.total_cost

    class Meta:
        model = RefurbishmentOrder
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "technician",
            "technician_name",
            "status",
            "status_display",
            "total_cost",
            "start_date",
            "completed_date",
            "created_at",
        ]


""" class RefurbishmentListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    technician_name = serializers.SerializerMethodField()
    vehicle_name = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "technician",
            "technician_name",
            "status",
            "status_display",
            "total_cost",
            "start_date",
            "completed_date",
            "created_at",
        ]

    def get_technician_name(self, obj):
        if obj.technician:
            return obj.technician.get_full_name()
        return ""

    def get_vehicle_name(self, obj):
        return str(obj.vehicle)

    def get_total_cost(self, obj):
        try:
            return obj.total_cost()
        except Exception:
            return 0   """


class RefurbishmentDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    technician_name = serializers.CharField(
        source="technician.get_full_name", read_only=True
    )
    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name", read_only=True
    )
    vehicle_name = serializers.CharField(source="vehicle.display_name", read_only=True)
    items = RefurbishmentItemSerializer(many=True, read_only=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "technician",
            "technician_name",
            "approved_by",
            "approved_by_name",
            "status",
            "status_display",
            "note",
            "items",
            "total_cost",
            "start_date",
            "completed_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_total_cost(self, obj):
        return obj.total_cost


""" class RefurbishmentDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    technician_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    vehicle_name = serializers.SerializerMethodField()
    items = RefurbishmentItemSerializer(many=True, read_only=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder
        fields = [
            "id",
            "vehicle",
            "vehicle_name",
            "technician",
            "technician_name",
            "approved_by",
            "approved_by_name",
            "status",
            "status_display",
            "note",
            "items",
            "total_cost",
            "start_date",
            "completed_date",
            "created_at",
            "updated_at",
        ]

    def get_vehicle_name(self, obj):
        return str(obj.vehicle)

    def get_technician_name(self, obj):
        if obj.technician:
            return obj.technician.get_full_name()
        return ""

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return ""

    def get_total_cost(self, obj):
        try:
            return obj.total_cost()
        except Exception:
            return 0 """


class RefurbishmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefurbishmentOrder
        fields = ["vehicle", "technician", "note", "start_date"]

    def validate_vehicle(self, value):
        from vehicles.models import VehicleUnit

        allowed = [
            VehicleUnit.Status.WAIT_REFURBISH,
            VehicleUnit.Status.REFURBISHING,
        ]
        if value.status not in allowed:
            raise serializers.ValidationError(
                "Xe phải ở trạng thái 'Chờ tân trang' hoặc 'Đang tân trang'."
            )
        return value
