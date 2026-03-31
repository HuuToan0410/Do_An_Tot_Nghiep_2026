from django.db.models import Sum, Count, Q, F, DecimalField
from django.db.models.functions import TruncMonth, TruncWeek, TruncQuarter
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from datetime import timedelta

from sales.models import SalesOrder, Deposit
from sales.permissions import CanViewDashboard


# ── Tỷ lệ hoa hồng mặc định (có thể đưa vào settings) ──────────
COMMISSION_RATE = 0.02  # 2% trên giá bán


class RevenueByMonthView(APIView):
    """GET /api/admin/revenue/ — doanh thu theo tháng (FIX: sale_price thay final_price)"""

    permission_classes = [CanViewDashboard]

    def get(self, request):
        rows = (
            SalesOrder.objects.annotate(month=TruncMonth("sold_at"))
            .values("month")
            .annotate(
                total=Sum("sale_price"),  # ✅ đúng field
                count=Count("id"),
            )
            .order_by("month")
        )
        return Response(
            [
                {
                    "month": r["month"].strftime("%Y-%m") if r["month"] else None,
                    "total": str(r["total"] or 0),
                    "count": r["count"],
                }
                for r in rows
            ]
        )


class RevenueByWeekView(APIView):
    """GET /api/admin/revenue/week/ — doanh thu 12 tuần gần nhất"""

    permission_classes = [CanViewDashboard]

    def get(self, request):
        since = timezone.now() - timedelta(weeks=12)
        rows = (
            SalesOrder.objects.filter(sold_at__gte=since)
            .annotate(week=TruncWeek("sold_at"))
            .values("week")
            .annotate(
                total=Sum("sale_price"),
                count=Count("id"),
            )
            .order_by("week")
        )
        return Response(
            [
                {
                    "week": r["week"].strftime("%Y-%m-%d") if r["week"] else None,
                    "total": str(r["total"] or 0),
                    "count": r["count"],
                }
                for r in rows
            ]
        )


class RevenueByQuarterView(APIView):
    """GET /api/admin/revenue/quarter/ — doanh thu theo quý"""

    permission_classes = [CanViewDashboard]

    def get(self, request):
        rows = (
            SalesOrder.objects.annotate(quarter=TruncQuarter("sold_at"))
            .values("quarter")
            .annotate(
                total=Sum("sale_price"),
                count=Count("id"),
            )
            .order_by("quarter")
        )

        data = []
        for r in rows:
            if r["quarter"]:
                month = r["quarter"].month
                quarter_num = (month - 1) // 3 + 1
                label = f"Q{quarter_num}/{r['quarter'].year}"
            else:
                label = "—"
            data.append(
                {
                    "quarter": label,
                    "period": (
                        r["quarter"].strftime("%Y-%m-%d") if r["quarter"] else None
                    ),
                    "total": str(r["total"] or 0),
                    "count": r["count"],
                }
            )

        return Response(data)


class SalesCommissionView(APIView):
    """
    GET /api/admin/commissions/
    Thống kê hoa hồng nhân viên bán hàng.
    Query params: ?period=month|quarter|all&rate=2 (rate theo %)
    """

    permission_classes = [CanViewDashboard]

    def get(self, request):
        period = request.query_params.get("period", "month")
        rate = float(request.query_params.get("rate", COMMISSION_RATE * 100)) / 100

        # Filter theo period
        qs = SalesOrder.objects.select_related("sold_by")
        now = timezone.now()

        if period == "month":
            qs = qs.filter(
                sold_at__year=now.year,
                sold_at__month=now.month,
            )
            period_label = f"Tháng {now.month}/{now.year}"
        elif period == "quarter":
            quarter = (now.month - 1) // 3 + 1
            start_month = (quarter - 1) * 3 + 1
            qs = qs.filter(
                sold_at__year=now.year,
                sold_at__month__gte=start_month,
                sold_at__month__lt=start_month + 3,
            )
            period_label = f"Q{quarter}/{now.year}"
        elif period == "week":
            week_start = now - timedelta(days=now.weekday())
            qs = qs.filter(sold_at__gte=week_start)
            period_label = f"Tuần {week_start.strftime('%d/%m/%Y')}"
        else:
            period_label = "Tất cả thời gian"

        # Group by nhân viên
        staff_stats = (
            qs.values(
                "sold_by__id",
                "sold_by__first_name",
                "sold_by__last_name",
                "sold_by__username",
            )
            .annotate(
                total_revenue=Sum("sale_price"),
                total_orders=Count("id"),
            )
            .order_by("-total_revenue")
        )

        data = []
        total_commission_all = 0
        for s in staff_stats:
            revenue = float(s["total_revenue"] or 0)
            commission = revenue * rate
            total_commission_all += commission
            fname = s["sold_by__first_name"] or ""
            lname = s["sold_by__last_name"] or ""
            name = f"{fname} {lname}".strip() or s["sold_by__username"] or "—"
            data.append(
                {
                    "staff_id": s["sold_by__id"],
                    "staff_name": name,
                    "total_orders": s["total_orders"],
                    "total_revenue": str(int(revenue)),
                    "commission_rate": f"{rate * 100:.1f}%",
                    "commission_amount": str(int(commission)),
                }
            )

        # Tổng overview
        totals = qs.aggregate(
            grand_total=Sum("sale_price"),
            grand_count=Count("id"),
        )

        return Response(
            {
                "period": period_label,
                "commission_rate": f"{rate * 100:.1f}%",
                "total_orders": totals["grand_count"] or 0,
                "total_revenue": str(int(totals["grand_total"] or 0)),
                "total_commission": str(int(total_commission_all)),
                "staff": data,
            }
        )


class DepositAdminListView(APIView):
    """
    GET /api/admin/deposits-list/
    Danh sách TẤT CẢ deposits cho admin — có phân trang + filter
    """

    permission_classes = [CanViewDashboard]

    def get(self, request):
        from sales.serializers import DepositSerializer

        qs = Deposit.objects.select_related(
            "vehicle", "customer", "confirmed_by"
        ).order_by("-created_at")

        # Filters
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search", "").strip()
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 15))

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = (
                qs.filter(customer_name__icontains=search)
                | qs.filter(customer_phone__icontains=search)
                | qs.filter(vehicle__brand__icontains=search)
                | qs.filter(vehicle__model__icontains=search)
            )

        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = qs[start:end]

        serializer = DepositSerializer(items, many=True)

        return Response(
            {
                "count": total,
                "next": None if end >= total else f"?page={page + 1}",
                "previous": None if page <= 1 else f"?page={page - 1}",
                "results": serializer.data,
            }
        )
