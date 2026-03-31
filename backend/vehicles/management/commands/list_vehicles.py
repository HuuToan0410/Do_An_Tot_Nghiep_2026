# vehicles/management/commands/list_vehicles.py
#
# Cách dùng:
#   python manage.py list_vehicles                  # xem preview, không làm gì
#   python manage.py list_vehicles --confirm        # chuyển tất cả xe đủ điều kiện → LISTED
#   python manage.py list_vehicles --status READY_FOR_SALE --confirm
#   python manage.py list_vehicles --all --confirm  # kể cả xe chưa qua kiểm định/tân trang
#   python manage.py list_vehicles --ids 1,2,3 --confirm  # chỉ chuyển xe cụ thể

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from vehicles.models import VehicleUnit, VehicleStatusLog

User = get_user_model()

# Các trạng thái được phép chuyển sang LISTED
ALLOWED_STATUSES = [
    "READY_FOR_SALE",
    "INSPECTED",
    "PURCHASED",
    "WAIT_INSPECTION",
    "INSPECTING",
    "WAIT_REFURBISH",
    "REFURBISHING",
]

STATUS_LABELS = {
    "PURCHASED": "Mới nhập",
    "WAIT_INSPECTION": "Chờ kiểm định",
    "INSPECTING": "Đang kiểm định",
    "INSPECTED": "Đã kiểm định",
    "WAIT_REFURBISH": "Chờ tân trang",
    "REFURBISHING": "Đang tân trang",
    "READY_FOR_SALE": "Sẵn sàng bán",
    "LISTED": "Đang đăng bán",
}


class Command(BaseCommand):
    help = "Chuyển hàng loạt xe sang trạng thái LISTED"

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Thực sự thực hiện (không có flag này chỉ preview)",
        )
        parser.add_argument(
            "--status",
            type=str,
            default="READY_FOR_SALE",
            help="Chỉ chuyển xe đang ở trạng thái này (mặc định: READY_FOR_SALE)",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Chuyển tất cả xe chưa LISTED/SOLD/RESERVED/WARRANTY",
        )
        parser.add_argument(
            "--ids",
            type=str,
            help="Danh sách ID cụ thể, cách nhau bằng dấu phẩy: --ids 1,2,3",
        )
        parser.add_argument(
            "--user",
            type=str,
            default="admin",
            help="Username dùng để ghi VehicleStatusLog (mặc định: admin)",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]
        status_from = options["status"].upper()
        use_all = options["all"]
        ids_str = options["ids"]
        username = options["user"]

        # ── Xác định queryset ───────────────────────────────────
        if ids_str:
            ids = [int(i.strip()) for i in ids_str.split(",") if i.strip()]
            qs = VehicleUnit.objects.filter(id__in=ids).exclude(
                status__in=["LISTED", "SOLD", "RESERVED", "WARRANTY"]
            )
        elif use_all:
            qs = VehicleUnit.objects.exclude(
                status__in=["LISTED", "SOLD", "RESERVED", "WARRANTY"]
            )
        else:
            if status_from not in ALLOWED_STATUSES:
                self.stderr.write(
                    self.style.ERROR(
                        f"Trạng thái '{status_from}' không hợp lệ.\n"
                        f"Các giá trị hợp lệ: {', '.join(ALLOWED_STATUSES)}"
                    )
                )
                return
            qs = VehicleUnit.objects.filter(status=status_from)

        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("Không có xe nào phù hợp để chuyển."))
            return

        # ── Preview ─────────────────────────────────────────────
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(
            f"  Tổng xe sẽ chuyển sang LISTED: {self.style.SUCCESS(str(total))}"
        )
        self.stdout.write(f"{'='*60}")

        # Thống kê theo trạng thái hiện tại
        from django.db.models import Count

        stats = qs.values("status").annotate(n=Count("id")).order_by("-n")
        self.stdout.write("\nPhân bố trạng thái hiện tại:")
        for row in stats:
            label = STATUS_LABELS.get(row["status"], row["status"])
            self.stdout.write(f"  {label:30s} : {row['n']:>4} xe")

        # Vài xe mẫu
        self.stdout.write("\nMột số xe sẽ được chuyển:")
        for v in qs[:8]:
            self.stdout.write(
                f"  #{v.id:>4}  {v.brand} {v.model} {v.year or ''}  "
                f"[{STATUS_LABELS.get(v.status, v.status)}]  "
                f"{v.sale_price or '(chưa có giá)'}"
            )
        if total > 8:
            self.stdout.write(f"  ... và {total - 8} xe khác")

        self.stdout.write(f"\n{'='*60}")

        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    "\n[DRY RUN] Chưa thực hiện.\n"
                    "Thêm --confirm để thực sự chuyển trạng thái.\n"
                    f"Ví dụ: python manage.py list_vehicles --all --confirm\n"
                )
            )
            return

        # ── Lấy system user để ghi log ──────────────────────────
        try:
            system_user = User.objects.get(username=username)
        except User.DoesNotExist:
            system_user = User.objects.filter(role="ADMIN").first()
            if not system_user:
                system_user = User.objects.first()

        # ── Thực hiện chuyển trạng thái ─────────────────────────
        self.stdout.write(f"\nĐang chuyển {total} xe...")

        logs = []
        done = 0
        skipped = 0

        for v in qs.select_related():
            # Bỏ qua xe chưa có giá bán
            if not v.sale_price or float(v.sale_price) <= 0:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Bỏ qua #{v.id} {v.brand} {v.model} — chưa có giá bán"
                    )
                )
                skipped += 1
                continue

            old_status = v.status
            v.status = "LISTED"
            v.save(update_fields=["status", "updated_at"])

            logs.append(
                VehicleStatusLog(
                    vehicle=v,
                    old_status=old_status,
                    new_status="LISTED",
                    changed_by=system_user,
                    note="Bulk list — chuyển hàng loạt qua management command",
                )
            )
            done += 1

        # Bulk insert logs
        if logs:
            VehicleStatusLog.objects.bulk_create(logs)

        # ── Kết quả ─────────────────────────────────────────────
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS(f"  ✓ Đã chuyển sang LISTED : {done} xe"))
        if skipped:
            self.stdout.write(
                self.style.WARNING(f"  ⚠ Bỏ qua (chưa có giá) : {skipped} xe")
            )
        self.stdout.write(f"{'='*60}\n")

        if skipped:
            self.stdout.write(
                "Xe bị bỏ qua do chưa có giá bán. Để set giá và list luôn:\n"
                "  python manage.py list_vehicles --all --set-price 500000000 --confirm\n"
            )
