from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from sales.views import RevenueStatsView, RevenueView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),  # auth, profile
    path("api/", include("vehicles.urls")),  # vehicles, media, transition
    path("api/", include("inspections.urls")),  # inspections
    path("api/", include("refurbishment.urls")),
    path("api/", include("sales.urls")),  # deposits, dashboard stats
    # urls.py
    #path("api/admin/revenue/", RevenueStatsView.as_view()),
    path("api/dashboard/revenue/", RevenueView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
