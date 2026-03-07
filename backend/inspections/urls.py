from rest_framework.routers import DefaultRouter
from .views import InspectionViewSet

router = DefaultRouter()

router.register("", InspectionViewSet, basename="inspections")

urlpatterns = router.urls
