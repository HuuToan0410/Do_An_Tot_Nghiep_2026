from django.contrib import admin
from .models import RefurbishmentOrder, RefurbishmentItem


class RefurbishmentItemInline(admin.TabularInline):
    """
    Hiển thị các hạng mục sửa chữa trực tiếp trong lệnh sửa chữa.
    """

    model = RefurbishmentItem

    extra = 0

    fields = (
        "name",
        "cost",
        "description",
        "created_at",
    )

    readonly_fields = ("created_at",)

    show_change_link = True


@admin.register(RefurbishmentOrder)
class RefurbishmentOrderAdmin(admin.ModelAdmin):
    """
    Quản lý lệnh sửa chữa / tân trang xe.
    """

    list_display = (
        "id",
        "xe",
        "ky_thuat_vien",
        "trang_thai",
        "ngay_bat_dau",
        "ngay_hoan_thanh",
        "created_at",
    )

    list_filter = (
        "status",
        "technician",
        "created_at",
    )

    search_fields = (
        "vehicle__vin",
        "vehicle__brand",
        "vehicle__model",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = [RefurbishmentItemInline]

    list_select_related = (
        "vehicle",
        "technician",
    )

    list_per_page = 25

    fieldsets = (
        (
            "Thông tin xe",
            {
                "fields": (
                    "vehicle",
                    "technician",
                )
            },
        ),
        (
            "Trạng thái sửa chữa",
            {
                "fields": (
                    "status",
                    "start_date",
                    "completed_date",
                )
            },
        ),
        (
            "Ghi chú",
            {"fields": ("note",)},
        ),
        (
            "Thông tin hệ thống",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    def xe(self, obj):
        return obj.vehicle

    xe.short_description = "Xe"

    def ky_thuat_vien(self, obj):
        return obj.technician

    ky_thuat_vien.short_description = "Kỹ thuật viên"

    def trang_thai(self, obj):
        return obj.get_status_display()

    trang_thai.short_description = "Trạng thái"

    def ngay_bat_dau(self, obj):
        return obj.start_date

    ngay_bat_dau.short_description = "Ngày bắt đầu"

    def ngay_hoan_thanh(self, obj):
        return obj.completed_date

    ngay_hoan_thanh.short_description = "Ngày hoàn thành"
