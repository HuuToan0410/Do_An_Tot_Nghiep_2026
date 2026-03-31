from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from vehicles.models import VehicleUnit
from sales.models import Deposit


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_stats(request):

    total_vehicles = VehicleUnit.objects.count()

    total_deposits = Deposit.objects.count()

    # xe đang chờ kiểm định
    total_inspections = VehicleUnit.objects.filter(
        status=VehicleUnit.Status.CHO_KIEM_DINH
    ).count()

    # deposit chưa xác nhận
    pending_deposits = Deposit.objects.filter(confirmed=False).count()

    # xe đã bán
    sold_cars = VehicleUnit.objects.filter(status=VehicleUnit.Status.DA_BAN).count()

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
            "brands": brands,
        }
    )
