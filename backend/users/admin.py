from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "username",
        "email",
        "get_full_name",
        "role",
        "phone",
        "is_active",
        "is_verified",
        "created_at",
    ]
    list_filter = ["role", "is_active", "is_verified"]
    search_fields = ["username", "email", "phone", "first_name", "last_name"]
    ordering = ["-created_at"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Thông tin bổ sung",
            {
                "fields": ("role", "phone", "address", "avatar", "is_verified"),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Thông tin bổ sung",
            {
                "fields": ("role", "phone", "email"),
            },
        ),
    )
