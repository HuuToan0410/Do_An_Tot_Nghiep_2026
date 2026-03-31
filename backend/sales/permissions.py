from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


class CanViewPricing(BasePermission):
    """
    Xem thông tin định giá:
    - Nhân viên định giá, bán hàng, admin
    """

    message = "Bạn không có quyền xem thông tin định giá."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PRICING,
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )


class CanManagePricing(BasePermission):
    """
    Tạo / chỉnh sửa định giá:
    - Nhân viên định giá, admin
    """

    message = "Chỉ nhân viên định giá mới có quyền tạo và cập nhật thông tin định giá."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return (
                request.user
                and request.user.is_authenticated
                and request.user.role
                in [
                    User.Role.PRICING,
                    User.Role.SALES,
                    User.Role.ADMIN,
                ]
            )
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PRICING,
                User.Role.ADMIN,
            ]
        )


class CanApprovePricing(BasePermission):
    """
    Phê duyệt giá bán:
    - Nhân viên định giá, admin
    """

    message = "Chỉ nhân viên định giá mới có quyền phê duyệt giá bán."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PRICING,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        # Không tự phê duyệt giá mình đề xuất (nếu cần kiểm soát)
        return request.user.role in [User.Role.PRICING, User.Role.ADMIN]


class CanManageListing(BasePermission):
    """
    Tạo / chỉnh sửa / ẩn bài đăng niêm yết:
    - Nhân viên bán hàng, admin
    - Khách: chỉ xem
    """

    message = "Chỉ nhân viên bán hàng mới có quyền quản lý bài đăng niêm yết."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True  # công khai
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )


class CanManageAppointment(BasePermission):
    """
    Đặt lịch hẹn xem xe:
    - Tạo mới: tất cả người dùng đã đăng nhập (kể cả khách hàng)
    - Xem / cập nhật trạng thái: nhân viên bán hàng, admin
    - Khách hàng chỉ xem lịch của mình
    """

    message = "Bạn không có quyền thực hiện thao tác này trên lịch hẹn."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role in [User.Role.SALES, User.Role.ADMIN]:
            return True
        if request.method in SAFE_METHODS:
            # Khách hàng chỉ xem lịch của mình
            return obj.customer == request.user
        return False


class CanManageDeposit(BasePermission):
    """
    Đặt cọc xe:
    - Tạo mới: người dùng đã đăng nhập (kể cả khách hàng)
    - Xem: khách chỉ thấy đặt cọc của mình; nhân viên bán hàng/admin thấy tất cả
    - Cập nhật / xác nhận: nhân viên bán hàng, admin
    """

    message = "Bạn không có quyền thực hiện thao tác này trên đặt cọc."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role in [User.Role.SALES, User.Role.ADMIN]:
            return True
        if request.method in SAFE_METHODS:
            return obj.customer == request.user
        return False


class CanConfirmDeposit(BasePermission):
    """
    Xác nhận đặt cọc (khóa xe):
    - Nhân viên bán hàng, admin
    """

    message = "Chỉ nhân viên bán hàng mới có quyền xác nhận đặt cọc."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )


class CanManageSalesOrder(BasePermission):
    """
    Tạo và quản lý đơn bán hàng:
    - Nhân viên bán hàng, admin
    """

    message = "Chỉ nhân viên bán hàng mới có quyền tạo và quản lý đơn bán hàng."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True
        if request.method in SAFE_METHODS:
            return True
        # Nhân viên bán hàng chỉ sửa đơn do mình tạo
        return obj.sold_by == request.user


class CanManageHandover(BasePermission):
    """
    Tạo và xem biên bản bàn giao xe:
    - Nhân viên bán hàng, admin
    """

    message = "Chỉ nhân viên bán hàng mới có quyền lập biên bản bàn giao."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )


class CanManageWarranty(BasePermission):
    """
    Quản lý hồ sơ bảo hành:
    - Tạo / cập nhật: nhân viên bán hàng, admin
    - Khách hàng: xem hồ sơ bảo hành của xe mình đã mua
    """

    message = "Bạn không có quyền thao tác trên hồ sơ bảo hành này."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role in [User.Role.SALES, User.Role.ADMIN]:
            return True
        if request.method in SAFE_METHODS:
            # Khách hàng xem bảo hành xe mình đã mua
            return obj.sales_order.customer == request.user
        return False


class CanViewAuditLog(BasePermission):
    """
    Xem nhật ký thao tác:
    - Chỉ admin
    """

    message = "Chỉ quản trị viên mới có quyền xem nhật ký thao tác hệ thống."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class CanViewDashboard(BasePermission):
    """
    Xem dashboard thống kê:
    - Tất cả nhân viên nội bộ
    """

    message = "Chỉ nhân viên nội bộ mới có quyền xem dashboard."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.Role.CUSTOMER
        )
