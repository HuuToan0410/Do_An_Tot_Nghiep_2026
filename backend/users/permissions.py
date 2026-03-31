from rest_framework.permissions import BasePermission
from .models import User


class IsAdmin(BasePermission):
    """Chỉ quản trị viên"""
    message = "Bạn không có quyền thực hiện thao tác này."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )


class IsStaffMember(BasePermission):
    """Nhân viên nội bộ (không phải khách hàng)"""
    message = "Chỉ nhân viên nội bộ mới có quyền truy cập."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role != User.Role.CUSTOMER
        )


class IsPurchasing(BasePermission):
    """Nhân viên thu mua"""
    message = "Chỉ nhân viên thu mua mới có quyền thực hiện."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.PURCHASING, User.Role.ADMIN]
        )


class IsInspector(BasePermission):
    """Kỹ thuật viên kiểm định"""
    message = "Chỉ kỹ thuật viên kiểm định mới có quyền thực hiện."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.INSPECTOR, User.Role.ADMIN]
        )


class IsTechnician(BasePermission):
    """Kỹ thuật viên tân trang"""
    message = "Chỉ kỹ thuật viên tân trang mới có quyền thực hiện."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.TECHNICIAN, User.Role.ADMIN]
        )


class IsPricing(BasePermission):
    """Nhân viên định giá"""
    message = "Chỉ nhân viên định giá mới có quyền thực hiện."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.PRICING, User.Role.ADMIN]
        )


class IsSales(BasePermission):
    """Nhân viên bán hàng"""
    message = "Chỉ nhân viên bán hàng mới có quyền thực hiện."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.SALES, User.Role.ADMIN]
        )


class IsOwnerOrAdmin(BasePermission):
    """Chủ sở hữu hoặc admin"""
    message = "Bạn chỉ có thể thao tác trên tài nguyên của mình."

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user and
            request.user.is_authenticated and
            (obj == request.user or request.user.role == User.Role.ADMIN)
        )


class IsAdminOrReadOnly(BasePermission):
    """Admin toàn quyền, còn lại chỉ đọc"""

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )