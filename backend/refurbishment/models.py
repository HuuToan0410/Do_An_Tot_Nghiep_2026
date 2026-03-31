from django.conf import settings
from django.db import models
from vehicles.models import VehicleUnit


class RefurbishmentOrder(models.Model):
    """
    Lệnh tân trang / sửa chữa xe sau kiểm định.
    Một xe có thể có nhiều lệnh tân trang.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xử lý"
        IN_PROGRESS = "IN_PROGRESS", "Đang tân trang"
        COMPLETED = "COMPLETED", "Hoàn thành — Đã nghiệm thu"
        CANCELLED = "CANCELLED", "Đã hủy"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="refurbishment_orders",
        verbose_name="Xe cần tân trang",
    )

    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_refurbishments",
        verbose_name="Kỹ thuật viên phụ trách",
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="refurbishments_approved",
        verbose_name="Người nghiệm thu",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
    )

    note = models.TextField(
        blank=True,
        verbose_name="Ghi chú",
    )

    start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày bắt đầu",
    )

    completed_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày hoàn thành",
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
        db_table = "refurbishment_order"
        verbose_name = "Lệnh tân trang"
        verbose_name_plural = "Danh sách lệnh tân trang"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["vehicle"]),
        ]

    def __str__(self):
        return f"Lệnh tân trang #{self.pk} — {self.vehicle}"
    @property
    def total_cost(self):
        """Tổng chi phí tân trang"""
        return sum(item.cost for item in self.items.all())


class RefurbishmentItem(models.Model):
    """
    Hạng mục tân trang / thay thế cụ thể trong một lệnh.
    Ví dụ: Thay dầu động cơ, Sơn lại cửa, Thay lốp...
    """

    class ItemType(models.TextChoices):
        LABOR = "LABOR", "Nhân công"
        PARTS = "PARTS", "Phụ tùng / vật liệu"
        OTHER = "OTHER", "Khác"

    order = models.ForeignKey(
        RefurbishmentOrder,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Lệnh tân trang",
    )

    name = models.CharField(
        max_length=200,
        verbose_name="Tên hạng mục",
    )

    item_type = models.CharField(
        max_length=10,
        choices=ItemType.choices,
        default=ItemType.PARTS,
        verbose_name="Loại chi phí",
    )

    quantity = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Số lượng",
    )

    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Đơn giá",
    )

    description = models.TextField(
        blank=True,
        verbose_name="Mô tả chi tiết",
    )

    is_completed = models.BooleanField(
        default=False,
        verbose_name="Đã hoàn thành",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

    class Meta:
        db_table = "refurbishment_item"
        verbose_name = "Hạng mục tân trang"
        verbose_name_plural = "Danh sách hạng mục tân trang"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.name} — {self.cost:,.0f} VNĐ"

    @property
    def cost(self):
        """Tổng chi phí = số lượng × đơn giá"""
        return self.quantity * self.unit_cost
