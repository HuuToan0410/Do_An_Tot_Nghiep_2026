from django.urls import path
from sales import views
from sales.views_momo import (
    DepositCreateWithMoMoView,
    MoMoIPNView,
    DepositMoMoStatusView,
)
from sales.views_revenue import (
    RevenueByMonthView,
    RevenueByWeekView,
    RevenueByQuarterView,
    SalesCommissionView,
    DepositAdminListView,
)

urlpatterns = [
    # ── Dashboard ──────────────────────────────────────────────
    path("admin/stats/", views.DashboardStatsView.as_view(), name="dashboard-stats"),
    path(
        "admin/recent-deposits/",
        views.RecentDepositsView.as_view(),
        name="recent-deposits",
    ),
    path(
        "admin/overview/",
        views.DashboardOverviewView.as_view(),
        name="dashboard-overview",
    ),
    path("admin/revenue/", views.RevenueView.as_view(), name="revenue"),
    path("admin/audit-logs/", views.AuditLogListView.as_view(), name="audit-logs"),
    # ── Pricing ────────────────────────────────────────────────
    path("admin/pricings/", views.PricingListView.as_view(), name="pricing-list"),
    path(
        "admin/pricings/<int:pk>/",
        views.PricingDetailView.as_view(),
        name="pricing-detail",
    ),
    path(
        "admin/pricings/<int:pk>/approve/",
        views.PricingApproveView.as_view(),
        name="pricing-approve",
    ),
    path(
        "admin/pricings/<int:pk>/reject/",
        views.PricingRejectView.as_view(),
        name="pricing-reject",
    ),
    # ── Commission ─────────────────────────────────────────────
    path("admin/commissions/", SalesCommissionView.as_view(), name="sales-commissions"),
    # ── Deposits admin list (ALL deposits, not just user's) ────
    path(
        "admin/deposits-list/",
        DepositAdminListView.as_view(),
        name="admin-deposits-list",
    ),
    # ── Listing ────────────────────────────────────────────────
    path("listings/", views.ListingListView.as_view(), name="listing-list"),
    path("listings/create/", views.ListingCreateView.as_view(), name="listing-create"),
    path(
        "listings/<int:pk>/", views.ListingDetailView.as_view(), name="listing-detail"
    ),
    # ── Appointment ────────────────────────────────────────────
    path("appointments/", views.AppointmentListView.as_view(), name="appointment-list"),
    path(
        "appointments/<int:pk>/",
        views.AppointmentDetailView.as_view(),
        name="appointment-detail",
    ),
    # ── Deposit ────────────────────────────────────────────────
    # path("deposits/", views.DepositListView.as_view(), name="deposit-list"),
    path(
        "deposits/<int:pk>/", views.DepositDetailView.as_view(), name="deposit-detail"
    ),
    path(
        "deposits/<int:pk>/confirm/",
        views.DepositConfirmView.as_view(),
        name="deposit-confirm",
    ),
    path(
        "deposits/<int:pk>/cancel/",
        views.DepositCancelView.as_view(),
        name="deposit-cancel",
    ),
    path("deposits/", DepositCreateWithMoMoView.as_view(), name="deposit-create"),
    path(
        "deposits/<int:pk>/momo/",
        DepositMoMoStatusView.as_view(),
        name="deposit-momo-status",
    ),
    path("momo/ipn/", MoMoIPNView.as_view(), name="momo-ipn"),
    # ── Sales Order ────────────────────────────────────────────
    path("sales-orders/", views.SalesOrderListView.as_view(), name="sales-order-list"),
    path(
        "sales-orders/<int:pk>/",
        views.SalesOrderDetailView.as_view(),
        name="sales-order-detail",
    ),
    # ── Handover ───────────────────────────────────────────────
    path("handovers/", views.HandoverListView.as_view()),
    path("handovers/", views.HandoverCreateView.as_view(), name="handover-create"),
    path(
        "handovers/<int:pk>/",
        views.HandoverDetailView.as_view(),
        name="handover-detail",
    ),
    
    # ── Warranty ───────────────────────────────────────────────
    path("warranties/", views.WarrantyListView.as_view(), name="warranty-list"),
    path(
        "warranties/<int:pk>/",
        views.WarrantyDetailView.as_view(),
        name="warranty-detail",
    ),
    # ------------------------Favorite
    path(
        "favorites/",
        views.FavoriteListView.as_view(),
        name="favorite-list",
    ),
    path(
        "favorites/<int:vehicle_id>/toggle/",
        views.FavoriteToggleView.as_view(),
        name="favorite-toggle",
    ),
    path(
        "favorites/<int:vehicle_id>/status/",
        views.FavoriteStatusView.as_view(),
        name="favorite-status",
    ),
    #--------------revenue
    path("dashboard/revenue/", views.RevenueView.as_view()),
]
