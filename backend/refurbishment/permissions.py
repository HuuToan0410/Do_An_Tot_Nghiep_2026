from rest_framework.permissions import BasePermission


class IsTechnicianOrAdmin(BasePermission):
    """
    Chỉ kỹ thuật viên hoặc admin được chỉnh sửa lệnh sửa chữa.
    """

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        return request.user.role in [
            "ADMIN",
            "TECHNICIAN",
        ]
