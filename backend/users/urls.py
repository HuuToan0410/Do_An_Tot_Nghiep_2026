from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import SellRequestView, ContactRequestView
from users import views

urlpatterns = [
    # Auth
    path("auth/login/", views.CustomTokenObtainPairView.as_view(), name="token-obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/me/", views.me, name="me"),
    path("auth/profile/", views.ProfileView.as_view(), name="profile"),
    path("auth/change-password/",views.ChangePasswordView.as_view(),name="change-password",),
    # Profile
   
    path("sell-request/", SellRequestView.as_view(), name="sell-request"),
    path("contact-request/", ContactRequestView.as_view(), name="contact-request"),
    # Admin
    path("admin/users/", views.AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/create/",views.AdminUserCreateView.as_view(),name="admin-user-create",),
    path("admin/users/<int:pk>/",views.AdminUserDetailView.as_view(),name="admin-user-detail",),
    path("admin/users/<int:pk>/reset-password/",views.AdminUserResetPasswordView.as_view(),name="admin-user-reset-pw",),
]
