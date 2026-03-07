from django.contrib import admin
from .models import Pricing, Listing, Deposit, SalesOrder


@admin.register(Pricing)
class PricingAdmin(admin.ModelAdmin):
    """
    Quản trị thông tin định giá xe
    """

    list_display = (
        "vehicle",
        "purchase_price",
        "refurbish_cost",
        "suggested_price",
        "approved_price",
        "approved_by",
        "created_at",
    )

    list_filter = (
        "approved_by",
        "created_at",
    )

    search_fields = (
        "vehicle__vin",
        "vehicle__brand",
        "vehicle__model",
    )

    ordering = ("-created_at",)

    list_select_related = (
        "vehicle",
        "approved_by",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    """
    Quản trị bài đăng bán xe
    """

    list_display = (
        "title",
        "vehicle",
        "listed_price",
        "is_active",
        "views_count",
        "created_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "title",
        "vehicle__brand",
        "vehicle__model",
        "vehicle__vin",
    )

    ordering = ("-created_at",)

    list_select_related = ("vehicle",)

    prepopulated_fields = {"slug": ("title",)}

    readonly_fields = (
        "views_count",
        "created_at",
        "updated_at",
    )


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    """
    Quản trị đặt cọc xe
    """

    list_display = (
        "vehicle",
        "customer",
        "amount",
        "confirmed",
        "created_at",
    )

    list_filter = (
        "confirmed",
        "created_at",
    )

    search_fields = (
        "vehicle__vin",
        "vehicle__brand",
        "customer__username",
        "customer__phone",
    )

    ordering = ("-created_at",)

    list_select_related = (
        "vehicle",
        "customer",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    """
    Quản trị đơn bán xe
    """

    list_display = (
        "vehicle",
        "customer",
        "sale_price",
        "contract_number",
        "sold_at",
    )

    list_filter = ("sold_at",)

    search_fields = (
        "contract_number",
        "vehicle__vin",
        "vehicle__brand",
        "customer__username",
    )

    ordering = ("-sold_at",)

    list_select_related = (
        "vehicle",
        "customer",
    )

    readonly_fields = (
        "sold_at",
        "created_at",
        "updated_at",
    )
