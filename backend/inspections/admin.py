from django.contrib import admin
from .models import Inspection, InspectionItem, InspectionResult


class InspectionItemInline(admin.TabularInline):
    model = InspectionItem
    extra = 1


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "vehicle",
        "inspector",
        "status",
        "inspection_date",
    )

    list_filter = ("status", "inspection_date")

    search_fields = ("vehicle__vin",)

    inlines = [InspectionItemInline]
@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "inspection",
        "name",
        "status",
        "score",
    )

    list_filter = ("status",)