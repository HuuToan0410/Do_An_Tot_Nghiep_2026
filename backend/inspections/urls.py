from django.urls import path
from inspections import views

urlpatterns = [
    # GET  /api/inspections/categories/
    path("inspections/categories/",views.InspectionCategoryListView.as_view(),name="inspection-categories",),
    # GET  /api/inspections/          → danh sách (staff lọc theo vehicle/status)
    path(
        "inspections/",
        views.InspectionListView.as_view(),
        name="inspection-list",
    ),
    # POST /api/inspections/create/   → tạo phiếu mới
    path(
        "inspections/create/",
        views.InspectionCreateView.as_view(),
        name="inspection-create",
    ),
    # GET/PATCH/DELETE /api/inspections/<id>/
    path(
        "inspections/<int:pk>/",
        views.InspectionDetailView.as_view(),
        name="inspection-detail",
    ),
    # POST /api/inspections/<id>/complete/  → hoàn thành kiểm định
    path(
        "inspections/<int:pk>/complete/",
        views.InspectionCompleteView.as_view(),
        name="inspection-complete",
    ),
    # POST /api/inspections/<id>/publish/   → công khai kết quả cho khách
    path(
        "inspections/<int:pk>/publish/",
        views.InspectionPublishView.as_view(),
        name="inspection-publish",
    ),
    # GET/POST /api/inspections/<id>/items/
    path(
        "inspections/<int:pk>/items/",
        views.InspectionItemView.as_view(),
        name="inspection-items",
    ),
    # PATCH/DELETE /api/inspections/items/<id>/
    path(
        "inspections/items/<int:pk>/",
        views.InspectionItemDetailView.as_view(),
        name="inspection-item-detail",
    ),
    # GET /api/inspections/public/<id>/   → public, không cần auth
    path(
        "inspections/public/<int:pk>/",
        views.InspectionPublicView.as_view(),
        name="inspection-public",
    ),
]
