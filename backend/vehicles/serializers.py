
from rest_framework import serializers
from datetime import date
from .models import VehicleUnit


class VehicleSerializer(serializers.ModelSerializer):

    # cache current year (performance)
    CURRENT_YEAR = date.today().year

    # computed field
    vehicle_age = serializers.SerializerMethodField()

    price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0
    )

    mileage = serializers.IntegerField(
        min_value=0
    )

    class Meta:
        model = VehicleUnit

        fields = [
            "id",
            "brand",
            "model",
            "year",
            "price",
            "mileage",
            "color",
            "fuel_type",
            "transmission",
            "status",
            "created_at",
            "updated_at",
            "vehicle_age"
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "vehicle_age"
        ]

    # --------------------------------------------------
    # Computed Field
    # --------------------------------------------------

    def get_vehicle_age(self, obj):
        """
        Calculate vehicle age based on manufacturing year
        """
        return self.CURRENT_YEAR - obj.year

    # --------------------------------------------------
    # Field Level Validation
    # --------------------------------------------------

    def validate_year(self, value):
        """
        Validate manufacturing year
        """

        if value > self.CURRENT_YEAR:
            raise serializers.ValidationError(
                "Năm sản xuất không thể lớn hơn năm hiện tại"
            )

        if value < 1990:
            raise serializers.ValidationError(
                "Xe quá cũ để đăng bán trên hệ thống"
            )

        return value

    def validate_price(self, value):
        """
        Validate vehicle price
        """

        if value < 100_000_000:
            raise serializers.ValidationError(
                "Giá xe phải tối thiểu 100 triệu VNĐ"
            )

        return value

    def validate_mileage(self, value):
        """
        Validate mileage
        """

        if value > 1_000_000:
            raise serializers.ValidationError(
                "Số km quá lớn, dữ liệu không hợp lệ"
            )

        return value

    # --------------------------------------------------
    # Object Level Validation
    # --------------------------------------------------

    def validate(self, data):
        """
        Cross-field validation
        """

        year = data.get("year")
        mileage = data.get("mileage")

        if year and mileage:

            vehicle_age = self.CURRENT_YEAR - year

            # xe cũ nhưng km quá thấp
            if vehicle_age > 10 and mileage < 5000:
                raise serializers.ValidationError(
                    "Xe quá cũ nhưng số km quá thấp, dữ liệu không hợp lệ"
                )

            # xe mới nhưng km quá cao
            if vehicle_age < 2 and mileage > 150000:
                raise serializers.ValidationError(
                    "Xe quá mới nhưng số km quá cao"
                )

        return data