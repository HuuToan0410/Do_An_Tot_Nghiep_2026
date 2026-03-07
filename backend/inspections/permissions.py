from rest_framework.permissions import BasePermission


class LaNhanVienKiemDinh(BasePermission):
    """
    Chỉ cho phép nhân viên kiểm định hoặc admin truy cập.
    """

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        return request.user.role in ["ADMIN", "INSPECTOR"]