from django.contrib import admin
from vehicles.models import VehicleMedia, VehicleSpec, VehicleStatusLog, VehicleUnit


class VehicleMediaInline(admin.TabularInline):
    model = VehicleMedia
    extra = 1
    fields = ["file", "media_type", "is_primary", "display_order"]


class VehicleSpecInline(admin.StackedInline):
    model = VehicleSpec
    extra = 0
    fields = [
        "body_type",
        "engine_capacity",
        "horsepower",
        "doors",
        "seats",
        "origin",
        "has_abs",
        "has_airbags",
        "airbag_count",
        "has_camera",
        "has_360_camera",
        "has_sunroof",
        "tire_condition",
        "brake_condition",
        "engine_condition",
        "electrical_condition",
    ]


class VehicleStatusLogInline(admin.TabularInline):
    model = VehicleStatusLog
    extra = 0
    readonly_fields = ["old_status", "new_status", "changed_by", "note", "changed_at"]
    can_delete = False


@admin.register(VehicleUnit)
class VehicleUnitAdmin(admin.ModelAdmin):
    list_display = [
        "vin",
        "display_name",
        "status",
        "sale_price",
        "mileage",
        "created_by",
        "created_at",
    ]
    list_filter = ["status", "brand", "fuel_type", "transmission", "year"]
    search_fields = ["vin", "brand", "model", "license_plate"]
    readonly_fields = ["created_at", "updated_at", "created_by"]
    ordering = ["-created_at"]
    inlines = [VehicleSpecInline, VehicleMediaInline, VehicleStatusLogInline]

    fieldsets = (
        (
            "Thông tin nhận dạng",
            {
                "fields": ("vin", "license_plate", "status"),
            },
        ),
        (
            "Thông số cơ bản",
            {
                "fields": (
                    "brand",
                    "model",
                    "variant",
                    "year",
                    "mileage",
                    "color",
                    "fuel_type",
                    "transmission",
                ),
            },
        ),
        (
            "Giá & Thu mua",
            {
                "fields": (
                    "purchase_price",
                    "purchase_date",
                    "purchase_note",
                    "sale_price",
                ),
            },
        ),
        (
            "Mô tả",
            {
                "fields": ("description",),
            },
        ),
        (
            "Hệ thống",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
