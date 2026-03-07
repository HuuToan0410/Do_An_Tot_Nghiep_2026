from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """
    Cấu hình trang quản trị cho model User
    """

    # các cột hiển thị trong bảng danh sách
    list_display = (
        "id",
        "username",
        "email",
        "phone",
        "vai_tro",
        "is_staff",
        "is_active",
        "created_at",
    )

    # bộ lọc bên phải
    list_filter = (
        "role",
        "is_staff",
        "is_active",
        "created_at",
    )

    # tìm kiếm nhanh
    search_fields = (
        "username",
        "email",
        "phone",
    )

    # sắp xếp mặc định
    ordering = ("-created_at",)

    # tránh load toàn bộ object
    list_select_related = ()

    # số dòng mỗi trang
    list_per_page = 25

    # field chỉ đọc
    readonly_fields = (
        "created_at",
        "updated_at",
    )

    # tổ chức form admin
    fieldsets = (
        ("Thông tin đăng nhập", {"fields": ("username", "password")}),
        ("Thông tin cá nhân", {"fields": ("email", "phone")}),
        (
            "Vai trò & quyền hạn",
            {
                "fields": (
                    "role",
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Thời gian hệ thống", {"fields": ("created_at", "updated_at")}),
    )

    # khi tạo user mới
    add_fieldsets = (
        (
            "Tạo người dùng mới",
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "phone",
                    "role",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )

    # hiển thị tiếng việt cho role
    @admin.display(description="Vai trò")
    def vai_tro(self, obj):
        return obj.get_role_display()
