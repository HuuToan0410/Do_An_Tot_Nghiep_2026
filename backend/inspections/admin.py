from django.contrib import admin
from inspections.models import Inspection, InspectionCategory, InspectionItem


class InspectionItemInline(admin.TabularInline):
    model = InspectionItem
    extra = 0
    fields = [
        "category",
        "name",
        "condition",
        "score",
        "needs_repair",
        "estimated_repair_cost",
    ]


@admin.register(InspectionCategory)
class InspectionCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "display_order"]
    ordering = ["display_order"]


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "vehicle",
        "inspector",
        "status",
        "quality_grade",
        "overall_score",
        "inspection_date",
        "is_public",
    ]
    list_filter = ["status", "quality_grade", "is_public"]
    search_fields = ["vehicle__brand", "vehicle__model", "vehicle__vin"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [InspectionItemInline]


@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "inspection",
        "condition",
        "score",
        "needs_repair",
        "estimated_repair_cost",
    ]
    list_filter = ["condition", "needs_repair", "category"]
    search_fields = ["name"]
