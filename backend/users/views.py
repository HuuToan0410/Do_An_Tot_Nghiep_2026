"""
Views xử lý API liên quan đến người dùng.

Bao gồm:
- Đăng ký tài khoản
- Quản lý người dùng (chỉ admin)

Sử dụng Django Rest Framework.
"""

from django.contrib.auth import get_user_model

from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny

from .serializers import UserSerializer, RegisterSerializer
from .permissions import IsAdmin


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    API đăng ký tài khoản người dùng.

    Endpoint:
        POST /api/auth/register/

    Chức năng:
        - Tạo tài khoản mới
        - Mặc định role = CUSTOMER
        - Không cần đăng nhập
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Giới hạn queryset chỉ khi cần thiết.
        DRF yêu cầu phải có queryset.
        """
        return User.objects.all()


class UserViewSet(ModelViewSet):
    """
    API quản lý người dùng (Admin).

    Endpoint:
        /api/users/

    Chức năng:
        - Xem danh sách user
        - Xem chi tiết user
        - Cập nhật user
        - Xóa user

    Chỉ ADMIN mới có quyền truy cập.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        """
        Tối ưu truy vấn.

        only() giúp giảm dữ liệu lấy từ database
        giúp tiết kiệm RAM và tăng tốc query.
        """

        return User.objects.only(
            "id",
            "username",
            "email",
            "role",
            "phone",
            "created_at",
        ).order_by("-created_at")
