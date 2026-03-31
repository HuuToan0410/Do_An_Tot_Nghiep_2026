from django.conf import settings
from django.db import models


class VehicleUnit(models.Model):
    """
    Đơn vị xe — mỗi xe là một bản ghi duy nhất (unique item).
    Quản lý toàn bộ vòng đời từ thu mua đến bán hàng.
    """

    # vehicles/models.py — thêm property vào class VehicleUnit
    @property
    def display_name(self):
        parts = []

        if self.brand:
            parts.append(str(self.brand))

        if self.model:
            parts.append(str(self.model))

        if self.variant:
            parts.append(str(self.variant))

        if self.year:
            parts.append(str(self.year))

        return " ".join(parts)

    class FuelType(models.TextChoices):
        GASOLINE = "GASOLINE", "Xăng"
        DIESEL = "DIESEL", "Dầu diesel"
        HYBRID = "HYBRID", "Hybrid"
        ELECTRIC = "ELECTRIC", "Điện"

    class Transmission(models.TextChoices):
        MANUAL = "MANUAL", "Số sàn"
        AUTOMATIC = "AUTOMATIC", "Số tự động"
        CVT = "CVT", "CVT"

    class Status(models.TextChoices):
        PURCHASED = "PURCHASED", "Mới thu mua"
        WAIT_INSPECTION = "WAIT_INSPECTION", "Chờ kiểm định"
        INSPECTING = "INSPECTING", "Đang kiểm định"
        INSPECTED = "INSPECTED", "Đã kiểm định"
        WAIT_REFURBISH = "WAIT_REFURBISH", "Chờ tân trang"
        REFURBISHING = "REFURBISHING", "Đang tân trang"
        READY_FOR_SALE = "READY_FOR_SALE", "Sẵn sàng bán"
        LISTED = "LISTED", "Đang đăng bán"
        RESERVED = "RESERVED", "Đã giữ chỗ (đặt cọc)"
        SOLD = "SOLD", "Đã bán"
        WARRANTY = "WARRANTY", "Đang bảo hành"

    # ── Thông tin nhận dạng ──────────────────────────────────────
    vin = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Số khung (VIN nội bộ)",
    )

    license_plate = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Biển số xe",
    )

    # ── Thông số cơ bản ──────────────────────────────────────────
    brand = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Hãng xe",
    )

    model = models.CharField(
        max_length=100,
        verbose_name="Dòng xe",
    )

    variant = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Phiên bản",
    )

    year = models.PositiveIntegerField(
        verbose_name="Năm sản xuất",
    )

    mileage = models.PositiveIntegerField(
        verbose_name="Số km đã đi",
    )

    color = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Màu sắc",
    )

    transmission = models.CharField(
        max_length=20,
        choices=Transmission.choices,
        verbose_name="Hộp số",
    )

    fuel_type = models.CharField(
        max_length=20,
        choices=FuelType.choices,
        verbose_name="Nhiên liệu",
    )

    # ── Giá bán niêm yết ─────────────────────────────────────────
    sale_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Giá bán niêm yết",
    )

    description = models.TextField(
        blank=True,
        verbose_name="Mô tả xe",
    )

    # ── Trạng thái vòng đời ──────────────────────────────────────
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PURCHASED,
        db_index=True,
        verbose_name="Trạng thái",
    )

    # ── Nguồn gốc thu mua ────────────────────────────────────────
    purchase_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Giá thu mua",
    )

    purchase_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày thu mua",
    )

    purchase_note = models.TextField(
        blank=True,
        verbose_name="Ghi chú thu mua",
    )

    # ── Người tạo hồ sơ ─────────────────────────────────────────
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vehicles_created",
        verbose_name="Người tạo hồ sơ",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ngày cập nhật",
    )

    class Meta:
        db_table = "vehicle_unit"
        verbose_name = "Xe"
        verbose_name_plural = "Danh sách xe"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["status"]),
            models.Index(fields=["year"]),
            models.Index(fields=["sale_price"]),
        ]

    def __str__(self):
        return f"{self.brand} {self.model} {self.year} [{self.vin}]"

    @property
    def display_name(self):
        return f"{self.brand} {self.model} {self.variant} {self.year}".strip()

    def can_be_listed(self):
        """Chỉ xe ở trạng thái READY_FOR_SALE mới được niêm yết"""
        return self.status == self.Status.READY_FOR_SALE


class VehicleSpec(models.Model):
    """
    Thông số kỹ thuật chi tiết của xe.
    Quan hệ 1-1 với VehicleUnit.
    """

    class BodyType(models.TextChoices):
        SEDAN = "SEDAN", "Sedan"
        SUV = "SUV", "SUV"
        CUV = "CUV", "CUV"
        HATCHBACK = "HATCHBACK", "Hatchback"
        MPV = "MPV", "MPV"
        PICKUP = "PICKUP", "Bán tải"
        COUPE = "COUPE", "Coupe"
        CROSSOVER = "CROSSOVER", "Crossover"

    class Origin(models.TextChoices):
        DOMESTIC = "DOMESTIC", "Trong nước"
        IMPORTED = "IMPORTED", "Nhập khẩu"

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="spec",
        verbose_name="Xe",
    )

    body_type = models.CharField(
        max_length=20,
        choices=BodyType.choices,
        blank=True,
        verbose_name="Kiểu dáng xe",
    )

    engine_capacity = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Dung tích động cơ (L)",
    )

    horsepower = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Công suất (HP)",
    )

    doors = models.PositiveSmallIntegerField(
        default=4,
        verbose_name="Số cửa",
    )

    seats = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Số chỗ ngồi",
    )

    origin = models.CharField(
        max_length=20,
        choices=Origin.choices,
        blank=True,
        verbose_name="Xuất xứ",
    )

    # ── Trang bị an toàn ─────────────────────────────────────────
    has_abs = models.BooleanField(
        default=False,
        verbose_name="Phanh ABS",
    )

    has_airbags = models.BooleanField(
        default=False,
        verbose_name="Túi khí",
    )

    airbag_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Số túi khí",
    )

    has_camera = models.BooleanField(
        default=False,
        verbose_name="Camera lùi",
    )

    has_360_camera = models.BooleanField(
        default=False,
        verbose_name="Camera 360",
    )

    has_sunroof = models.BooleanField(
        default=False,
        verbose_name="Cửa sổ trời",
    )

    # ── Tình trạng thực tế ───────────────────────────────────────
    tire_condition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Tình trạng lốp",
    )

    brake_condition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Tình trạng phanh",
    )

    engine_condition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Tình trạng động cơ",
    )

    electrical_condition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Tình trạng hệ thống điện",
    )

    class Meta:
        db_table = "vehicle_spec"
        verbose_name = "Thông số kỹ thuật"
        verbose_name_plural = "Thông số kỹ thuật"

    def __str__(self):
        return f"Thông số: {self.vehicle.display_name}"


class VehicleMedia(models.Model):
    """
    Hình ảnh và video của xe.
    """

    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", "Hình ảnh"
        VIDEO = "VIDEO", "Video"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="media",
        verbose_name="Xe",
    )

    file = models.FileField(
        upload_to="vehicles/media/",
        verbose_name="File",
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
        verbose_name="Loại media",
    )

    is_primary = models.BooleanField(
        default=False,
        verbose_name="Ảnh đại diện",
    )

    caption = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Chú thích",
    )

    display_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Thứ tự hiển thị",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tải lên",
    )

    class Meta:
        db_table = "vehicle_media"
        verbose_name = "Media xe"
        verbose_name_plural = "Media xe"
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return f"{self.get_media_type_display()} — {self.vehicle}"


class VehicleStatusLog(models.Model):
    """
    Lịch sử thay đổi trạng thái xe — audit trail bắt buộc.
    Mọi thay đổi trạng thái phải được ghi lại.
    """

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="status_logs",
        verbose_name="Xe",
    )

    old_status = models.CharField(
        max_length=30,
        choices=VehicleUnit.Status.choices,
        verbose_name="Trạng thái trước",
    )

    new_status = models.CharField(
        max_length=30,
        choices=VehicleUnit.Status.choices,
        verbose_name="Trạng thái mới",
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="status_changes",
        verbose_name="Người thực hiện",
    )

    note = models.TextField(
        blank=True,
        verbose_name="Ghi chú",
    )

    changed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm thay đổi",
    )

    class Meta:
        db_table = "vehicle_status_log"
        verbose_name = "Lịch sử trạng thái xe"
        verbose_name_plural = "Lịch sử trạng thái xe"
        ordering = ["-changed_at"]

    def __str__(self):
        return (
            f"{self.vehicle} | "
            f"{self.old_status} → {self.new_status} | "
            f"{self.changed_at:%d/%m/%Y %H:%M}"
        )
