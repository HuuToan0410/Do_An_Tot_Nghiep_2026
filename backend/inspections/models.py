from django.conf import settings
from django.db import models
from vehicles.models import VehicleUnit


class Inspection(models.Model):
    """
    Phiếu kiểm định chất lượng xe.
    Mỗi xe có thể trải qua nhiều lần kiểm định.
    """

    class Status(models.TextChoices):
        PENDING     = "PENDING",     "Chờ kiểm định"
        IN_PROGRESS = "IN_PROGRESS", "Đang kiểm định"
        COMPLETED   = "COMPLETED",   "Hoàn thành — Đạt"
        FAILED      = "FAILED",      "Hoàn thành — Không đạt"

    class QualityGrade(models.TextChoices):
        EXCELLENT = "A", "Xuất sắc (A)"
        GOOD      = "B", "Tốt (B)"
        FAIR      = "C", "Trung bình (C)"
        POOR      = "D", "Kém (D)"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="inspections",
        verbose_name="Xe",
    )

    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inspections_performed",
        verbose_name="Kỹ thuật viên kiểm định",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
    )

    quality_grade = models.CharField(
        max_length=1,
        choices=QualityGrade.choices,
        null=True,
        blank=True,
        verbose_name="Phân loại chất lượng",
    )

    overall_score = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="Điểm tổng",
    )

    conclusion = models.TextField(
        blank=True,
        verbose_name="Kết luận kiểm định",
    )

    recommendation = models.TextField(
        blank=True,
        verbose_name="Đề xuất hạng mục tân trang",
    )

    inspection_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày kiểm định",
    )

    # Hiển thị tóm tắt cho khách hàng
    is_public = models.BooleanField(
        default=False,
        verbose_name="Hiển thị cho khách hàng",
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
        db_table = "inspection"
        verbose_name = "Phiếu kiểm định"
        verbose_name_plural = "Danh sách phiếu kiểm định"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["vehicle"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Kiểm định #{self.pk} — {self.vehicle}"


class InspectionCategory(models.Model):
    """
    Danh mục kiểm định (nhóm hạng mục).
    Ví dụ: Động cơ, Hộp số, Thân vỏ, Nội thất, Điện...
    """

    name = models.CharField(
        max_length=100,
        verbose_name="Tên danh mục",
    )

    display_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Thứ tự hiển thị",
    )

    class Meta:
        db_table = "inspection_category"
        verbose_name = "Danh mục kiểm định"
        verbose_name_plural = "Danh mục kiểm định"
        ordering = ["display_order"]

    def __str__(self):
        return self.name


class InspectionItem(models.Model):
    """
    Hạng mục kiểm định — một mục trong checklist.
    """

    class Condition(models.TextChoices):
        GOOD   = "GOOD",   "Tốt"
        FAIR   = "FAIR",   "Bình thường"
        POOR   = "POOR",   "Kém"
        FAILED = "FAILED", "Hỏng / Cần thay"

    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Phiếu kiểm định",
    )

    category = models.ForeignKey(
        InspectionCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
        verbose_name="Danh mục",
    )

    name = models.CharField(
        max_length=200,
        verbose_name="Tên hạng mục",
    )

    condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        default=Condition.FAIR,
        verbose_name="Tình trạng",
    )

    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Điểm (0–10)",
    )

    note = models.TextField(
        blank=True,
        verbose_name="Ghi chú",
    )

    image = models.ImageField(
        upload_to="inspections/items/",
        null=True,
        blank=True,
        verbose_name="Hình ảnh minh chứng",
    )

    needs_repair = models.BooleanField(
        default=False,
        verbose_name="Cần sửa chữa / tân trang",
    )

    estimated_repair_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Chi phí sửa ước tính",
    )

    class Meta:
        db_table = "inspection_item"
        verbose_name = "Hạng mục kiểm định"
        verbose_name_plural = "Danh sách hạng mục kiểm định"
        ordering = ["category__display_order", "name"]

    def __str__(self):
        return f"{self.name} — {self.get_condition_display()}"