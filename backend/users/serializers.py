from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import User

User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "role_display",
            "is_active",
            "is_verified",
            "date_joined",
            "avatar",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "password",
            "password_confirm",
        ]

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Mật khẩu không khớp."}
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "role",
            "is_active",
            "is_verified",
            "phone",
            "first_name",
            "last_name",
        ]


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8)


class UserRegisterSerializer(serializers.ModelSerializer):
    """Đăng ký tài khoản khách hàng"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        label="Mật khẩu",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        label="Xác nhận mật khẩu",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Mật khẩu xác nhận không khớp."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data, role=User.Role.CUSTOMER)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Thông tin cá nhân — đọc & cập nhật"""

    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True,
        label="Tên vai trò",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "avatar",
            "role",
            "role_display",
            "is_verified",
            "created_at",
        ]
        read_only_fields = ["id", "username", "role", "is_verified", "created_at"]


class UserAdminSerializer(serializers.ModelSerializer):
    """Quản lý người dùng — chỉ dành cho admin"""

    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "role",
            "role_display",
            "is_active",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChangePasswordSerializer(serializers.Serializer):
    """Đổi mật khẩu"""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        label="Mật khẩu cũ",
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        label="Mật khẩu mới",
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        label="Xác nhận mật khẩu mới",
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Mật khẩu xác nhận không khớp."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu cũ không đúng.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT token kèm thông tin người dùng"""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data
