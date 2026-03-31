from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


class CanViewVehicle(BasePermission):
    """
    Xem danh sách và chi tiết xe:
    - Xe đang niêm yết (LISTED): công khai, không cần đăng nhập
    - Xe ở trạng thái khác: chỉ nhân viên nội bộ
    """

    message = "Bạn không có quyền xem thông tin xe này."

    def has_permission(self, request, view):

        return True

    def has_object_permission(self, request, view, obj):
        from vehicles.models import VehicleUnit

        # ✅ SỬA LOGIC Ở ĐÂY
        if obj.status in [
            VehicleUnit.Status.LISTED,
            VehicleUnit.Status.RESERVED,
            VehicleUnit.Status.SOLD,
        ]:
            return True

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.Role.CUSTOMER
        )


class CanCreateVehicle(BasePermission):
    """
    Tạo hồ sơ xe mới (thu mua):
    - Nhân viên thu mua, admin
    """

    message = "Chỉ nhân viên thu mua mới có quyền tạo hồ sơ xe."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PURCHASING,
                User.Role.ADMIN,
            ]
        )


class CanEditVehicle(BasePermission):
    """
    Chỉnh sửa thông tin xe:
    - Nhân viên thu mua, định giá, admin
    """

    message = "Bạn không có quyền chỉnh sửa thông tin xe."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PURCHASING,
                User.Role.PRICING,
                User.Role.ADMIN,
            ]
        )


class CanTransitionVehicle(BasePermission):
    """
    Chuyển trạng thái vòng đời xe.
    Mỗi vai trò chỉ được chuyển đúng bước của mình:
    - Thu mua  : PURCHASED        → WAIT_INSPECTION
    - Kiểm định: WAIT_INSPECTION  → INSPECTING → INSPECTED
    - Tân trang: WAIT_REFURBISH   → REFURBISHING → READY_FOR_SALE
    - Định giá : INSPECTED        → WAIT_REFURBISH | READY_FOR_SALE
    - Bán hàng : READY_FOR_SALE   → LISTED → RESERVED → SOLD → WARRANTY
    - Admin    : tất cả
    """

    message = "Bạn không có quyền thay đổi trạng thái xe này."

    # Vai trò → danh sách trạng thái mà vai trò đó được phép chuyển đi
    ROLE_ALLOWED_FROM = {
        User.Role.PURCHASING: [
            "PURCHASED",
        ],
        User.Role.INSPECTOR: [
            "WAIT_INSPECTION",
            "INSPECTING",
        ],
        User.Role.TECHNICIAN: [
            "WAIT_REFURBISH",
            "REFURBISHING",
        ],
        User.Role.PRICING: [
            "INSPECTED",
        ],
        User.Role.SALES: [
            "READY_FOR_SALE",
            "LISTED",
            "RESERVED",
            "SOLD",
        ],
    }

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.Role.CUSTOMER
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True
        allowed_from = self.ROLE_ALLOWED_FROM.get(request.user.role, [])
        return obj.status in allowed_from


class CanUploadVehicleMedia(BasePermission):
    """
    Upload / xóa hình ảnh, video xe:
    - Thu mua, nhân viên bán hàng, admin
    """

    message = "Bạn không có quyền tải lên / xóa media của xe."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                User.Role.PURCHASING,
                User.Role.SALES,
                User.Role.ADMIN,
            ]
        )


class CanDeleteVehicle(BasePermission):
    """
    Xóa xe — chỉ admin.
    Xe đã bán (SOLD) không được phép xóa.
    """

    message = "Chỉ quản trị viên mới có quyền xóa xe."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )

    def has_object_permission(self, request, view, obj):
        from vehicles.models import VehicleUnit

        if obj.status == VehicleUnit.Status.SOLD:
            self.message = "Không thể xóa xe đã bán."
            return False
        return request.user.role == User.Role.ADMIN
