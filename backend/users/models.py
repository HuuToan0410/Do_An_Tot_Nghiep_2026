from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Model người dùng chính của hệ thống.
    Mở rộng từ AbstractUser để bổ sung vai trò và thông tin cần thiết
    cho hệ thống quản lý xe ô tô đã qua sử dụng.
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Quản trị viên"
        INSPECTOR = "INSPECTOR", "Nhân viên kiểm định"
        TECHNICIAN = "TECHNICIAN", "Kỹ thuật viên"
        SALES = "SALES", "Nhân viên bán hàng"
        CUSTOMER = "CUSTOMER", "Khách hàng"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
        verbose_name="Vai trò",
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Số điện thoại",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Thời gian cập nhật")

    class Meta:
        db_table = "users"
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["username"]),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"
