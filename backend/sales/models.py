from django.conf import settings
from django.db import models
from vehicles.models import VehicleUnit


class Listing(models.Model):
    """
    Bài đăng bán xe trên website.
    Chỉ xe ở trạng thái READY_FOR_SALE mới được tạo listing.
    Mỗi xe chỉ có một listing duy nhất.
    """

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="listing",
        verbose_name="Xe",
    )

    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề bài đăng",
    )

    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name="Đường dẫn SEO",
    )

    description = models.TextField(
        verbose_name="Mô tả chi tiết",
    )

    listed_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name="Giá niêm yết",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang hiển thị",
    )

    is_featured = models.BooleanField(
        default=False,
        verbose_name="Xe nổi bật",
    )

    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Lượt xem",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày đăng",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ngày cập nhật",
    )

    class Meta:
        db_table = "listing"
        verbose_name = "Bài đăng bán xe"
        verbose_name_plural = "Bài đăng bán xe"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["listed_price"]),
            models.Index(fields=["is_featured"]),
        ]

    def __str__(self):
        return self.title


class Appointment(models.Model):
    """
    Lịch hẹn xem xe — khách đặt lịch đến showroom xem xe trực tiếp.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xác nhận"
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        COMPLETED = "COMPLETED", "Đã xem xe"
        CANCELLED = "CANCELLED", "Đã hủy"
        NO_SHOW = "NO_SHOW", "Không đến"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="appointments",
        verbose_name="Xe muốn xem",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="appointments",
        verbose_name="Khách hàng",
    )

    customer_name = models.CharField(
        max_length=100,
        verbose_name="Tên khách hàng",
    )

    customer_phone = models.CharField(
        max_length=15,
        verbose_name="Số điện thoại",
    )

    customer_email = models.EmailField(
        blank=True,
        verbose_name="Email",
    )

    scheduled_at = models.DateTimeField(
        verbose_name="Thời gian hẹn",
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

    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments_handled",
        verbose_name="Nhân viên xử lý",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

    class Meta:
        db_table = "appointment"
        verbose_name = "Lịch hẹn xem xe"
        verbose_name_plural = "Danh sách lịch hẹn"
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["vehicle"]),
            models.Index(fields=["status"]),
            models.Index(fields=["scheduled_at"]),
        ]

    def __str__(self):
        return f"Lịch hẹn — {self.customer_name} xem {self.vehicle}"


class Deposit(models.Model):
    """
    Đặt cọc giữ xe.
    Một xe chỉ có thể có một đặt cọc được xác nhận tại một thời điểm.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xác nhận"
        CONFIRMED = "CONFIRMED", "Đã xác nhận — Xe đã khóa"
        CANCELLED = "CANCELLED", "Đã hủy"
        REFUNDED = "REFUNDED", "Đã hoàn cọc"
        CONVERTED = "CONVERTED", "Đã chuyển thành đơn bán"

    vehicle = models.ForeignKey(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="deposits",
        verbose_name="Xe đặt cọc",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deposits",
        verbose_name="Khách hàng",
    )

    customer_name = models.CharField(
        max_length=100,
        verbose_name="Tên khách hàng",
    )

    customer_phone = models.CharField(
        max_length=15,
        verbose_name="Số điện thoại",
    )

    customer_email = models.EmailField(
        blank=True,
        verbose_name="Email",
    )

    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name="Số tiền đặt cọc",
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

    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deposits_confirmed",
        verbose_name="Nhân viên xác nhận",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày đặt cọc",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ngày cập nhật",
    )

    momo_order_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="MoMo Order ID",
        db_index=True,
    )
    momo_trans_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="MoMo Transaction ID",
    )
    momo_pay_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="MoMo Payment URL",
    )
    class Meta:
        db_table = "deposit"
        verbose_name = "Đặt cọc"
        verbose_name_plural = "Danh sách đặt cọc"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["vehicle"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Đặt cọc #{self.pk} — {self.vehicle} — {self.customer_name}"


class SalesOrder(models.Model):
    """
    Đơn bán xe — giao dịch cuối cùng.
    Mỗi xe chỉ được bán một lần (OneToOne).
    """

    vehicle = models.OneToOneField(
        VehicleUnit,
        on_delete=models.CASCADE,
        related_name="sales_order",
        verbose_name="Xe được bán",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchases",
        verbose_name="Khách hàng mua",
    )

    customer_name = models.CharField(
        max_length=100,
        verbose_name="Tên người mua",
    )

    customer_phone = models.CharField(
        max_length=15,
        verbose_name="Số điện thoại",
    )

    deposit = models.ForeignKey(
        Deposit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_order",
        verbose_name="Đặt cọc liên quan",
    )

    sale_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name="Giá bán thực tế",
    )

    contract_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Số hợp đồng",
    )

    sold_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_made",
        verbose_name="Nhân viên bán hàng",
    )

    note = models.TextField(
        blank=True,
        verbose_name="Ghi chú giao dịch",
    )

    sold_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm bán",
    )

    class Meta:
        db_table = "sales_order"
        verbose_name = "Đơn bán xe"
        verbose_name_plural = "Danh sách đơn bán xe"
        ordering = ["-sold_at"]

    def __str__(self):
        return f"Đơn #{self.contract_number} — {self.vehicle}"


class HandoverRecord(models.Model):
    """
    Biên bản bàn giao xe cho khách hàng sau khi bán.
    """

    sales_order = models.OneToOneField(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="handover",
        verbose_name="Đơn bán hàng",
    )

    handover_date = models.DateTimeField(
        verbose_name="Ngày giờ bàn giao",
    )

    mileage_at_handover = models.PositiveIntegerField(
        verbose_name="Số km tại thời điểm bàn giao",
    )

    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="handovers",
        verbose_name="Nhân viên bàn giao",
    )

    note = models.TextField(
        blank=True,
        verbose_name="Ghi chú bàn giao",
    )

    customer_signature = models.ImageField(
        upload_to="handovers/signatures/",
        null=True,
        blank=True,
        verbose_name="Chữ ký khách hàng",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

    class Meta:
        db_table = "handover_record"
        verbose_name = "Biên bản bàn giao xe"
        verbose_name_plural = "Biên bản bàn giao xe"

    def __str__(self):
        return f"Bàn giao — {self.sales_order}"


class WarrantyRecord(models.Model):
    """
    Hồ sơ bảo hành xe sau bán (mô phỏng).
    """
    

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang bảo hành"
        EXPIRED = "EXPIRED", "Hết hạn"
        VOID = "VOID", "Đã hủy"

    sales_order = models.OneToOneField(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="warranty",
        verbose_name="Đơn bán hàng",
    )

    warranty_months = models.PositiveSmallIntegerField(
        default=6,
        verbose_name="Thời hạn bảo hành (tháng)",
    )

    max_mileage = models.PositiveIntegerField(
        default=10000,
        verbose_name="Số km tối đa bảo hành",
    )

    coverage_note = models.TextField(
        blank=True,
        verbose_name="Nội dung bảo hành",
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
    )

    start_date = models.DateField(
        verbose_name="Ngày bắt đầu bảo hành",
    )

    end_date = models.DateField(
        verbose_name="Ngày kết thúc bảo hành",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

   
    """ ordering = ["-created_at"] """ 
    class Meta:
        db_table = "warranty_record"
        verbose_name = "Hồ sơ bảo hành"
        verbose_name_plural = "Hồ sơ bảo hành"
        ordering = ["-created_at"]
    def __str__(self):
        return f"Bảo hành — {self.sales_order.vehicle}"

    
class AuditLog(models.Model):
    """
    Nhật ký thao tác hệ thống — bắt buộc theo yêu cầu đề tài.
    Ghi lại mọi thao tác quan trọng: thay đổi giá, trạng thái, checklist...
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Tạo mới"
        UPDATE = "UPDATE", "Cập nhật"
        DELETE = "DELETE", "Xóa"
        STATUS_CHANGE = "STATUS_CHANGE", "Thay đổi trạng thái"
        APPROVE = "APPROVE", "Phê duyệt"
        REJECT = "REJECT", "Từ chối"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
        verbose_name="Người thực hiện",
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        verbose_name="Hành động",
    )

    model_name = models.CharField(
        max_length=100,
        verbose_name="Model bị tác động",
    )

    object_id = models.PositiveIntegerField(
        verbose_name="ID đối tượng",
    )

    description = models.TextField(
        verbose_name="Mô tả chi tiết",
    )

    old_value = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Giá trị trước",
    )

    new_value = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Giá trị sau",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Địa chỉ IP",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm thực hiện",
    )

    class Meta:
        db_table = "audit_log"
        verbose_name = "Nhật ký thao tác"
        verbose_name_plural = "Nhật ký thao tác"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return (
            f"{self.get_action_display()} — "
            f"{self.model_name} #{self.object_id} — "
            f"{self.created_at:%d/%m/%Y %H:%M}"
        )


# Thêm vào cuối sales/models.py


class SellInquiry(models.Model):
    """Yêu cầu bán xe từ khách hàng"""

    name = models.CharField(max_length=100, verbose_name="Họ tên")
    phone = models.CharField(max_length=20, verbose_name="Điện thoại")
    email = models.EmailField(blank=True, verbose_name="Email")
    brand = models.CharField(max_length=100, blank=True, verbose_name="Hãng xe")
    model = models.CharField(max_length=100, blank=True, verbose_name="Dòng xe")
    year = models.CharField(max_length=10, blank=True, verbose_name="Năm SX")
    mileage = models.CharField(max_length=20, blank=True, verbose_name="Số km")
    expected_price = models.CharField(
        max_length=50, blank=True, verbose_name="Giá mong muốn"
    )
    note = models.TextField(blank=True, verbose_name="Ghi chú")
    is_contacted = models.BooleanField(default=False, verbose_name="Đã liên hệ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày gửi")

    class Meta:
        db_table = "sell_inquiry"
        verbose_name = "Yêu cầu bán xe"
        verbose_name_plural = "Yêu cầu bán xe"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.brand} {self.model} ({self.phone})"


class ContactInquiry(models.Model):
    """Khách để lại thông tin tìm xe"""

    name = models.CharField(max_length=100, verbose_name="Họ tên")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Điện thoại")
    email = models.EmailField(blank=True, verbose_name="Email")
    message = models.TextField(blank=True, verbose_name="Nội dung")
    is_contacted = models.BooleanField(default=False, verbose_name="Đã liên hệ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày gửi")

    class Meta:
        db_table = "contact_inquiry"
        verbose_name = "Thông tin liên hệ"
        verbose_name_plural = "Thông tin liên hệ"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.phone or self.email}"


class VehiclePricing(models.Model):
    """
    Phiếu định giá xe — do nhân viên định giá (PRICING) tạo.
    Một xe chỉ có một phiếu định giá tại một thời điểm.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ phê duyệt"
        APPROVED = "APPROVED", "Đã phê duyệt"
        REJECTED = "REJECTED", "Từ chối"

    vehicle = models.OneToOneField(
        "vehicles.VehicleUnit",
        on_delete=models.CASCADE,
        related_name="pricing",
        verbose_name="Xe",
    )
    purchase_price = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        verbose_name="Giá thu mua (đ)",
    )
    refurbish_cost = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        default=0,
        verbose_name="Chi phí tân trang (đ)",
    )
    other_cost = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        default=0,
        verbose_name="Chi phí khác (đ)",
    )
    target_price = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        verbose_name="Giá bán đề xuất (đ)",
    )
    approved_price = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name="Giá bán được duyệt (đ)",
    )
    note = models.TextField(blank=True, verbose_name="Ghi chú")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="pricings_created",
        verbose_name="Người tạo",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pricings_approved",
        verbose_name="Người phê duyệt",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vehicle_pricing"
        verbose_name = "Phiếu định giá"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Định giá #{self.pk} — {self.vehicle}"

    @property
    def total_cost(self):
        return (
            (self.purchase_price or 0)
            + (self.refurbish_cost or 0)
            + (self.other_cost or 0)
        )

    @property
    def profit(self):
        price = self.approved_price or self.target_price or 0
        return price - self.total_cost

    @property
    def profit_margin(self):
        """Biên lợi nhuận %"""
        price = self.approved_price or self.target_price or 0
        if not price:
            return 0
        return round((self.profit / price) * 100, 1)


# Thêm vào cuối sales/models.py


class Favorite(models.Model):
    """Xe yêu thích của khách hàng"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Người dùng",
    )
    vehicle = models.ForeignKey(
        "vehicles.VehicleUnit",
        on_delete=models.CASCADE,
        related_name="favorited_by",
        verbose_name="Xe yêu thích",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày thêm",
    )

    class Meta:
        db_table = "favorite"
        verbose_name = "Xe yêu thích"
        verbose_name_plural = "Xe yêu thích"
        unique_together = [("user", "vehicle")]  # mỗi user chỉ thích 1 xe 1 lần
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} ♥ {self.vehicle}"

# thanh toán momo