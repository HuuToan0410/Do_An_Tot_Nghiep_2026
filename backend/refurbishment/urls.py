from django.urls import path
from refurbishment import views

urlpatterns = [
    path(
        "refurbishments/",
        views.RefurbishmentListView.as_view(),
        name="refurbishment-list",
    ),
    path(
        "refurbishments/create/",
        views.RefurbishmentCreateView.as_view(),
        name="refurbishment-create",
    ),
    path(
        "refurbishments/<int:pk>/",
        views.RefurbishmentDetailView.as_view(),
        name="refurbishment-detail",
    ),
    path(
        "refurbishments/<int:pk>/complete/",
        views.RefurbishmentCompleteView.as_view(),
        name="refurbishment-complete",
    ),
    path(
        "refurbishments/<int:pk>/cancel/",
        views.RefurbishmentCancelView.as_view(),
        name="refurbishment-cancel",
    ),
    path(
        "refurbishments/<int:pk>/items/",
        views.RefurbishmentItemView.as_view(),
        name="refurbishment-items",
    ),
    path(
        "refurbishments/items/<int:pk>/",
        views.RefurbishmentItemDetailView.as_view(),
        name="refurbishment-item-detail",
    ),
    path("refurbishments/<int:pk>/start/", views.RefurbishmentStartView.as_view()),
]
