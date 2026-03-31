from django.contrib import admin
from sales.models import (
    Appointment,
    AuditLog,
    Deposit,
    HandoverRecord,
    Listing,
    VehiclePricing,
    SalesOrder,
    WarrantyRecord,
)


@admin.register(VehiclePricing)
class PricingAdmin(admin.ModelAdmin):
    list_display = [
        "vehicle",
        "purchase_price",
        "refurbish_cost",
        "target_price",
        "approved_price",
        "approved_by",
        "approved_at",
    ]
    list_filter = ["approved_by"]
    search_fields = ["vehicle__brand", "vehicle__model", "vehicle__vin"]
    readonly_fields = ["created_at", "updated_at", "approved_at"]


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "vehicle",
        "listed_price",
        "is_active",
        "is_featured",
        "views_count",
        "created_at",
    ]
    list_filter = ["is_active", "is_featured"]
    search_fields = ["title", "vehicle__brand", "vehicle__model"]
    readonly_fields = ["views_count", "created_at", "updated_at"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "customer_name",
        "customer_phone",
        "vehicle",
        "scheduled_at",
        "status",
        "handled_by",
    ]
    list_filter = ["status"]
    search_fields = ["customer_name", "customer_phone", "vehicle__brand"]
    ordering = ["scheduled_at"]


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = [
        "customer_name",
        "customer_phone",
        "vehicle",
        "amount",
        "status",
        "confirmed_by",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["customer_name", "vehicle__brand", "vehicle__vin"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = [
        "contract_number",
        "vehicle",
        "customer_name",
        "sale_price",
        "sold_by",
        "sold_at",
    ]
    search_fields = ["contract_number", "customer_name", "vehicle__vin"]
    readonly_fields = ["sold_at"]


@admin.register(HandoverRecord)
class HandoverAdmin(admin.ModelAdmin):
    list_display = ["sales_order", "handover_date", "mileage_at_handover", "staff"]
    readonly_fields = ["created_at"]


@admin.register(WarrantyRecord)
class WarrantyAdmin(admin.ModelAdmin):
    list_display = [
        "sales_order",
        "status",
        "warranty_months",
        "start_date",
        "end_date",
    ]
    list_filter = ["status"]
    readonly_fields = ["created_at"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "action",
        "model_name",
        "object_id",
        "description",
        "ip_address",
        "created_at",
    ]
    list_filter = ["action", "model_name"]
    search_fields = ["description", "model_name", "user__username"]
    readonly_fields = list_display
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
