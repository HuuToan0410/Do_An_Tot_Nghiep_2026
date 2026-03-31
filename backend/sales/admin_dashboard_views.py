from django.db.models import Count, Sum, Q
from django.db.models.functions import ExtractQuarter, ExtractYear, TruncMonth, TruncWeek
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from backend.sales.permissions import CanViewDashboard
from vehicles.models import VehicleUnit, VehicleStatusLog
from sales.models import Deposit, SalesOrder


class DashboardStatsView(APIView):
    """
    GET /api/admin/stats/

    Trả về thống kê cho AdminDashboardPage.
    Khớp với getDashboardStats() trong api/dashboard.ts:
    {
        total_vehicles, total_deposits, total_inspections,
        pending_deposits, sold_cars, brands: [{brand, total}]
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from inspections.models import Inspection

        # Tổng xe trong hệ thống
        total_vehicles = VehicleUnit.objects.count()

        # Tổng đặt cọc
        total_deposits = Deposit.objects.count()

        # Tổng phiếu kiểm định
        total_inspections = Inspection.objects.count()

        # Đặt cọc chờ xác nhận (PENDING)
        pending_deposits = Deposit.objects.filter(status="PENDING").count()

        # Xe đã bán
        sold_cars = VehicleUnit.objects.filter(status="SOLD").count()

        # Thống kê theo hãng xe (top 8)
        brands = list(
            VehicleUnit.objects.values("brand")
            .annotate(total=Count("id"))
            .order_by("-total")[:8]
        )

        return Response(
            {
                "total_vehicles": total_vehicles,
                "total_deposits": total_deposits,
                "total_inspections": total_inspections,
                "pending_deposits": pending_deposits,
                "sold_cars": sold_cars,
                "brands": brands,  # [{brand: "Toyota", total: 12}, ...]
            }
        )


class RecentDepositsView(APIView):
    """
    GET /api/admin/recent-deposits/

    Khớp với getRecentDeposits() trong api/dashboard.ts:
    [{
        id, customer_name_display, phone,
        vehicle_name, status, created_at
    }]
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        deposits = Deposit.objects.select_related("vehicle", "customer").order_by(
            "-created_at"
        )[:10]

        data = []
        for d in deposits:
            # customer_name_display: ưu tiên customer_name field,
            # fallback về user full_name, rồi username
            if hasattr(d, "customer_name") and d.customer_name:
                name = d.customer_name
            elif d.customer:
                name = d.customer.get_full_name() or d.customer.username
            else:
                name = "Khách vãng lai"

            vehicle_name = ""
            if d.vehicle:
                vehicle_name = f"{d.vehicle.brand} {d.vehicle.model} {d.vehicle.year or ''}".strip()

            data.append(
                {
                    "id": d.id,
                    "customer_name_display": name,
                    "phone": getattr(d, "customer_phone", "") or "",
                    "vehicle_name": vehicle_name,
                    "status": d.status,  # uppercase: PENDING / CONFIRMED...
                    "amount": str(d.amount),
                    "created_at": d.created_at.isoformat(),
                }
            )

        return Response(data)


class RevenueByMonthView(APIView):
    """
    GET /api/admin/revenue/
    Thống kê doanh thu theo tháng.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        revenue = (
            SalesOrder.objects.only("final_price", "sold_at")
            .annotate(month=TruncMonth("sold_at"))
            .values("month")
            .annotate(total=Sum("final_price"))
            .order_by("month")
        )

        return Response(
            {
                "revenue_by_month": [
                    {
                        "month": r["month"].strftime("%Y-%m") if r["month"] else None,
                        "total": r["total"] or 0,
                    }
                    for r in revenue
                ]
            }
        )


class VehicleLifecycleView(APIView):
    """
    GET /api/vehicles/<vehicle_id>/lifecycle/
    Lịch sử thay đổi trạng thái xe — hiển thị ở VehicleDetailPage.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, vehicle_id):
        logs = (
            VehicleStatusLog.objects.filter(vehicle_id=vehicle_id)
            .select_related("changed_by")
            .order_by("changed_at")
            .values(
                "id",
                "old_status",
                "new_status",
                "changed_at",
                "changed_by__username",
                "note",
            )
        )

        return Response(
            {
                "vehicle_id": vehicle_id,
                "total_changes": len(list(logs)),  # evaluate once
                "status_logs": [
                    {
                        "id": log["id"],
                        "old_status": log["old_status"],
                        "new_status": log["new_status"],
                        "changed_at": log["changed_at"].isoformat(),
                        "changed_by": log["changed_by__username"] or "system",
                        "note": log["note"] or "",
                    }
                    for log in logs
                ],
            }
        )


class RevenueView(APIView):
    """
    GET /api/dashboard/revenue/?period=month|week|quarter

    Trả về array trực tiếp (không wrap trong object).
    Dùng sold_at (không phải created_at).
    Format date thành string ngắn gọn cho frontend.
    """

    permission_classes = [CanViewDashboard]

    def get(self, request):
        period = request.query_params.get("period", "month")
        qs = SalesOrder.objects.all()

        if period == "week":
            data = (
                qs.annotate(week=TruncWeek("sold_at"))  # ✅ sold_at
                .values("week")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("week")
            )
            return Response(
                [
                    {
                        "week": (
                            row["week"].strftime("%Y-%m-%d") if row["week"] else None
                        ),
                        "total": str(row["total"] or 0),
                        "count": row["count"],
                    }
                    for row in data
                    if row["week"]
                ]
            )

        elif period == "quarter":
            data = (
                qs.annotate(
                    year=ExtractYear("sold_at"),  # ✅ sold_at
                    quarter=ExtractQuarter("sold_at"),
                )
                .values("year", "quarter")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("year", "quarter")
            )
            return Response(
                [
                    {
                        "quarter": f"Q{row['quarter']}/{row['year']}",  # "Q1/2026"
                        "total": str(row["total"] or 0),
                        "count": row["count"],
                    }
                    for row in data
                ]
            )

        else:  # month (default)
            data = (
                qs.annotate(month=TruncMonth("sold_at"))  # ✅ sold_at
                .values("month")
                .annotate(total=Sum("sale_price"), count=Count("id"))
                .order_by("month")
            )
            return Response(
                [
                    {
                        "month": (
                            row["month"].strftime("%Y-%m") if row["month"] else None
                        ),
                        # ✅ "2026-03" — không phải ISO full datetime
                        "total": str(row["total"] or 0),
                        "count": row["count"],
                    }
                    for row in data
                    if row["month"]
                ]
            )
