from rest_framework.routers import DefaultRouter
from .views import RefurbishmentViewSet

router = DefaultRouter()

router.register("", RefurbishmentViewSet, basename="refurbishment")

urlpatterns = router.urls
