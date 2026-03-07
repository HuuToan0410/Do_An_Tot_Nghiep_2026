from rest_framework import serializers
from vehicles.models import VehicleUnit
from .models import Listing, SalesOrder


class ListingSerializer(serializers.ModelSerializer):
    """
    Serializer cho bài đăng bán xe.
    Chỉ giữ các trường cần thiết để hiển thị và quản lý bài đăng.
    """

    vehicle = serializers.PrimaryKeyRelatedField(
        queryset=VehicleUnit.objects.all(), label="Xe"
    )

    class Meta:
        model = Listing

        fields = [
            "id",
            "vehicle",
            "title",
            "slug",
            "description",
            "listed_price",
            "is_active",
            "views_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "views_count",
            "created_at",
            "updated_at",
        ]


class SalesOrderSerializer(serializers.ModelSerializer):
    """
    Serializer cho giao dịch bán xe.
    Đảm bảo mỗi xe chỉ bán một lần.
    """

    vehicle = serializers.PrimaryKeyRelatedField(
        queryset=VehicleUnit.objects.all(), label="Xe được bán"
    )

    customer = serializers.PrimaryKeyRelatedField(read_only=True, label="Khách hàng")

    class Meta:
        model = SalesOrder

        fields = [
            "id",
            "vehicle",
            "customer",
            "sale_price",
            "contract_number",
            "note",
            "sold_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "customer",
            "sold_at",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        """
        Tự động gán khách hàng từ request.user
        """

        request = self.context.get("request")

        validated_data["customer"] = request.user

        return super().create(validated_data)
