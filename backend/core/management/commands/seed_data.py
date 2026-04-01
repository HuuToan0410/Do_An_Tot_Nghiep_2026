# management/commands/seed_data.py — ĐẦY ĐỦ CÁC TRƯỜNG HỢP
# python manage.py seed_data --clear --vehicles 80

import os
import random
from decimal import Decimal
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from inspections.models import Inspection, InspectionCategory, InspectionItem
from refurbishment.models import RefurbishmentItem, RefurbishmentOrder
from sales.models import (
    Appointment,
    Deposit,
    HandoverRecord,
    Listing,
    SalesOrder,
    VehiclePricing,
    WarrantyRecord,
)
from vehicles.models import VehicleMedia, VehicleSpec, VehicleStatusLog, VehicleUnit

User = get_user_model()
fake = Faker("vi_VN")

BRANDS = [
    "Toyota",
    "Honda",
    "Ford",
    "BMW",
    "Hyundai",
    "Mazda",
    "KIA",
    "Mercedes",
    "Vinfast",
    "Nissan",
]
MODELS = {
    "Toyota": ["Camry", "Corolla", "Fortuner", "Innova", "Vios", "Hilux"],
    "Honda": ["Civic", "CR-V", "HR-V", "City", "Accord", "Jazz"],
    "Ford": ["Ranger", "Explorer", "EcoSport", "Everest", "Focus"],
    "BMW": ["3 Series", "5 Series", "X3", "X5", "7 Series"],
    "Hyundai": ["Accent", "Elantra", "Tucson", "Santa Fe", "Stargazer"],
    "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-8", "CX-30"],
    "KIA": ["Morning", "Seltos", "Sportage", "Carnival", "Sorento"],
    "Mercedes": ["C-Class", "E-Class", "GLC", "GLE", "A-Class"],
    "Vinfast": ["VF3", "VF5", "VF6", "VF7", "VF8", "VF9"],
    "Nissan": ["Navara", "Terra", "X-Trail", "Almera", "Kicks"],
}
COLORS = ["Trắng", "Đen", "Bạc", "Đỏ", "Xanh", "Xám", "Nâu", "Vàng"]


class Command(BaseCommand):
    help = "Seed database với đầy đủ các trường hợp test"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear", action="store_true", help="Xóa dữ liệu cũ trước khi seed"
        )
        parser.add_argument(
            "--vehicles", type=int, default=80, help="Số xe cần tạo (default: 80)"
        )

    def handle(self, *args, **kwargs):
        clear = kwargs.get("clear")
        n_vehicles = kwargs.get("vehicles", 80)

        if clear:
            self.stdout.write(self.style.WARNING("Đang xóa dữ liệu cũ..."))
            self.clear_data()

        self.stdout.write("Đang seed dữ liệu...")

        users = self.create_users()
        self.stdout.write("  ✓ Users")

        self.create_categories()
        self.stdout.write("  ✓ Inspection categories")

        vehicles = self.create_vehicles(n_vehicles, users)
        self.stdout.write(f"  ✓ {len(vehicles)} vehicles")

        self.create_vehicle_media(vehicles)
        self.stdout.write("  ✓ Vehicle media")

        self.create_inspections(vehicles, users)
        self.stdout.write("  ✓ Inspections")

        self.create_refurbishments(vehicles, users)
        self.stdout.write("  ✓ Refurbishments")

        self.create_pricings(vehicles, users)
        self.stdout.write("  ✓ Pricings")

        self.create_listings(vehicles)
        self.stdout.write("  ✓ Listings")

        # ── Các trường hợp đặc biệt ──────────────────────────────
        self.create_appointments(vehicles, users)
        self.stdout.write(
            "  ✓ Appointments (PENDING + CONFIRMED + COMPLETED + CANCELLED)"
        )

        self.create_deposits(vehicles, users)
        self.stdout.write(
            "  ✓ Deposits (PENDING + CONFIRMED → RESERVED + CANCELLED + CONVERTED)"
        )

        self.create_sales_orders(vehicles, users)
        self.stdout.write("  ✓ Sales orders (rải đều 12 tháng)")

        self.create_handovers(users)
        self.stdout.write("  ✓ Handover records")

        self.create_warranties()
        self.stdout.write("  ✓ Warranty records (ACTIVE + sắp hết hạn + đã hết hạn)")

        self.stdout.write(self.style.SUCCESS("\n✅ Seed hoàn tất!"))
        self._print_summary()

    # ── USERS ─────────────────────────────────────────────────────

    def create_users(self):
        roles_count = {
            "ADMIN": 2,
            "PURCHASING": 3,
            "INSPECTOR": 4,
            "TECHNICIAN": 4,
            "PRICING": 3,
            "SALES": 5,
            "CUSTOMER": 20,
        }
        users = {}
        for role, count in roles_count.items():
            users[role] = []
            for i in range(count):
                u, _ = User.objects.get_or_create(
                    username=f"{role.lower()}_{i+1}",
                    defaults={
                        "role": role,
                        "email": fake.email(),
                        "first_name": fake.first_name(),
                        "last_name": fake.last_name(),
                        "phone": f"09{random.randint(10000000, 99999999)}",
                        "is_active": True,
                        "is_verified": True,
                    },
                )
                if not u.has_usable_password():
                    u.set_password("Test@12345")
                    u.save()
                users[role].append(u)

        # Admin đặc biệt
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "role": "ADMIN",
                "email": "admin@local.system",
                "first_name": "System",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
        users["ADMIN"].append(admin)
        return users

    # ── CATEGORIES ────────────────────────────────────────────────

    def create_categories(self):
        cats = [
            ("Động cơ", 1),
            ("Hộp số", 2),
            ("Thân vỏ", 3),
            ("Nội thất", 4),
            ("Hệ thống điện", 5),
            ("Hệ thống phanh", 6),
            ("Lốp & Bánh xe", 7),
            ("Hệ thống lái", 8),
        ]
        for name, order in cats:
            InspectionCategory.objects.get_or_create(
                name=name, defaults={"display_order": order}
            )

    # ── VEHICLES ──────────────────────────────────────────────────

    def create_vehicles(self, count, users):
        purchasing_users = users.get("PURCHASING", []) + users.get("ADMIN", [])

        # Phân bổ status đầy đủ các trường hợp
        statuses_pool = (
            ["PURCHASED"] * 5
            + ["WAIT_INSPECTION"] * 5
            + ["INSPECTING"] * 3
            + ["INSPECTED"] * 5
            + ["WAIT_REFURBISH"] * 5
            + ["REFURBISHING"] * 3
            + ["READY_FOR_SALE"] * 10
            + ["LISTED"] * 20  # xe đang bán — có lịch hẹn
            + ["RESERVED"] * 5  # xe đã đặt cọc
            + ["SOLD"] * 15
            + ["WARRANTY"] * 4
        )

        vehicles = []
        for i in range(count):
            brand = random.choice(BRANDS)
            model = random.choice(MODELS[brand])
            year = random.randint(2015, 2023)
            purchase_price = Decimal(random.randint(150_000_000, 700_000_000))
            status = statuses_pool[i % len(statuses_pool)]

            sale_price = None
            if status in ["LISTED", "RESERVED", "SOLD", "WARRANTY", "READY_FOR_SALE"]:
                sale_price = purchase_price + Decimal(
                    random.randint(20_000_000, 120_000_000)
                )

            v = VehicleUnit.objects.create(
                vin=f"VIN{i:04d}{random.randint(1000, 9999)}",
                brand=brand,
                model=model,
                variant=random.choice(["1.5L", "2.0L", "2.5L", "Turbo", "Premium", ""]),
                year=year,
                mileage=random.randint(5_000, 180_000),
                color=random.choice(COLORS),
                transmission=random.choice(["AUTOMATIC", "MANUAL", "CVT"]),
                fuel_type=random.choice(["GASOLINE", "DIESEL", "HYBRID"]),
                status=status,
                purchase_price=purchase_price,
                sale_price=sale_price,
                purchase_date=timezone.now().date()
                - timedelta(days=random.randint(30, 365)),
                description=f"Xe {brand} {model} {year}, tình trạng tốt, đầy đủ giấy tờ.",
                created_by=random.choice(purchasing_users),
            )

            VehicleSpec.objects.get_or_create(
                vehicle=v,
                defaults={
                    "body_type": random.choice(
                        ["SEDAN", "SUV", "HATCHBACK", "MPV", "PICKUP"]
                    ),
                    "engine_capacity": random.choice([1.4, 1.5, 1.6, 2.0, 2.5]),
                    "horsepower": random.randint(90, 280),
                    "doors": random.choice([4, 5]),
                    "seats": random.choice([5, 7]),
                    "origin": random.choice(["DOMESTIC", "IMPORTED"]),
                    "has_abs": random.choice([True, True, False]),
                    "has_airbags": random.choice([True, True, False]),
                    "airbag_count": random.choice([2, 4, 6, 8]),
                    "has_camera": random.choice([True, False]),
                    "has_360_camera": random.choice([True, False, False]),
                    "has_sunroof": random.choice([True, False, False]),
                    "engine_condition": random.choice(
                        ["Tốt", "Rất tốt", "Bình thường"]
                    ),
                    "brake_condition": random.choice(["Tốt", "Rất tốt"]),
                    "tire_condition": random.choice(["Tốt", "Còn 70%", "Còn 80%"]),
                    "electrical_condition": random.choice(["Tốt", "Bình thường"]),
                },
            )
            vehicles.append(v)
        return vehicles

    # ── MEDIA ─────────────────────────────────────────────────────

    def create_vehicle_media(self, vehicles):
        media_dir = os.path.join(settings.MEDIA_ROOT, "vehicles/media")
        all_files = []
        if os.path.exists(media_dir):
            all_files = [
                f
                for f in os.listdir(media_dir)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            ]

        for v in vehicles:
            if VehicleMedia.objects.filter(vehicle=v).exists():
                continue
            if all_files:
                selected = random.sample(
                    all_files, min(random.randint(3, 6), len(all_files))
                )
                for idx, fname in enumerate(selected):
                    VehicleMedia.objects.create(
                        vehicle=v,
                        file=f"vehicles/media/{fname}",
                        media_type="IMAGE",
                        is_primary=(idx == 0),
                        display_order=idx,
                        caption=f"Ảnh {v.brand} {v.model}",
                    )
            else:
                VehicleMedia.objects.create(
                    vehicle=v,
                    file="vehicles/media/placeholder.jpg",
                    media_type="IMAGE",
                    is_primary=True,
                    display_order=0,
                )

    # ── INSPECTIONS ───────────────────────────────────────────────

    def create_inspections(self, vehicles, users):
        inspectors = users.get("INSPECTOR", [])
        categories = list(InspectionCategory.objects.all())
        if not inspectors or not categories:
            return

        for v in vehicles:
            if Inspection.objects.filter(vehicle=v).exists():
                continue

            insp_status = random.choice(
                ["COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "IN_PROGRESS"]
            )
            score = round(random.uniform(5.5, 9.8), 1)
            grade = (
                "A"
                if score >= 8.5
                else "B" if score >= 7.0 else "C" if score >= 5.0 else "D"
            )

            insp = Inspection.objects.create(
                vehicle=v,
                inspector=random.choice(inspectors),
                status=insp_status,
                quality_grade=grade if insp_status in ["COMPLETED", "FAILED"] else None,
                overall_score=score if insp_status in ["COMPLETED", "FAILED"] else None,
                conclusion=(
                    "Xe đạt yêu cầu kiểm định, an toàn sử dụng."
                    if insp_status == "COMPLETED"
                    else "Xe có một số hạng mục cần sửa chữa."
                ),
                recommendation=(
                    "Nên thay dầu máy sau 5.000km." if random.random() > 0.5 else ""
                ),
                inspection_date=timezone.now().date()
                - timedelta(days=random.randint(1, 60)),
                is_public=(insp_status == "COMPLETED"),
            )

            for cat in categories:
                item_score = random.randint(5, 10)
                condition = (
                    "GOOD" if item_score >= 8 else "FAIR" if item_score >= 6 else "POOR"
                )
                needs = condition == "POOR" and random.random() > 0.5
                InspectionItem.objects.create(
                    inspection=insp,
                    category=cat,
                    name=f"Kiểm tra {cat.name.lower()}",
                    condition=condition,
                    score=item_score,
                    needs_repair=needs,
                    estimated_repair_cost=(
                        Decimal(random.randint(500_000, 5_000_000)) if needs else None
                    ),
                    note=fake.sentence() if random.random() > 0.6 else "",
                )

    # ── REFURBISHMENTS ────────────────────────────────────────────

    def create_refurbishments(self, vehicles, users):
        technicians = users.get("TECHNICIAN", [])
        admins = users.get("ADMIN", [])
        if not technicians:
            return

        refurb_vehicles = [
            v
            for v in vehicles
            if v.status
            in [
                "WAIT_REFURBISH",
                "REFURBISHING",
                "READY_FOR_SALE",
                "LISTED",
                "RESERVED",
                "SOLD",
                "WARRANTY",
            ]
        ][: int(len(vehicles) * 0.5)]

        ITEM_POOL = [
            ("Thay dầu máy", "LABOR", 1),
            ("Thay lọc gió", "PARTS", 1),
            ("Sơn lại vết xước", "LABOR", 1),
            ("Thay má phanh", "PARTS", 2),
            ("Vệ sinh nội thất", "LABOR", 1),
            ("Thay đèn led", "PARTS", 2),
            ("Thay lốp xe", "PARTS", 4),
            ("Kiểm tra điện", "LABOR", 1),
            ("Thay bugi", "PARTS", 4),
            ("Vệ sinh kim phun", "LABOR", 1),
        ]

        for v in refurb_vehicles:
            if RefurbishmentOrder.objects.filter(vehicle=v).exists():
                continue

            r_status = random.choice(
                [
                    RefurbishmentOrder.Status.PENDING,
                    RefurbishmentOrder.Status.IN_PROGRESS,
                    RefurbishmentOrder.Status.COMPLETED,
                    RefurbishmentOrder.Status.COMPLETED,
                ]
            )
            start_date = None
            completed_date = None
            approved_by = None

            if r_status != RefurbishmentOrder.Status.PENDING:
                start_date = timezone.now().date() - timedelta(
                    days=random.randint(5, 30)
                )
            if r_status == RefurbishmentOrder.Status.COMPLETED:
                completed_date = start_date + timedelta(days=random.randint(3, 10))
                approved_by = random.choice(admins) if admins else None

            order = RefurbishmentOrder.objects.create(
                vehicle=v,
                technician=random.choice(technicians),
                status=r_status,
                start_date=start_date,
                completed_date=completed_date,
                approved_by=approved_by,
                note=fake.sentence(),
            )

            for name, itype, qty in random.sample(ITEM_POOL, random.randint(2, 6)):
                RefurbishmentItem.objects.create(
                    order=order,
                    name=name,
                    item_type=itype,
                    quantity=qty,
                    unit_cost=Decimal(random.randint(200_000, 2_000_000)),
                    is_completed=(r_status == RefurbishmentOrder.Status.COMPLETED),
                )

    # ── PRICINGS ──────────────────────────────────────────────────

    def create_pricings(self, vehicles, users):
        pricing_users = users.get("PRICING", [])
        admin_users = users.get("ADMIN", [])
        if not pricing_users:
            return

        for v in vehicles:
            if VehiclePricing.objects.filter(vehicle=v).exists():
                continue

            purchase = v.purchase_price or Decimal(300_000_000)
            refurbish = Decimal(random.randint(5_000_000, 30_000_000))
            other = Decimal(random.randint(1_000_000, 10_000_000))
            target = (
                purchase
                + refurbish
                + other
                + Decimal(random.randint(20_000_000, 100_000_000))
            )

            p_status = random.choice(["PENDING", "APPROVED", "APPROVED", "REJECTED"])
            approved_price = None
            approved_by = None
            if p_status == "APPROVED":
                approved_price = target + Decimal(random.randint(-5_000_000, 5_000_000))
                approved_by = random.choice(admin_users) if admin_users else None

            VehiclePricing.objects.create(
                vehicle=v,
                purchase_price=purchase,
                refurbish_cost=refurbish,
                other_cost=other,
                target_price=target,
                approved_price=approved_price,
                status=p_status,
                created_by=random.choice(pricing_users),
                approved_by=approved_by,
                approved_at=(
                    timezone.now() - timedelta(days=random.randint(1, 30))
                    if p_status == "APPROVED"
                    else None
                ),
            )

    # ── LISTINGS ──────────────────────────────────────────────────

    def create_listings(self, vehicles):
        listed = [v for v in vehicles if v.status in ["LISTED", "RESERVED"]]
        for v in listed:
            if Listing.objects.filter(vehicle=v).exists():
                continue
            price = v.sale_price or (
                v.purchase_price + Decimal(50_000_000)
                if v.purchase_price
                else Decimal(500_000_000)
            )
            Listing.objects.create(
                vehicle=v,
                title=f"{v.brand} {v.model} {v.year} - {v.color}",
                slug=f"{v.brand.lower()}-{v.model.lower().replace(' ','-')}-{v.vin.lower()}",
                description=f"Xe {v.brand} {v.model} {v.year}, {v.mileage:,}km. {fake.text(100)}",
                listed_price=price,
                is_active=True,
                is_featured=random.random() > 0.7,
            )

    # ── APPOINTMENTS ──────────────────────────────────────────────

    def create_appointments(self, vehicles, users):
        """
        Tạo đầy đủ trường hợp lịch hẹn:
        - PENDING: chờ xác nhận → hiện badge "Có lịch hẹn" trên card
        - CONFIRMED: đã xác nhận → cũng hiện badge
        - COMPLETED: đã xem xe → không hiện badge
        - CANCELLED: đã hủy → không hiện badge
        - NO_SHOW: không đến → không hiện badge
        """
        customers = users.get("CUSTOMER", [])
        sales = users.get("SALES", [])
        if not customers:
            return

        # Ưu tiên xe LISTED để badge hiện rõ
        listed_vehicles = [v for v in vehicles if v.status == "LISTED"]
        reserved_vehicles = [v for v in vehicles if v.status == "RESERVED"]
        target_vehicles = listed_vehicles + reserved_vehicles
        if not target_vehicles:
            target_vehicles = vehicles[:20]

        # ── Đảm bảo mỗi xe LISTED đầu tiên đều có lịch hẹn PENDING ──
        for v in listed_vehicles[:10]:
            cust = random.choice(customers)
            Appointment.objects.get_or_create(
                vehicle=v,
                customer=cust,
                defaults={
                    "customer_name": f"{cust.first_name} {cust.last_name}".strip()
                    or fake.name(),
                    "customer_phone": cust.phone
                    or f"09{random.randint(10000000,99999999)}",
                    "customer_email": cust.email or "",
                    "scheduled_at": timezone.now()
                    + timedelta(
                        days=random.randint(1, 14), hours=random.randint(8, 17)
                    ),
                    "status": "PENDING",
                    "note": "Muốn xem xe trực tiếp",
                },
            )

        # ── Thêm các trường hợp đa dạng ──
        STATUS_POOL = (
            ["PENDING"] * 6
            + ["CONFIRMED"] * 4
            + ["COMPLETED"] * 5
            + ["CANCELLED"] * 3
            + ["NO_SHOW"] * 2
        )

        for _ in range(60):
            cust = random.choice(customers)
            vehicle = random.choice(target_vehicles)
            status = random.choice(STATUS_POOL)
            days = random.randint(-15, 30)

            Appointment.objects.create(
                vehicle=vehicle,
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                scheduled_at=timezone.now()
                + timedelta(days=days, hours=random.randint(8, 17)),
                status=status,
                note=fake.sentence() if random.random() > 0.5 else "",
                handled_by=(
                    random.choice(sales)
                    if sales and status in ["CONFIRMED", "COMPLETED", "NO_SHOW"]
                    else None
                ),
            )

    # ── DEPOSITS ──────────────────────────────────────────────────

    def create_deposits(self, vehicles, users):
        """
        Tạo đầy đủ trường hợp đặt cọc:
        - PENDING: chờ xác nhận
        - CONFIRMED: đã xác nhận → xe chuyển sang RESERVED
        - CANCELLED: đã hủy (từ PENDING hoặc CONFIRMED)
        - REFUNDED: đã hoàn tiền
        - CONVERTED: đã chuyển thành đơn bán
        Đặc biệt: xe RESERVED phải có deposit CONFIRMED
        """
        customers = users.get("CUSTOMER", [])
        sales = users.get("SALES", [])
        if not customers:
            return

        # ── Xe RESERVED bắt buộc có deposit CONFIRMED ──
        reserved_vehicles = [v for v in vehicles if v.status == "RESERVED"]
        for v in reserved_vehicles:
            if Deposit.objects.filter(vehicle=v, status="CONFIRMED").exists():
                continue
            cust = random.choice(customers)
            Deposit.objects.create(
                vehicle=v,
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                amount=Decimal(random.choice([5_000_000, 10_000_000, 15_000_000])),
                status="CONFIRMED",
                confirmed_by=random.choice(sales) if sales else None,
                note="Đặt cọc qua MoMo",
                momo_order_id=f"DEPOSIT_RESERVED_{v.id}",
            )

        # ── Các trường hợp đặt cọc khác ──
        STATUS_POOL = (
            ["PENDING"] * 8
            + ["CONFIRMED"] * 4
            + ["CANCELLED"] * 4
            + ["REFUNDED"] * 2
            + ["CONVERTED"] * 4
        )

        listed_vehicles = [v for v in vehicles if v.status in ["LISTED", "SOLD"]]
        for i in range(40):
            cust = random.choice(customers)
            status = STATUS_POOL[i % len(STATUS_POOL)]
            days = random.randint(0, 60)

            # Không tạo deposit CONFIRMED thứ 2 trên cùng 1 xe
            target_vehicle = random.choice(listed_vehicles)
            if (
                status == "CONFIRMED"
                and Deposit.objects.filter(
                    vehicle=target_vehicle, status="CONFIRMED"
                ).exists()
            ):
                status = "PENDING"

            d = Deposit.objects.create(
                vehicle=target_vehicle,
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                amount=Decimal(
                    random.choice([5_000_000, 10_000_000, 15_000_000, 20_000_000])
                ),
                status=status,
                confirmed_by=(
                    random.choice(sales) if (sales and status == "CONFIRMED") else None
                ),
                note=fake.sentence() if random.random() > 0.6 else "",
                momo_order_id=f"DEPOSIT_SEED_{i:04d}",
            )
            Deposit.objects.filter(pk=d.pk).update(
                created_at=timezone.now() - timedelta(days=days)
            )

    # ── SALES ORDERS ──────────────────────────────────────────────

    def create_sales_orders(self, vehicles, users):
        """
        Tạo SalesOrder rải đều 12 tháng.
        Xe SOLD + WARRANTY bắt buộc có SalesOrder.
        """
        sales_users = users.get("SALES", [])
        customers = users.get("CUSTOMER", [])
        if not sales_users or not customers:
            return

        sold_vehicles = [v for v in vehicles if v.status in ["SOLD", "WARRANTY"]]
        if len(sold_vehicles) < 20:
            extras = [
                v
                for v in vehicles
                if v.status not in ["SOLD", "WARRANTY"] and v.sale_price
            ]
            sold_vehicles += extras[: 20 - len(sold_vehicles)]

        now = timezone.now()
        for idx, v in enumerate(sold_vehicles[:30]):
            if SalesOrder.objects.filter(vehicle=v).exists():
                continue

            cust = random.choice(customers)
            seller = random.choice(sales_users)
            sale_price = v.sale_price or Decimal(
                random.randint(300_000_000, 800_000_000)
            )

            months_ago = idx % 12
            days_offset = random.randint(0, 27)
            sold_at = now - timedelta(days=months_ago * 30 + days_offset)

            order = SalesOrder.objects.create(
                vehicle=v,
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                sale_price=sale_price,
                contract_number=f"HD-2024-{idx+1:04d}",
                sold_by=seller,
                note=f"Hợp đồng bán xe {v.brand} {v.model}",
            )
            SalesOrder.objects.filter(pk=order.pk).update(sold_at=sold_at)
            VehicleUnit.objects.filter(pk=v.pk).update(status="SOLD")

        self.stdout.write(
            f"    → {min(len(sold_vehicles), 30)} đơn bán rải qua 12 tháng"
        )

    # ── HANDOVERS ─────────────────────────────────────────────────

    def create_handovers(self, users):
        """
        Tạo biên bản bàn giao cho các đơn bán đã có.
        """
        sales = users.get("SALES", [])
        if not sales:
            return

        orders = SalesOrder.objects.filter(handover__isnull=True).select_related(
            "vehicle"
        )[:15]
        for order in orders:
            HandoverRecord.objects.get_or_create(
                sales_order=order,
                defaults={
                    "handover_date": timezone.now()
                    - timedelta(days=random.randint(0, 30)),
                    "mileage_at_handover": random.randint(5_000, 180_000),
                    "staff": random.choice(sales),
                    "note": "Bàn giao xe đầy đủ giấy tờ và chìa khóa.",
                },
            )

    # ── WARRANTIES ────────────────────────────────────────────────

    def create_warranties(self):
        """
        Tạo đầy đủ trường hợp bảo hành:
        - ACTIVE: đang trong thời hạn bảo hành
        - ACTIVE sắp hết: còn < 30 ngày
        - EXPIRED: đã hết hạn
        - VOID: đã hủy
        """
        orders = SalesOrder.objects.filter(warranty__isnull=True).select_related(
            "vehicle"
        )

        for idx, order in enumerate(orders):
            today = timezone.now().date()

            # Phân bổ các trường hợp
            scenario = idx % 4
            if scenario == 0:
                # ACTIVE — còn nhiều tháng
                start_date = today - timedelta(days=random.randint(10, 60))
                months = random.randint(6, 24)
                end_date = today + timedelta(days=months * 30)
                w_status = "ACTIVE"
            elif scenario == 1:
                # ACTIVE — sắp hết hạn (còn 5-28 ngày)
                start_date = today - timedelta(days=random.randint(150, 350))
                end_date = today + timedelta(days=random.randint(5, 28))
                months = 6
                w_status = "ACTIVE"
            elif scenario == 2:
                # EXPIRED — đã hết hạn
                start_date = today - timedelta(days=random.randint(200, 400))
                end_date = today - timedelta(days=random.randint(5, 60))
                months = 6
                w_status = "EXPIRED"
            else:
                # VOID — đã hủy
                start_date = today - timedelta(days=random.randint(30, 120))
                end_date = today + timedelta(days=90)
                months = 3
                w_status = "VOID"

            WarrantyRecord.objects.get_or_create(
                sales_order=order,
                defaults={
                    "warranty_months": months,
                    "max_mileage": random.choice([10_000, 15_000, 20_000]),
                    "coverage_note": random.choice(
                        [
                            "Bảo hành động cơ và hộp số.",
                            "Bảo hành toàn bộ phần cơ khí.",
                            "Bảo hành động cơ, hộp số, hệ thống điện.",
                        ]
                    ),
                    "status": w_status,
                    "start_date": start_date,
                    "end_date": end_date,
                },
            )

    # ── SUMMARY ───────────────────────────────────────────────────

    def _print_summary(self):
        from sales.models import WarrantyRecord

        self.stdout.write("\n📊 Tóm tắt:")
        self.stdout.write(f"   Users:          {User.objects.count()}")
        self.stdout.write(f"   Vehicles:       {VehicleUnit.objects.count()}")
        self.stdout.write(
            f"     LISTED:       {VehicleUnit.objects.filter(status='LISTED').count()}"
        )
        self.stdout.write(
            f"     RESERVED:     {VehicleUnit.objects.filter(status='RESERVED').count()}"
        )
        self.stdout.write(
            f"     SOLD:         {VehicleUnit.objects.filter(status='SOLD').count()}"
        )
        self.stdout.write(f"   Inspections:    {Inspection.objects.count()}")
        self.stdout.write(f"   Refurbishments: {RefurbishmentOrder.objects.count()}")
        self.stdout.write(f"   Listings:       {Listing.objects.count()}")
        self.stdout.write(f"   Appointments:   {Appointment.objects.count()}")
        self.stdout.write(
            f"     PENDING:      {Appointment.objects.filter(status='PENDING').count()}"
        )
        self.stdout.write(
            f"     CONFIRMED:    {Appointment.objects.filter(status='CONFIRMED').count()}"
        )
        self.stdout.write(f"   Deposits:       {Deposit.objects.count()}")
        self.stdout.write(
            f"     CONFIRMED:    {Deposit.objects.filter(status='CONFIRMED').count()}"
        )
        self.stdout.write(f"   Sales Orders:   {SalesOrder.objects.count()}")
        self.stdout.write(f"   Handovers:      {HandoverRecord.objects.count()}")
        self.stdout.write(f"   Warranties:     {WarrantyRecord.objects.count()}")
        self.stdout.write(
            f"     ACTIVE:       {WarrantyRecord.objects.filter(status='ACTIVE').count()}"
        )
        self.stdout.write(
            f"     EXPIRED:      {WarrantyRecord.objects.filter(status='EXPIRED').count()}"
        )

    # ── CLEAR ─────────────────────────────────────────────────────

    def clear_data(self):
        from sales.models import WarrantyRecord

        WarrantyRecord.objects.all().delete()
        HandoverRecord.objects.all().delete()
        SalesOrder.objects.all().delete()
        Deposit.objects.all().delete()
        Appointment.objects.all().delete()
        Listing.objects.all().delete()
        VehiclePricing.objects.all().delete()
        RefurbishmentItem.objects.all().delete()
        RefurbishmentOrder.objects.all().delete()
        InspectionItem.objects.all().delete()
        Inspection.objects.all().delete()
        InspectionCategory.objects.all().delete()
        VehicleMedia.objects.all().delete()
        VehicleSpec.objects.all().delete()
        VehicleUnit.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write("  ✓ Đã xóa toàn bộ dữ liệu cũ")
