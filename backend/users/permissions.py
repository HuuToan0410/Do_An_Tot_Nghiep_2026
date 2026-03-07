from rest_framework.permissions import BasePermission
from users.models import User


class IsAdmin(BasePermission):
    """
    Chỉ cho phép Quản trị viên truy cập.

    Permission này được sử dụng cho các API quản trị hệ thống
    như quản lý người dùng, cấu hình hệ thống, thống kê tổng.
    """

    message = "Chỉ quản trị viên mới có quyền truy cập."

    def has_permission(self, request, view):
        user = request.user

        return user and user.is_authenticated and user.role == User.Role.ADMIN


class IsStaffOrAdmin(BasePermission):
    """
    Cho phép các nhân sự nội bộ truy cập.

    Bao gồm:
    - Quản trị viên
    - Nhân viên bán hàng
    - Nhân viên kiểm định
    - Kỹ thuật viên
    """

    message = "Bạn không có quyền truy cập chức năng này."

    ALLOWED_ROLES = {
        User.Role.ADMIN,
        User.Role.SALES,
        User.Role.INSPECTOR,
        User.Role.TECHNICIAN,
    }

    def has_permission(self, request, view):
        user = request.user

        return user and user.is_authenticated and user.role in self.ALLOWED_ROLES
