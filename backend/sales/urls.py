from rest_framework.routers import DefaultRouter
from .views import SalesOrderViewSet, ListingViewSet

router = DefaultRouter()

router.register("orders", SalesOrderViewSet, basename="sales-orders")

router.register("listings", ListingViewSet, basename="listings")

urlpatterns = router.urls
