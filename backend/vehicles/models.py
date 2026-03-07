from django.db import models
from django.conf import settings


class VehicleUnit(models.Model):

    class FuelType(models.TextChoices):
        XANG = "GASOLINE", "Xăng"
        DAU = "DIESEL", "Dầu"
        HYBRID = "HYBRID", "Hybrid"
        DIEN = "ELECTRIC", "Điện"

    class Transmission(models.TextChoices):
        SO_SAN = "MANUAL", "Số sàn"
        SO_TU_DONG = "AUTOMATIC", "Số tự động"

    class Status(models.TextChoices):
        MOI_NHAP = "PURCHASED", "Mới nhập"
        CHO_KIEM_DINH = "WAIT_INSPECTION", "Chờ kiểm định"
        DA_KIEM_DINH = "INSPECTED", "Đã kiểm định"
        SAN_SANG_BAN = "READY_FOR_SALE", "Sẵn sàng bán"
        DANG_BAN = "LISTED", "Đang đăng bán"
        DA_BAN = "SOLD", "Đã bán"

    vin = models.CharField(max_length=50, unique=True)

    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()

    mileage = models.PositiveIntegerField()

    transmission = models.CharField(max_length=20, choices=Transmission.choices)

    fuel_type = models.CharField(max_length=20, choices=FuelType.choices)

    color = models.CharField(max_length=50)

    sale_price = models.DecimalField(max_digits=12, decimal_places=2)

    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.MOI_NHAP
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.brand} {self.model} ({self.vin})"


class VehicleSpec(models.Model):

    vehicle = models.OneToOneField(
        VehicleUnit, on_delete=models.CASCADE, related_name="spec"
    )

    engine_capacity = models.FloatField(null=True, blank=True)

    body_type = models.CharField(
        max_length=50,
        choices=[
            ("SEDAN", "Sedan"),
            ("SUV", "SUV"),
            ("HATCHBACK", "Hatchback"),
            ("PICKUP", "Pickup"),
        ],
    )

    doors = models.IntegerField(default=4)
    seats = models.IntegerField(default=5)

    origin = models.CharField(
        max_length=50,
        choices=[
            ("TRONG_NUOC", "Trong nước"),
            ("NHAP_KHAU", "Nhập khẩu"),
        ],
        blank=True,
    )

    has_abs = models.BooleanField(default=False)
    has_airbags = models.BooleanField(default=False)
    has_camera = models.BooleanField(default=False)

    def __str__(self):
        return f"Thông số {self.vehicle}"


class VehicleMedia(models.Model):

    class MediaType(models.TextChoices):
        HINH_ANH = "IMAGE", "Hình ảnh"
        VIDEO = "VIDEO", "Video"

    vehicle = models.ForeignKey(
        VehicleUnit, on_delete=models.CASCADE, related_name="media"
    )

    file = models.FileField(upload_to="vehicles/")

    media_type = models.CharField(
        max_length=20, choices=MediaType.choices, default=MediaType.HINH_ANH
    )

    is_primary = models.BooleanField(default=False)

    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.vehicle}"


class VehicleStatusLog(models.Model):

    vehicle = models.ForeignKey(
        VehicleUnit, on_delete=models.CASCADE, related_name="status_logs"
    )

    old_status = models.CharField(max_length=30, choices=VehicleUnit.Status.choices)

    new_status = models.CharField(max_length=30, choices=VehicleUnit.Status.choices)

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    note = models.TextField(blank=True)

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.vehicle} : {self.old_status} -> {self.new_status}"

