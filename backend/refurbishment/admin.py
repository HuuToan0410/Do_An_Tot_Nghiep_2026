from django.contrib import admin
from refurbishment.models import RefurbishmentItem, RefurbishmentOrder


class RefurbishmentItemInline(admin.TabularInline):
    model = RefurbishmentItem
    extra = 0
    fields = ["name", "item_type", "quantity", "unit_cost", "is_completed"]
    readonly_fields = []


@admin.register(RefurbishmentOrder)
class RefurbishmentOrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "vehicle",
        "technician",
        "status",
        "start_date",
        "completed_date",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["vehicle__brand", "vehicle__model", "vehicle__vin"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [RefurbishmentItemInline]

    def total_cost_display(self, obj):
        return f"{obj.total_cost():,.0f} VNĐ"

    total_cost_display.short_description = "Tổng chi phí"


@admin.register(RefurbishmentItem)
class RefurbishmentItemAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "order",
        "item_type",
        "quantity",
        "unit_cost",
        "is_completed",
    ]
    list_filter = ["item_type", "is_completed"]
    search_fields = ["name"]
