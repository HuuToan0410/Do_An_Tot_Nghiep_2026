from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


class CanViewRefurbishment(BasePermission):
    """
    Xem lệnh tân trang:
    - Tất cả nhân viên nội bộ
    """

    message = "Chỉ nhân viên nội bộ mới có quyền xem lệnh tân trang."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.Role.CUSTOMER
        )


class CanCreateRefurbishment(BasePermission):
    """
    Tạo lệnh tân trang:
    - Kỹ thuật viên tân trang, admin
    """

    message = "Chỉ kỹ thuật viên tân trang mới có quyền tạo lệnh tân trang."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.TECHNICIAN,
                User.Role.ADMIN,
            ]
        )


class CanEditRefurbishment(BasePermission):
    """
    Chỉnh sửa lệnh tân trang:
    - Kỹ thuật viên tân trang, admin
    - Lệnh đã COMPLETED / CANCELLED không thể sửa
    """

    message = "Bạn không có quyền chỉnh sửa lệnh tân trang này."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return (
                request.user
                and request.user.is_authenticated
                and request.user.role != User.Role.CUSTOMER
            )
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.TECHNICIAN,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        from refurbishment.models import RefurbishmentOrder

        if obj.status in [
            RefurbishmentOrder.Status.COMPLETED,
            RefurbishmentOrder.Status.CANCELLED,
        ]:
            self.message = (
                "Lệnh tân trang đã hoàn thành hoặc bị hủy, không thể chỉnh sửa."
            )
            return False
        return request.user.role in [User.Role.TECHNICIAN, User.Role.ADMIN]


class CanManageRefurbishmentItem(BasePermission):
    """
    Thêm / sửa / xóa hạng mục tân trang:
    - Kỹ thuật viên được giao lệnh đó, hoặc admin
    - Lệnh đã COMPLETED không thể thêm/sửa/xóa hạng mục
    """

    message = "Bạn không có quyền thao tác trên hạng mục tân trang này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.TECHNICIAN,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        from refurbishment.models import RefurbishmentOrder

        # obj là RefurbishmentItem → lấy order cha
        order = obj.order
        if order.status in [
            RefurbishmentOrder.Status.COMPLETED,
            RefurbishmentOrder.Status.CANCELLED,
        ]:
            self.message = (
                "Lệnh tân trang đã kết thúc, không thể thao tác trên hạng mục."
            )
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        # Kỹ thuật viên chỉ thao tác được trên lệnh được giao cho mình
        return order.technician == request.user


class CanCompleteRefurbishment(BasePermission):
    """
    Nghiệm thu lệnh tân trang:
    - Kỹ thuật viên được giao lệnh, định giá, hoặc admin
    """

    message = "Bạn không có quyền nghiệm thu lệnh tân trang này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.TECHNICIAN,
                User.Role.PRICING,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role in [User.Role.PRICING, User.Role.ADMIN]:
            return True
        return obj.technician == request.user


class CanCancelRefurbishment(BasePermission):
    """
    Hủy lệnh tân trang:
    - Chỉ admin
    """

    message = "Chỉ quản trị viên mới có quyền hủy lệnh tân trang."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )
