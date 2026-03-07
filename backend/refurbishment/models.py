from django.db import models
from django.conf import settings
from vehicles.models import VehicleUnit


class RefurbishmentOrder(models.Model):
    """
    Lệnh sửa chữa / tân trang xe sau khi kiểm định
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xử lý"
        IN_PROGRESS = "IN_PROGRESS", "Đang sửa chữa"
        COMPLETED = "COMPLETED", "Hoàn thành"
        CANCELLED = "CANCELLED", "Đã hủy"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="refurbishment_orders",
        verbose_name="Xe cần sửa",
    )

    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_refurbishments",
        verbose_name="Kỹ thuật viên phụ trách",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
    )

    note = models.TextField(blank=True, verbose_name="Ghi chú sửa chữa")

    start_date = models.DateTimeField(auto_now_add=True, verbose_name="Ngày bắt đầu")

    completed_date = models.DateTimeField(
        null=True, blank=True, verbose_name="Ngày hoàn thành"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
        verbose_name = "Lệnh sửa chữa"
        verbose_name_plural = "Danh sách lệnh sửa chữa"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["vehicle"]),
        ]

    def __str__(self):
        return f"Lệnh sửa chữa xe {self.vehicle} - {self.get_status_display()}"


class RefurbishmentItem(models.Model):
    """
    Hạng mục sửa chữa / thay thế trong một lệnh tân trang xe
    Ví dụ:
    - Thay dầu động cơ
    - Sơn lại cửa
    - Thay lốp
    """

    order = models.ForeignKey(
        "RefurbishmentOrder",
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Lệnh sửa chữa",
    )

    name = models.CharField(max_length=200, verbose_name="Tên hạng mục")

    cost = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Chi phí")

    description = models.TextField(blank=True, verbose_name="Mô tả chi tiết")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
        verbose_name = "Hạng mục sửa chữa"
        verbose_name_plural = "Danh sách hạng mục sửa chữa"

        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["order"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.cost} VND"
