from django.utils import timezone
from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from rest_framework.serializers import Serializer, CharField, EmailField
from django.db.models import Count
from .models import User
from .permissions import IsAdmin, IsOwnerOrAdmin
from users.serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserAdminSerializer,
    UserProfileSerializer,
    UserRegisterSerializer,
    UserListSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ResetPasswordSerializer,
)
from sales.permissions import CanViewDashboard

User = get_user_model()



class CustomTokenObtainPairView(TokenObtainPairView):
    """Đăng nhập — trả về JWT + thông tin người dùng"""

    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Đăng ký tài khoản khách hàng"""

    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Đăng ký tài khoản thành công.",
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Xem và cập nhật thông tin cá nhân"""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Đổi mật khẩu"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.last_login = timezone.now()
        request.user.save()
        return Response({"message": "Đổi mật khẩu thành công."})


class UserAdminListView(generics.ListCreateAPIView):
    """Danh sách người dùng — chỉ admin"""

    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(username__icontains=search) | qs.filter(
                email__icontains=search
            )
        return qs


class UserAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Chi tiết người dùng — chỉ admin"""

    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()


class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — danh sách người dùng"""

    serializer_class = UserListSerializer
    permission_classes = [CanViewDashboard]

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        active = self.request.query_params.get("is_active")

        if role:
            qs = qs.filter(role=role)
        if search:
            qs = (
                qs.filter(username__icontains=search)
                | qs.filter(first_name__icontains=search)
                | qs.filter(email__icontains=search)
            )
        if active is not None and active != "":
            qs = qs.filter(is_active=active.lower() == "true")

        return qs


class AdminUserCreateView(generics.CreateAPIView):
    """POST /api/admin/users/create/"""

    serializer_class = UserCreateSerializer
    permission_classes = [CanViewDashboard]


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/admin/users/<id>/"""

    queryset = User.objects.all()
    permission_classes = [CanViewDashboard]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserListSerializer


class AdminUserResetPasswordView(APIView):
    """POST /api/admin/users/<id>/reset-password/"""

    permission_classes = [CanViewDashboard]

    def post(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"message": "Đặt lại mật khẩu thành công."})


class SellRequestSerializer(Serializer):
    """Form khách muốn bán xe"""

    name = CharField(max_length=100)
    phone = CharField(max_length=20)
    email = EmailField(required=False, allow_blank=True)
    brand = CharField(max_length=100, required=False, allow_blank=True)
    model = CharField(max_length=100, required=False, allow_blank=True)
    year = CharField(max_length=10, required=False, allow_blank=True)
    mileage = CharField(max_length=20, required=False, allow_blank=True)
    expected_price = CharField(max_length=50, required=False, allow_blank=True)
    note = CharField(max_length=500, required=False, allow_blank=True)


class ContactRequestSerializer(Serializer):
    """Form khách để lại thông tin tìm xe"""

    name = CharField(max_length=100)
    phone = CharField(max_length=20, required=False, allow_blank=True)
    email = EmailField(required=False, allow_blank=True)
    message = CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, data):
        if not data.get("phone") and not data.get("email"):
            raise serializers.ValidationError(
                "Vui lòng cung cấp ít nhất số điện thoại hoặc email."
            )
        return data


class SellRequestView(APIView):
    """
    POST /api/sell-request/
    Khách hàng gửi thông tin xe muốn bán.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SellRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Lưu vào Appointment hoặc AuditLog tạm
        # Hiện tại: lưu vào database qua model SellInquiry (xem bên dưới)
        # hoặc gửi email notification
        try:
            from sales.models import SellInquiry

            SellInquiry.objects.create(
                name=data["name"],
                phone=data["phone"],
                email=data.get("email", ""),
                brand=data.get("brand", ""),
                model=data.get("model", ""),
                year=data.get("year", ""),
                mileage=data.get("mileage", ""),
                expected_price=data.get("expected_price", ""),
                note=data.get("note", ""),
            )
        except Exception:
            pass  # Nếu model chưa có thì bỏ qua

        return Response(
            {
                "message": "Chúng tôi đã nhận được thông tin. Nhân viên sẽ liên hệ trong vòng 30 phút!"
            },
            status=status.HTTP_201_CREATED,
        )


class ContactRequestView(APIView):
    """
    POST /api/contact-request/
    Khách hàng để lại thông tin tìm xe.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            from sales.models import ContactInquiry

            ContactInquiry.objects.create(
                name=data["name"],
                phone=data.get("phone", ""),
                email=data.get("email", ""),
                message=data.get("message", ""),
            )
        except Exception:
            pass

        return Response(
            {"message": "Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất có thể."},
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Thông tin người dùng hiện tại"""
    return Response(UserProfileSerializer(request.user).data)
