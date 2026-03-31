from django.urls import path
from vehicles import views
from sales.views import VehicleLifecycleView
from inspections.views import VehiclePublicInspectionView

urlpatterns = [
    # ── Public ──────────────────────────────────────────────
    # GET /api/vehicles/          → danh sách xe LISTED (public)
    # GET /api/vehicles/<id>/lifecycle/  → status_logs[] trong VehicleDetailPage
    path(
        "vehicles/<int:vehicle_id>/lifecycle/",
        VehicleLifecycleView.as_view(),
        name="vehicle-lifecycle",
    ),
    path(
        "vehicles/",
        views.VehicleListView.as_view(),
        name="vehicle-list",
    ),
    # GET /api/vehicles/<id>/     → chi tiết xe (phân quyền trong view)
    path(
        "vehicles/<int:pk>/",
        views.VehicleDetailView.as_view(),
        name="vehicle-detail",
    ),
    # ── Admin / Internal ────────────────────────────────────
    # GET  /api/admin/vehicles/         → danh sách toàn bộ xe (staff)
    path(
        "admin/vehicles/",
        views.VehicleAdminListView.as_view(),
        name="admin-vehicle-list",
    ),
    # POST /api/admin/vehicles/create/  → tạo xe mới
    path(
        "admin/vehicles/create/",
        views.VehicleCreateView.as_view(),
        name="vehicle-create",
    ),
    # GET/PATCH/DELETE /api/admin/vehicles/<id>/
    path(
        "admin/vehicles/<int:pk>/",
        views.VehicleAdminDetailView.as_view(),
        name="admin-vehicle-detail",
    ),
    # POST /api/admin/vehicles/<id>/transition/   → chuyển trạng thái
    path(
        "admin/vehicles/<int:pk>/transition/",
        views.VehicleTransitionView.as_view(),
        name="vehicle-transition",
    ),
    # POST   /api/admin/vehicles/<id>/media/      → upload ảnh/video
    # DELETE /api/admin/vehicles/<id>/media/<media_id>/  → xóa media
    path(
        "admin/vehicles/<int:pk>/media/",
        views.VehicleMediaUploadView.as_view(),
        name="vehicle-media-upload",
    ),
    path(
        "admin/vehicles/<int:pk>/media/<int:media_id>/",
        views.VehicleMediaDeleteView.as_view(),
        name="vehicle-media-delete",
    ),
    # GET /api/vehicles/<id>/lifecycle/   → lịch sử trạng thái
    path(
        "vehicles/<int:vehicle_id>/lifecycle/",
        views.VehicleLifecycleView.as_view(),
        name="vehicle-lifecycle",
    ),
    path(
        "vehicles/<int:vehicle_id>/inspection/",
        VehiclePublicInspectionView.as_view(),
        name="vehicle-public-inspection",
    ),
]
