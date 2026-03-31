import random
from decimal import Decimal
from datetime import datetime, timedelta
from vehicles.models import VehicleMedia
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faker import Faker
from django.utils import timezone
from vehicles.models import VehicleUnit, VehicleSpec
from inspections.models import Inspection, InspectionItem, InspectionCategory
from refurbishment.models import RefurbishmentOrder, RefurbishmentItem
from sales.models import Listing, Appointment, Deposit, SalesOrder, VehiclePricing

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
    help = "Seed database with comprehensive test data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing data before seeding",
        )
        parser.add_argument(
            "--vehicles",
            type=int,
            default=80,
            help="Number of vehicles to create (default: 80)",
        )

    def handle(self, *args, **kwargs):
        clear = kwargs.get("clear")
        n_vehicles = kwargs.get("vehicles", 80)

        if clear:
            self.stdout.write(self.style.WARNING("Clearing database..."))
            self.clear_data()

        self.stdout.write("Seeding data...")

        self.create_users()
        self.stdout.write("  ✓ Users")

        self.create_categories()
        self.stdout.write("  ✓ Inspection categories")

        vehicles = self.create_vehicles(n_vehicles)
        self.stdout.write(f"  ✓ {len(vehicles)} vehicles")

        self.create_vehicle_media(vehicles)
        self.stdout.write("  ✓ Vehicle media")

        self.create_inspections(vehicles)
        self.stdout.write("  ✓ Inspections")

        self.create_refurbishments(vehicles)
        self.stdout.write("  ✓ Refurbishments")

        self.create_pricings(vehicles)
        self.stdout.write("  ✓ Pricings")

        self.create_listings(vehicles)
        self.stdout.write("  ✓ Listings")

        self.create_appointments(vehicles)
        self.stdout.write("  ✓ Appointments")

        self.create_deposits(vehicles)
        self.stdout.write("  ✓ Deposits")

        self.create_sales_orders(vehicles)
        self.stdout.write("  ✓ Sales orders (spread across 12 months)")

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding completed successfully!"))
        self._print_summary()

    # ── USERS ────────────────────────────────────────────────────

    def create_users(self):
        roles_count = {
            "ADMIN": 2,
            "PURCHASING": 3,
            "INSPECTOR": 4,
            "TECHNICIAN": 4,
            "PRICING": 3,
            "SALES": 5,  # nhiều sales để có hoa hồng đa dạng
            "CUSTOMER": 20,  # nhiều khách hàng
        }
        for role, count in roles_count.items():
            for i in range(count):
                User.objects.get_or_create(
                    username=f"{role.lower()}_{i+1}",
                    defaults={
                        "password": "pbkdf2_sha256$600000$dummy$" + "x" * 40,
                        "role": role,
                        "email": fake.email(),
                        "first_name": fake.first_name(),
                        "last_name": fake.last_name(),
                        "phone": f"09{random.randint(10000000, 99999999)}",
                        "is_active": True,
                        "is_verified": True,
                    },
                )

        # Admin đặc biệt để login
        User.objects.get_or_create(
            username="admin",
            defaults={
                "role": "ADMIN",
                "email": "admin@system.local",
                "first_name": "System",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

    # ── CATEGORIES ───────────────────────────────────────────────

    def create_categories(self):
        categories = [
            ("Động cơ", 1),
            ("Hộp số", 2),
            ("Thân vỏ", 3),
            ("Nội thất", 4),
            ("Hệ thống điện", 5),
            ("Hệ thống phanh", 6),
            ("Lốp & Bánh xe", 7),
            ("Hệ thống lái", 8),
        ]
        for name, order in categories:
            InspectionCategory.objects.get_or_create(
                name=name, defaults={"display_order": order}
            )

    # ── VEHICLES ─────────────────────────────────────────────────

    def create_vehicles(self, count=80):
        purchasing_users = list(User.objects.filter(role="PURCHASING"))
        if not purchasing_users:
            purchasing_users = list(User.objects.filter(role="ADMIN"))

        vehicles = []
        statuses_pool = (
            ["PURCHASED"] * 5
            + ["WAIT_INSPECTION"] * 5
            + ["INSPECTING"] * 3
            + ["INSPECTED"] * 5
            + ["WAIT_REFURBISH"] * 5
            + ["REFURBISHING"] * 3
            + ["READY_FOR_SALE"] * 10
            + ["LISTED"] * 20
            + ["RESERVED"] * 5
            + ["SOLD"] * 15
            + ["WARRANTY"] * 4
        )

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

            # Tạo VehicleSpec
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

    # ── VEHICLE MEDIA ────────────────────────────────────────────

    def create_vehicle_media(self, vehicles):
        media_dir = os.path.join(settings.MEDIA_ROOT, "vehicles/media")
        all_files = []
        if os.path.exists(media_dir):
            all_files = [
                f
                for f in os.listdir(media_dir)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            ]

        if not all_files:
            # Tạo placeholder nếu không có ảnh thật
            for v in vehicles:
                VehicleMedia.objects.get_or_create(
                    vehicle=v,
                    is_primary=True,
                    defaults={
                        "file": f"vehicles/media/placeholder.jpg",
                        "media_type": "IMAGE",
                        "display_order": 0,
                        "caption": f"Ảnh {v.brand} {v.model}",
                    },
                )
            return

        for v in vehicles:
            selected = random.sample(
                all_files, min(random.randint(3, 6), len(all_files))
            )
            for idx, fname in enumerate(selected):
                VehicleMedia.objects.get_or_create(
                    vehicle=v,
                    file=f"vehicles/media/{fname}",
                    defaults={
                        "media_type": "IMAGE",
                        "is_primary": (idx == 0),
                        "display_order": idx,
                        "caption": f"Ảnh {v.display_name}",
                    },
                )

    # ── INSPECTIONS ──────────────────────────────────────────────

    def create_inspections(self, vehicles):
        inspectors = list(User.objects.filter(role="INSPECTOR"))
        categories = list(InspectionCategory.objects.all())
        if not inspectors or not categories:
            return

        for v in vehicles:
            status = random.choice(
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
                status=status,
                quality_grade=grade if status in ["COMPLETED", "FAILED"] else None,
                overall_score=score if status in ["COMPLETED", "FAILED"] else None,
                conclusion=(
                    "Xe đạt yêu cầu kiểm định, an toàn sử dụng."
                    if status == "COMPLETED"
                    else "Xe có một số hạng mục cần sửa chữa."
                ),
                recommendation=(
                    "Nên thay dầu máy sau 5.000km." if random.random() > 0.5 else ""
                ),
                inspection_date=timezone.now().date()
                - timedelta(days=random.randint(1, 60)),
                is_public=(status == "COMPLETED"),
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

    # ── REFURBISHMENTS ───────────────────────────────────────────

    def create_refurbishments(self, vehicles):
        technicians = list(User.objects.filter(role="TECHNICIAN"))
        admins = list(User.objects.filter(role="ADMIN"))
        if not technicians:
            return

        refurb_vehicles = vehicles[: int(len(vehicles) * 0.4)]
        for v in refurb_vehicles:
            status = random.choice(
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

            if status != RefurbishmentOrder.Status.PENDING:
                start_date = timezone.now().date() - timedelta(
                    days=random.randint(5, 30)
                )
            if status == RefurbishmentOrder.Status.COMPLETED:
                completed_date = start_date + timedelta(days=random.randint(3, 10))
                approved_by = random.choice(admins) if admins else None

            order = RefurbishmentOrder.objects.create(
                vehicle=v,
                technician=random.choice(technicians),
                status=status,
                start_date=start_date,
                completed_date=completed_date,
                approved_by=approved_by,
                note=fake.sentence(),
            )

            items = [
                ("Thay dầu máy", "LABOR", 1, random.randint(200_000, 500_000)),
                ("Thay lọc gió", "PARTS", 1, random.randint(100_000, 300_000)),
                ("Sơn lại vết xước", "LABOR", 1, random.randint(500_000, 2_000_000)),
                ("Thay má phanh", "PARTS", 2, random.randint(300_000, 800_000)),
                ("Vệ sinh nội thất", "LABOR", 1, random.randint(200_000, 600_000)),
                ("Thay đèn led", "PARTS", 2, random.randint(500_000, 1_500_000)),
            ]
            for name, itype, qty, unit in random.sample(items, random.randint(2, 5)):
                RefurbishmentItem.objects.create(
                    order=order,
                    name=name,
                    item_type=itype,
                    quantity=qty,
                    unit_cost=Decimal(unit),
                    is_completed=(status == RefurbishmentOrder.Status.COMPLETED),
                )

    # ── PRICINGS ─────────────────────────────────────────────────

    def create_pricings(self, vehicles):
        pricing_users = list(User.objects.filter(role="PRICING"))
        admin_users = list(User.objects.filter(role="ADMIN"))
        if not pricing_users:
            return

        for v in vehicles:
            purchase = v.purchase_price or Decimal(300_000_000)
            refurbish = Decimal(random.randint(5_000_000, 30_000_000))
            other = Decimal(random.randint(1_000_000, 10_000_000))
            target = (
                purchase
                + refurbish
                + other
                + Decimal(random.randint(20_000_000, 100_000_000))
            )

            pstatus = random.choice(["PENDING", "APPROVED", "APPROVED"])
            approved_price = (
                target + Decimal(random.randint(-5_000_000, 5_000_000))
                if pstatus == "APPROVED"
                else None
            )
            approved_by = (
                random.choice(admin_users)
                if (pstatus == "APPROVED" and admin_users)
                else None
            )

            VehiclePricing.objects.get_or_create(
                vehicle=v,
                defaults={
                    "purchase_price": purchase,
                    "refurbish_cost": refurbish,
                    "other_cost": other,
                    "target_price": target,
                    "approved_price": approved_price,
                    "status": pstatus,
                    "created_by": random.choice(pricing_users),
                    "approved_by": approved_by,
                    "approved_at": (
                        timezone.now() - timedelta(days=random.randint(1, 30))
                        if pstatus == "APPROVED"
                        else None
                    ),
                },
            )

    # ── LISTINGS ─────────────────────────────────────────────────

    def create_listings(self, vehicles):
        listed_vehicles = [v for v in vehicles if v.status in ["LISTED", "RESERVED"]]
        for v in listed_vehicles:
            price = v.sale_price or (
                v.purchase_price + Decimal(50_000_000)
                if v.purchase_price
                else Decimal(500_000_000)
            )
            Listing.objects.get_or_create(
                vehicle=v,
                defaults={
                    "title": f"{v.brand} {v.model} {v.year} - {v.color}",
                    "slug": f"{v.brand.lower()}-{v.model.lower().replace(' ','-')}-{v.vin.lower()}",
                    "description": f"Xe {v.brand} {v.model} {v.year}, đã đi {v.mileage:,}km. {fake.text(100)}",
                    "listed_price": price,
                    "is_active": True,
                    "is_featured": random.random() > 0.7,
                },
            )

    # ── APPOINTMENTS ─────────────────────────────────────────────

    def create_appointments(self, vehicles):
        customers = list(User.objects.filter(role="CUSTOMER"))
        sales = list(User.objects.filter(role="SALES"))
        if not customers:
            return

        listed = [v for v in vehicles if v.status in ["LISTED", "RESERVED"]]
        if not listed:
            listed = vehicles[:20]

        statuses = (
            ["PENDING"] * 5 + ["CONFIRMED"] * 3 + ["COMPLETED"] * 4 + ["CANCELLED"] * 2
        )

        for _ in range(50):
            cust = random.choice(customers)
            status = random.choice(statuses)
            days = random.randint(-10, 30)

            Appointment.objects.create(
                vehicle=random.choice(listed),
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
                    if sales and status in ["CONFIRMED", "COMPLETED"]
                    else None
                ),
            )

    # ── DEPOSITS ─────────────────────────────────────────────────

    def create_deposits(self, vehicles):
        customers = list(User.objects.filter(role="CUSTOMER"))
        sales = list(User.objects.filter(role="SALES"))
        if not customers:
            return

        statuses = (
            ["PENDING"] * 8
            + ["CONFIRMED"] * 6
            + ["CANCELLED"] * 4
            + ["REFUNDED"] * 2
            + ["CONVERTED"] * 5
        )

        for i in range(40):
            cust = random.choice(customers)
            status = statuses[i % len(statuses)]
            days_ago = random.randint(0, 60)

            d = Deposit(
                vehicle=random.choice(vehicles),
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                amount=Decimal(
                    random.choice([5_000_000, 10_000_000, 15_000_000, 20_000_000])
                ),
                status=status,
                note=fake.sentence() if random.random() > 0.6 else "",
                confirmed_by=(
                    random.choice(sales) if (sales and status == "CONFIRMED") else None
                ),
                momo_order_id=f"DEPOSIT_{i:04d}SEED",
            )
            d.save()
            # Override created_at sau khi save
            Deposit.objects.filter(pk=d.pk).update(
                created_at=timezone.now() - timedelta(days=days_ago)
            )

    # ── SALES ORDERS ─────────────────────────────────────────────

    def create_sales_orders(self, vehicles):
        """
        Tạo SalesOrder spread đều qua 12 tháng gần nhất
        để biểu đồ doanh thu hiện đủ cột.
        """
        sales_users = list(User.objects.filter(role="SALES"))
        customers = list(User.objects.filter(role="CUSTOMER"))
        if not sales_users or not customers:
            return

        sold_vehicles = [v for v in vehicles if v.status == "SOLD"]

        # Nếu không đủ xe SOLD, lấy thêm từ pool
        if len(sold_vehicles) < 20:
            extras = [v for v in vehicles if v.status not in ["SOLD"] and v.sale_price]
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

            # ✅ Spread sold_at đều qua 12 tháng (không phải tất cả cùng ngày)
            months_ago = idx % 12  # 0..11 tháng trước
            days_offset = random.randint(0, 27)
            sold_at = now - timedelta(days=months_ago * 30 + days_offset)

            order = SalesOrder.objects.create(
                vehicle=v,
                customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip()
                or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                sale_price=sale_price,
                contract_number=f"HD-{2024}-{idx+1:04d}",
                sold_by=seller,
                note=f"Hợp đồng bán xe {v.brand} {v.model}",
            )
            order.save()
            # Override sold_at vì field dùng auto_now_add
            SalesOrder.objects.filter(pk=order.pk).update(sold_at=sold_at)

            # Update vehicle status
            VehicleUnit.objects.filter(pk=v.pk).update(status="SOLD")

        self.stdout.write(
            f"    → Created {min(len(sold_vehicles), 30)} sales orders across 12 months"
        )

    # ── SUMMARY ──────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write("\n📊 Database Summary:")
        self.stdout.write(f"   Users:         {User.objects.count()}")
        self.stdout.write(f"   Vehicles:      {VehicleUnit.objects.count()}")
        self.stdout.write(f"   Inspections:   {Inspection.objects.count()}")
        self.stdout.write(f"   Refurbishments:{RefurbishmentOrder.objects.count()}")
        self.stdout.write(f"   Pricings:      {VehiclePricing.objects.count()}")
        self.stdout.write(f"   Listings:      {Listing.objects.count()}")
        self.stdout.write(f"   Appointments:  {Appointment.objects.count()}")
        self.stdout.write(f"   Deposits:      {Deposit.objects.count()}")
        self.stdout.write(f"   Sales Orders:  {SalesOrder.objects.count()}")

    # ── CLEAR ────────────────────────────────────────────────────

    def clear_data(self):
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
        VehicleSpec.objects.filter().delete()
        VehicleUnit.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write("  ✓ All data cleared")
