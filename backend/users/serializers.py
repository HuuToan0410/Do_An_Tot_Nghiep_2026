from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer dùng để trả dữ liệu người dùng ra API.
    Không bao gồm mật khẩu nhằm đảm bảo bảo mật.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "role",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "role",
            "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer dùng cho chức năng đăng ký tài khoản.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        max_length=128,
        style={"input_type": "password"},
        help_text="Mật khẩu tối thiểu 6 ký tự",
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
            "password",
        ]

    def validate_email(self, value):
        """
        Kiểm tra email đã tồn tại hay chưa.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã tồn tại trong hệ thống.")
        return value

    def validate_username(self, value):
        """
        Kiểm tra username đã tồn tại hay chưa.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên đăng nhập đã tồn tại.")
        return value

    def create(self, validated_data):
        """
        Tạo user mới bằng create_user để tự động hash password.
        """

        user = User.objects.create_user(
            username=validated_data.get("username"),
            email=validated_data.get("email"),
            phone=validated_data.get("phone"),
            password=validated_data.get("password"),
        )

        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer dùng khi cần xem chi tiết người dùng.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "role",
            "created_at",
            "updated_at",
        ]
