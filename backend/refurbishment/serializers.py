from django.db.models import Sum
from rest_framework import serializers

from .models import RefurbishmentOrder, RefurbishmentItem


class RefurbishmentItemSerializer(serializers.ModelSerializer):
    """
    Serializer cho từng hạng mục sửa chữa.

    Chỉ expose các trường cần thiết để tránh
    payload API quá lớn.
    """

    class Meta:
        model = RefurbishmentItem

        fields = (
            "id",
            "name",
            "cost",
            "description",
            "created_at",
        )

        read_only_fields = (
            "id",
            "created_at",
        )

    def validate_cost(self, value):
        """
        Kiểm tra chi phí hợp lệ
        """
        if value < 0:
            raise serializers.ValidationError("Chi phí phải lớn hơn hoặc bằng 0")
        return value


class RefurbishmentOrderSerializer(serializers.ModelSerializer):
    """
    Serializer cho lệnh sửa chữa / tân trang xe.

    Bao gồm:
    - thông tin xe
    - kỹ thuật viên
    - danh sách hạng mục sửa chữa
    - tổng chi phí
    """

    items = RefurbishmentItemSerializer(many=True)

    technician_name = serializers.CharField(
        source="technician.username",
        read_only=True,
    )

    vehicle_vin = serializers.CharField(
        source="vehicle.vin",
        read_only=True,
    )

    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = RefurbishmentOrder

        fields = (
            "id",
            "vehicle",
            "vehicle_vin",
            "technician",
            "technician_name",
            "status",
            "note",
            "start_date",
            "completed_date",
            "items",
            "total_cost",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "start_date",
            "created_at",
            "updated_at",
        )

    def get_total_cost(self, obj):
        """
        Tính tổng chi phí sửa chữa.

        Sử dụng aggregate để tránh load toàn bộ items vào memory.
        """

        result = obj.items.aggregate(total=Sum("cost"))

        return result["total"] or 0

    def create(self, validated_data):
        """
        Tạo lệnh sửa chữa kèm danh sách hạng mục.
        """

        items_data = validated_data.pop("items", [])

        order = RefurbishmentOrder.objects.create(**validated_data)

        items = [RefurbishmentItem(order=order, **item) for item in items_data]

        RefurbishmentItem.objects.bulk_create(items)

        return order

    def update(self, instance, validated_data):
        """
        Cập nhật lệnh sửa chữa và các hạng mục.
        """

        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if items_data is not None:

            instance.items.all().delete()

            items = [RefurbishmentItem(order=instance, **item) for item in items_data]

            RefurbishmentItem.objects.bulk_create(items)

        return instance
