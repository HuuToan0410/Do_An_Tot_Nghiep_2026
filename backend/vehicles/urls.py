from django.urls import path, include
from rest_framework.routers import DefaultRouter

from vehicles.analytics_views import VehicleLifecycleAPI
from .views import VehicleViewSet

router = DefaultRouter()

router.register("", VehicleViewSet, basename="vehicles")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "<int:vehicle_id>/lifecycle/",
        VehicleLifecycleAPI.as_view(),
        name="vehicle-lifecycle",
    ),
]
