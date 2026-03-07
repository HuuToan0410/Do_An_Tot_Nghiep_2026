from django.conf import settings
from django.db import models
from vehicles.models import VehicleUnit

# Create your models here.


class Inspection(models.Model):

    class Status(models.TextChoices):
        CHO_KIEM_DINH = "PENDING", "Chờ kiểm định"
        DANG_KIEM_DINH = "IN_PROGRESS", "Đang kiểm định"
        HOAN_THANH = "COMPLETED", "Hoàn thành"
        KHONG_DAT = "FAILED", "Không đạt"

    vehicle = models.ForeignKey(
        VehicleUnit, on_delete=models.CASCADE, related_name="inspections"
    )

    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.CHO_KIEM_DINH
    )

    overall_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    note = models.TextField(blank=True)

    inspection_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Kiểm định {self.vehicle}"


class InspectionItem(models.Model):

    STATUS_CHOICES = [
        ("TOT", "Tốt"),
        ("BINH_THUONG", "Bình thường"),
        ("KEM", "Kém"),
    ]

    inspection = models.ForeignKey(
        Inspection, on_delete=models.CASCADE, related_name="items"
    )

    name = models.CharField(max_length=200)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="BINH_THUONG"
    )

    score = models.IntegerField(null=True, blank=True)

    note = models.TextField(blank=True)

    image = models.ImageField(upload_to="inspection/", null=True, blank=True)

    def __str__(self):
        return self.name


class InspectionResult(models.Model):

    class KetQua(models.TextChoices):
        TOT = "TOT", "Tốt"
        BINH_THUONG = "BINH_THUONG", "Bình thường"
        KEM = "KEM", "Kém"

    item = models.OneToOneField(
        InspectionItem,
        on_delete=models.CASCADE,
        related_name="ket_qua_kiem_dinh",
        verbose_name="Mục kiểm định",
    )

    ket_qua = models.CharField(
        max_length=20,
        choices=KetQua.choices,
        default=KetQua.BINH_THUONG,
        verbose_name="Kết quả",
    )

    diem = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name="Điểm đánh giá"
    )

    ghi_chu = models.TextField(blank=True, verbose_name="Ghi chú")

    hinh_anh = models.ImageField(
        upload_to="inspection/results/",
        null=True,
        blank=True,
        verbose_name="Hình ảnh minh chứng",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian tạo")

    class Meta:
        verbose_name = "Kết quả kiểm định"
        verbose_name_plural = "Kết quả kiểm định"

    def __str__(self):
        return f"Kết quả: {self.item.name}"
