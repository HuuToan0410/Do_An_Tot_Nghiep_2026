from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


class CanViewInspection(BasePermission):
    """
    Xem phiếu kiểm định:
    - Phiếu is_public=True: tất cả mọi người (kể cả khách chưa đăng nhập)
    - Phiếu is_public=False: chỉ nhân viên nội bộ
    """

    message = "Bạn không có quyền xem phiếu kiểm định này."

    def has_object_permission(self, request, view, obj):
        if obj.is_public:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.Role.CUSTOMER
        )


class CanCreateInspection(BasePermission):
    """
    Tạo phiếu kiểm định:
    - Kỹ thuật viên kiểm định, admin
    """

    message = "Chỉ kỹ thuật viên kiểm định mới có quyền tạo phiếu kiểm định."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.INSPECTOR,
                User.Role.ADMIN,
            ]
        )


class CanEditInspection(BasePermission):
    """
    Chỉnh sửa phiếu kiểm định:
    - Chỉ kỹ thuật viên kiểm định và admin
    - Phiếu đã COMPLETED / FAILED không thể sửa
    """

    message = "Bạn không có quyền chỉnh sửa phiếu kiểm định này."

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
                User.Role.INSPECTOR,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        from inspections.models import Inspection

        if obj.status in [
            Inspection.Status.COMPLETED,
            Inspection.Status.FAILED,
        ]:
            self.message = "Phiếu kiểm định đã hoàn thành, không thể chỉnh sửa."
            return False
        return request.user.role in [User.Role.INSPECTOR, User.Role.ADMIN]


class CanCompleteInspection(BasePermission):
    """
    Hoàn thành / nghiệm thu kiểm định:
    - Kỹ thuật viên kiểm định phụ trách phiếu đó, hoặc admin
    """

    message = "Chỉ kỹ thuật viên phụ trách hoặc quản trị viên mới có thể hoàn thành kiểm định."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.INSPECTOR,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True
        # Chỉ người được giao kiểm định mới được hoàn thành
        return obj.inspector == request.user


class CanManageInspectionItem(BasePermission):
    """
    Thêm / sửa / xóa hạng mục kiểm định:
    - Kỹ thuật viên kiểm định, admin
    - Không thao tác được nếu phiếu đã hoàn thành
    """

    message = "Bạn không có quyền thao tác trên hạng mục kiểm định này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.INSPECTOR,
                User.Role.ADMIN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        from inspections.models import Inspection

        # obj là InspectionItem → lấy inspection cha
        inspection = obj.inspection
        if inspection.status in [
            Inspection.Status.COMPLETED,
            Inspection.Status.FAILED,
        ]:
            self.message = (
                "Phiếu kiểm định đã hoàn thành, không thể thao tác trên hạng mục."
            )
            return False
        return request.user.role in [User.Role.INSPECTOR, User.Role.ADMIN]


class CanPublishInspection(BasePermission):
    """
    Công khai / ẩn kết quả kiểm định cho khách hàng:
    - Chỉ admin
    """

    message = "Chỉ quản trị viên mới có quyền công khai kết quả kiểm định."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )
