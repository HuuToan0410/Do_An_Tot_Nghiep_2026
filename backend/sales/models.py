from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from vehicles.models import VehicleUnit


class Pricing(models.Model):
    """
    Thông tin định giá xe.
    Mỗi xe chỉ có một bản ghi pricing.
    """

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="dinh_gia",
        verbose_name="Xe",
    )

    purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Giá mua vào"
    )

    refurbish_cost = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, verbose_name="Chi phí tân trang"
    )

    suggested_price = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Giá đề xuất bán"
    )

    approved_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Giá đã được duyệt",
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gia_da_duyet",
        verbose_name="Người duyệt",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "pricing"
        verbose_name = "Định giá xe"
        verbose_name_plural = "Định giá xe"

    def total_cost(self):
        """
        Tổng chi phí thực tế
        """
        return self.purchase_price + self.refurbish_cost

    def margin(self):
        """
        Lợi nhuận dự kiến
        """
        if self.approved_price:
            return self.approved_price - self.total_cost()
        return self.suggested_price - self.total_cost()

    def __str__(self):
        return f"Định giá xe {self.vehicle.id}"


class Listing(models.Model):
    """
    Bản đăng bán xe trên website.
    Mỗi xe chỉ có một listing duy nhất.
    """

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="bai_dang",
        verbose_name="Xe",
    )

    title = models.CharField(max_length=255, verbose_name="Tiêu đề bài đăng")

    slug = models.SlugField(max_length=255, unique=True, verbose_name="Slug SEO")

    description = models.TextField(verbose_name="Mô tả chi tiết")

    listed_price = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Giá bán niêm yết"
    )

    is_active = models.BooleanField(default=True, verbose_name="Đang hiển thị")

    views_count = models.PositiveIntegerField(default=0, verbose_name="Lượt xem")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "listing"
        verbose_name = "Bài đăng bán xe"
        verbose_name_plural = "Bài đăng bán xe"

        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["listed_price"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Bài đăng: {self.title}"


class Deposit(models.Model):
    """
    Thông tin đặt cọc giữ xe.
    Một xe có thể có nhiều lần đặt cọc,
    nhưng chỉ một đặt cọc có thể được xác nhận.
    """

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="dat_coc",
        verbose_name="Xe được đặt cọc",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="dat_coc_xe",
        verbose_name="Khách hàng",
    )

    amount = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Số tiền đặt cọc"
    )

    confirmed = models.BooleanField(default=False, verbose_name="Đã xác nhận")

    note = models.TextField(blank=True, verbose_name="Ghi chú")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "deposit"
        verbose_name = "Đặt cọc"
        verbose_name_plural = "Đặt cọc"

        indexes = [
            models.Index(fields=["vehicle"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["confirmed"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Đặt cọc xe {self.vehicle.id} - {self.amount}"


class SalesOrder(models.Model):
    """
    Giao dịch bán xe cuối cùng.

    Một xe chỉ có thể bán một lần,
    vì vậy dùng OneToOneField với VehicleUnit.
    """

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="don_ban",
        verbose_name="Xe được bán",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="don_mua_xe",
        verbose_name="Khách hàng",
    )

    sale_price = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Giá bán thực tế"
    )

    contract_number = models.CharField(
        max_length=50, unique=True, verbose_name="Số hợp đồng"
    )

    note = models.TextField(blank=True, verbose_name="Ghi chú giao dịch")

    sold_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời điểm bán")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "sales_order"

        verbose_name = "Đơn bán xe"
        verbose_name_plural = "Đơn bán xe"

        indexes = [
            models.Index(fields=["sold_at"]),
            models.Index(fields=["customer"]),
        ]

    def __str__(self):
        return f"Đơn bán xe {self.vehicle.id} - {self.sale_price}"
