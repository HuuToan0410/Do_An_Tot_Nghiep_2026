from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),
    # Authentication
    path("api/auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    # Users
    path("api/users/", include("users.urls")),
    # Vehicles
    path("api/vehicles/", include("vehicles.urls")),
    # Inspections
    path("api/inspections/", include("inspections.urls")),
    # Refurbishment
    path("api/refurbishment/", include("refurbishment.urls")),
    # Sales
    path("api/sales/", include("sales.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
