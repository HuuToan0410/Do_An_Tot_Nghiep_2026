# management/commands/seed_data.py
# python manage.py seed_data --clear --vehicles 200
#
# Tạo tối thiểu 200 xe với đầy đủ tất cả trường hợp:
# - Vehicles: tất cả 11 status
# - Inspections: COMPLETED/FAILED/IN_PROGRESS + đủ items theo category
# - Refurbishments: PENDING/IN_PROGRESS/COMPLETED/CANCELLED
# - Pricings: PENDING/APPROVED/REJECTED
# - Listings: is_active=True/False, is_featured
# - Appointments: PENDING/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW
# - Deposits: PENDING/CONFIRMED/CANCELLED/REFUNDED/CONVERTED + MoMo fields
# - SalesOrders: rải đều 24 tháng
# - HandoverRecords: đầy đủ
# - WarrantyRecords: ACTIVE/ACTIVE sắp hết/EXPIRED/VOID
# - SellInquiry + ContactInquiry

import os
import random
from decimal import Decimal
from datetime import timedelta, date

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from inspections.models import Inspection, InspectionCategory, InspectionItem
from refurbishment.models import RefurbishmentItem, RefurbishmentOrder
from sales.models import (
    Appointment, Deposit, HandoverRecord, Listing,
    SalesOrder, VehiclePricing, WarrantyRecord,
    SellInquiry, ContactInquiry,
)
from vehicles.models import VehicleMedia, VehicleSpec, VehicleStatusLog, VehicleUnit

User = get_user_model()
fake = Faker("vi_VN")
random.seed(42)  # reproducible

# ── Constants ─────────────────────────────────────────────────────────────────

BRANDS = ["Toyota", "Honda", "Ford", "BMW", "Hyundai", "Mazda", "KIA",
          "Mercedes", "Vinfast", "Nissan", "Audi", "Lexus", "Mitsubishi"]
MODELS = {
    "Toyota":     ["Camry", "Corolla", "Fortuner", "Innova", "Vios", "Hilux", "Yaris"],
    "Honda":      ["Civic", "CR-V", "HR-V", "City", "Accord", "Jazz", "BR-V"],
    "Ford":       ["Ranger", "Explorer", "EcoSport", "Everest", "Focus", "Mustang"],
    "BMW":        ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7"],
    "Hyundai":    ["Accent", "Elantra", "Tucson", "Santa Fe", "Stargazer", "Ioniq 5"],
    "Mazda":      ["Mazda3", "Mazda6", "CX-5", "CX-8", "CX-30", "CX-3"],
    "KIA":        ["Morning", "Seltos", "Sportage", "Carnival", "Sorento", "EV6"],
    "Mercedes":   ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class"],
    "Vinfast":    ["VF3", "VF5", "VF6", "VF7", "VF8", "VF9", "VF e34"],
    "Nissan":     ["Navara", "Terra", "X-Trail", "Almera", "Kicks", "Patrol"],
    "Audi":       ["A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
    "Lexus":      ["ES", "RX", "NX", "IS", "GX", "LX"],
    "Mitsubishi": ["Xpander", "Outlander", "Pajero", "Attrage", "Eclipse Cross"],
}
COLORS       = ["Trắng", "Đen", "Bạc", "Đỏ", "Xanh dương", "Xám", "Nâu", "Vàng cát",
                "Xanh lá", "Cam", "Tím", "Hồng ngọc"]
VARIANTS     = ["1.5L", "2.0L", "2.5L", "Turbo", "Premium", "Luxury", "Sport",
                "Base", "Limited", "Exclusive", ""]
FUEL_TYPES   = ["GASOLINE", "GASOLINE", "GASOLINE", "DIESEL", "HYBRID", "ELECTRIC"]
TRANSMISSIONS = ["AUTOMATIC", "AUTOMATIC", "MANUAL", "CVT"]

# Tỷ lệ phân bổ status — tổng 80 unit, scale theo count
STATUS_RATIOS = {
    "PURCHASED":       5,
    "WAIT_INSPECTION": 5,
    "INSPECTING":      4,
    "INSPECTED":       6,
    "WAIT_REFURBISH":  6,
    "REFURBISHING":    4,
    "READY_FOR_SALE":  10,
    "LISTED":          25,   # nhiều nhất — hiện trên trang chủ
    "RESERVED":        8,    # xe đã đặt cọc
    "SOLD":            20,   # xe đã bán — cần SalesOrder
    "WARRANTY":        7,    # xe đang bảo hành
}  # total = 100

REFURB_ITEMS = [
    ("Thay dầu máy",        "LABOR"),
    ("Thay lọc gió",        "PARTS"),
    ("Sơn lại vết xước",    "LABOR"),
    ("Thay má phanh",       "PARTS"),
    ("Vệ sinh nội thất",    "LABOR"),
    ("Thay đèn LED",        "PARTS"),
    ("Thay lốp xe",         "PARTS"),
    ("Kiểm tra hệ thống điện", "LABOR"),
    ("Thay bugi",           "PARTS"),
    ("Vệ sinh kim phun",    "LABOR"),
    ("Thay ắc-quy",         "PARTS"),
    ("Cân chỉnh vô-lăng",   "LABOR"),
    ("Thay bố thắng",       "PARTS"),
    ("Vệ sinh két nước",    "LABOR"),
    ("Thay dầu hộp số",     "PARTS"),
]


class Command(BaseCommand):
    help = "Seed tối thiểu 200 xe với đầy đủ tất cả trường hợp"

    def add_arguments(self, parser):
        parser.add_argument("--clear",    action="store_true", help="Xóa dữ liệu cũ")
        parser.add_argument("--vehicles", type=int, default=200, help="Số xe (default: 200)")

    def handle(self, *args, **kwargs):
        clear      = kwargs["clear"]
        n_vehicles = max(kwargs["vehicles"], 200)  # tối thiểu 200

        if clear:
            self.stdout.write(self.style.WARNING("Xóa dữ liệu cũ..."))
            self.clear_data()

        self.stdout.write(f"Seed {n_vehicles} xe + đầy đủ dữ liệu liên quan...\n")

        users    = self.create_users()
        self.stdout.write("  ✓ Users (41 người đủ vai trò)")

        self.create_categories()
        self.stdout.write("  ✓ 8 danh mục kiểm định")

        vehicles = self.create_vehicles(n_vehicles, users)
        self.stdout.write(f"  ✓ {len(vehicles)} xe — đủ 11 trạng thái")

        self.create_vehicle_media(vehicles)
        self.stdout.write("  ✓ Vehicle media")

        self.create_inspections(vehicles, users)
        self.stdout.write("  ✓ Inspections (COMPLETED/FAILED/IN_PROGRESS)")

        self.create_refurbishments(vehicles, users)
        self.stdout.write("  ✓ Refurbishments (PENDING/IN_PROGRESS/COMPLETED/CANCELLED)")

        self.create_pricings(vehicles, users)
        self.stdout.write("  ✓ Pricings (PENDING/APPROVED/REJECTED)")

        self.create_listings(vehicles)
        self.stdout.write("  ✓ Listings")

        self.create_appointments(vehicles, users)
        self.stdout.write("  ✓ Appointments (5 trạng thái, badge PENDING+CONFIRMED)")

        self.create_deposits(vehicles, users)
        self.stdout.write("  ✓ Deposits (5 trạng thái, RESERVED đảm bảo có CONFIRMED)")

        self.create_sales_orders(vehicles, users)
        self.stdout.write("  ✓ Sales Orders (rải đều 24 tháng)")

        self.create_handovers(users)
        self.stdout.write("  ✓ Handover records")

        self.create_warranties()
        self.stdout.write("  ✓ Warranties (ACTIVE / sắp hết / EXPIRED / VOID)")

        self.create_inquiries()
        self.stdout.write("  ✓ SellInquiry + ContactInquiry")

        self.stdout.write(self.style.SUCCESS("\n✅ Seed hoàn tất!"))
        self._print_summary()

    # ── USERS ─────────────────────────────────────────────────────

    def create_users(self):
        configs = {
            "ADMIN":      (3,  True,  True),
            "PURCHASING": (4,  False, False),
            "INSPECTOR":  (5,  False, False),
            "TECHNICIAN": (5,  False, False),
            "PRICING":    (4,  False, False),
            "SALES":      (6,  False, False),
            "CUSTOMER":   (30, False, False),
        }
        users = {}
        for role, (count, is_staff, is_super) in configs.items():
            users[role] = []
            for i in range(count):
                uname = f"{role.lower()}_{i+1}"
                u, created = User.objects.get_or_create(
                    username=uname,
                    defaults=dict(
                        role=role,
                        email=f"{uname}@autolengart.vn",
                        first_name=fake.first_name(),
                        last_name=fake.last_name(),
                        phone=f"09{random.randint(10000000, 99999999)}",
                        is_active=True,
                        is_verified=True,
                        is_staff=is_staff,
                        is_superuser=is_super,
                    ),
                )
                if created or not u.has_usable_password():
                    u.set_password("Test@12345")
                    u.save(update_fields=["password"])
                users[role].append(u)

        # Admin mặc định
        admin, c = User.objects.get_or_create(
            username="admin1",
            defaults=dict(
                role="ADMIN", email="admin@local.system",
                first_name="Admin", last_name="System",
                is_staff=True, is_superuser=True, is_active=True,
            ),
        )
        if c:
            admin.set_password("admin123")
            admin.save()
        users["ADMIN"].append(admin)
        return users

    # ── CATEGORIES ────────────────────────────────────────────────

    def create_categories(self):
        cats = [
            ("Động cơ", 1), ("Hộp số", 2), ("Thân vỏ", 3), ("Nội thất", 4),
            ("Hệ thống điện", 5), ("Hệ thống phanh", 6),
            ("Lốp & Bánh xe", 7), ("Hệ thống lái", 8),
        ]
        for name, order in cats:
            InspectionCategory.objects.get_or_create(name=name, defaults={"display_order": order})

    # ── VEHICLES ──────────────────────────────────────────────────

    def create_vehicles(self, count, users):
        purchasing_users = users["PURCHASING"] + users["ADMIN"]

        # Xây pool status theo tỷ lệ
        pool = []
        for st, ratio in STATUS_RATIOS.items():
            pool.extend([st] * ratio)
        # Scale pool lên count
        pool_extended = []
        while len(pool_extended) < count:
            pool_extended.extend(pool)
        random.shuffle(pool_extended)
        status_list = pool_extended[:count]

        vehicles = []
        for i, status in enumerate(status_list):
            brand = random.choice(BRANDS)
            model = random.choice(MODELS[brand])
            year  = random.randint(2012, 2023)
            purchase_price = Decimal(random.randint(100_000_000, 900_000_000))

            sale_price = None
            if status in ["LISTED", "RESERVED", "SOLD", "WARRANTY", "READY_FOR_SALE"]:
                margin     = Decimal(random.randint(15_000_000, 150_000_000))
                sale_price = purchase_price + margin

            v = VehicleUnit.objects.create(
                vin=f"VIN{i:05d}{random.randint(100, 999)}",
                license_plate=f"{random.randint(10,99)}{random.choice('ABCDEFGHKLMNPSTUVX')}-{random.randint(10000,99999)}",
                brand=brand,
                model=model,
                variant=random.choice(VARIANTS),
                year=year,
                mileage=random.randint(1_000, 250_000),
                color=random.choice(COLORS),
                transmission=random.choice(TRANSMISSIONS),
                fuel_type=random.choice(FUEL_TYPES),
                status=status,
                purchase_price=purchase_price,
                sale_price=sale_price,
                purchase_date=timezone.now().date() - timedelta(days=random.randint(30, 730)),
                purchase_note=fake.sentence() if random.random() > 0.5 else "",
                description=f"Xe {brand} {model} {year}, {random.randint(5,180):,}km. {fake.text(80)}",
                created_by=random.choice(purchasing_users),
            )

            VehicleSpec.objects.get_or_create(
                vehicle=v,
                defaults=dict(
                    body_type=random.choice(["SEDAN","SUV","HATCHBACK","MPV","PICKUP","COUPE","CROSSOVER"]),
                    engine_capacity=random.choice([1.0, 1.4, 1.5, 1.6, 2.0, 2.5, 3.0]),
                    horsepower=random.randint(80, 400),
                    doors=random.choice([2, 4, 5]),
                    seats=random.choice([2, 4, 5, 7, 8]),
                    origin=random.choice(["DOMESTIC", "IMPORTED"]),
                    has_abs=random.random() > 0.2,
                    has_airbags=random.random() > 0.25,
                    airbag_count=random.choice([2, 4, 6, 8]),
                    has_camera=random.random() > 0.35,
                    has_360_camera=random.random() > 0.6,
                    has_sunroof=random.random() > 0.55,
                    engine_condition=random.choice(["Tốt","Rất tốt","Bình thường","Cần kiểm tra"]),
                    brake_condition=random.choice(["Tốt","Rất tốt","Cần thay má"]),
                    tire_condition=random.choice(["Tốt","Còn 60%","Còn 70%","Còn 80%","Mới thay"]),
                    electrical_condition=random.choice(["Tốt","Bình thường","Cần sửa nhỏ"]),
                ),
            )

            # VehicleStatusLog — 1-3 entries cho lịch sử
            self._create_status_logs(v, status, purchasing_users)

            vehicles.append(v)
        return vehicles

    def _create_status_logs(self, vehicle, final_status, users):
        """Tạo lịch sử trạng thái từ PURCHASED đến trạng thái hiện tại"""
        path = {
            "PURCHASED":       ["PURCHASED"],
            "WAIT_INSPECTION": ["PURCHASED", "WAIT_INSPECTION"],
            "INSPECTING":      ["PURCHASED", "WAIT_INSPECTION", "INSPECTING"],
            "INSPECTED":       ["PURCHASED", "WAIT_INSPECTION", "INSPECTING", "INSPECTED"],
            "WAIT_REFURBISH":  ["PURCHASED", "WAIT_INSPECTION", "INSPECTING", "INSPECTED", "WAIT_REFURBISH"],
            "REFURBISHING":    ["PURCHASED", "WAIT_INSPECTION", "INSPECTED", "WAIT_REFURBISH", "REFURBISHING"],
            "READY_FOR_SALE":  ["PURCHASED", "WAIT_INSPECTION", "INSPECTED", "WAIT_REFURBISH", "REFURBISHING", "READY_FOR_SALE"],
            "LISTED":          ["PURCHASED", "INSPECTED", "READY_FOR_SALE", "LISTED"],
            "RESERVED":        ["PURCHASED", "INSPECTED", "READY_FOR_SALE", "LISTED", "RESERVED"],
            "SOLD":            ["PURCHASED", "INSPECTED", "READY_FOR_SALE", "LISTED", "RESERVED", "SOLD"],
            "WARRANTY":        ["PURCHASED", "INSPECTED", "READY_FOR_SALE", "LISTED", "SOLD", "WARRANTY"],
        }
        statuses = path.get(final_status, [final_status])
        days_back = len(statuses) * 20

        for i, st in enumerate(statuses):
            if i == 0:
                continue
            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=statuses[i-1],
                new_status=st,
                changed_by=random.choice(users),
                changed_at=timezone.now() - timedelta(days=days_back - i * 15),
                note=f"Chuyển sang {st}",
            )

    # ── VEHICLE MEDIA ─────────────────────────────────────────────

    def create_vehicle_media(self, vehicles):
        media_dir = os.path.join(settings.MEDIA_ROOT, "vehicles/media")
        all_files = []
        if os.path.exists(media_dir):
            all_files = [
                f for f in os.listdir(media_dir)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            ]

        for v in vehicles:
            if VehicleMedia.objects.filter(vehicle=v).exists():
                continue
            if all_files:
                selected = random.sample(all_files, min(random.randint(3, 8), len(all_files)))
                for idx, fname in enumerate(selected):
                    VehicleMedia.objects.create(
                        vehicle=v, file=f"vehicles/media/{fname}",
                        media_type="IMAGE", is_primary=(idx == 0),
                        display_order=idx, caption=f"Ảnh {v.brand} {v.model} #{idx+1}",
                    )
            else:
                VehicleMedia.objects.create(
                    vehicle=v, file="vehicles/media/placeholder.jpg",
                    media_type="IMAGE", is_primary=True, display_order=0,
                    caption=f"{v.brand} {v.model}",
                )

    # ── INSPECTIONS ───────────────────────────────────────────────

    def create_inspections(self, vehicles, users):
        """
        Mỗi xe có 1 phiếu kiểm định. Các xe đang kiểm định có 2 phiếu.
        Đủ tất cả status: COMPLETED / FAILED / IN_PROGRESS
        """
        inspectors = users["INSPECTOR"]
        categories = list(InspectionCategory.objects.all())

        for v in vehicles:
            if Inspection.objects.filter(vehicle=v).exists():
                continue

            # Xe INSPECTING có 1 phiếu IN_PROGRESS
            if v.status == "INSPECTING":
                Inspection.objects.create(
                    vehicle=v, inspector=random.choice(inspectors),
                    status="IN_PROGRESS",
                    inspection_date=timezone.now().date() - timedelta(days=random.randint(1, 5)),
                    is_public=False,
                )
                continue

            # Xe chưa qua kiểm định → skip
            if v.status in ["PURCHASED", "WAIT_INSPECTION"]:
                continue

            # Tất cả xe còn lại có phiếu hoàn chỉnh
            score = round(random.uniform(4.5, 9.9), 1)
            grade = "A" if score >= 8.5 else "B" if score >= 7.0 else "C" if score >= 5.0 else "D"
            has_failed_item = random.random() < 0.15
            insp_status = "FAILED" if has_failed_item else "COMPLETED"

            insp = Inspection.objects.create(
                vehicle=v,
                inspector=random.choice(inspectors),
                status=insp_status,
                quality_grade=grade,
                overall_score=score,
                conclusion=(
                    f"Xe đạt yêu cầu kiểm định. Điểm tổng: {score}/10."
                    if insp_status == "COMPLETED"
                    else "Xe có hạng mục không đạt, cần sửa chữa trước khi bán."
                ),
                recommendation=random.choice([
                    "Nên thay dầu máy sau 5.000km.",
                    "Kiểm tra lại hệ thống phanh sau 10.000km.",
                    "Lốp xe cần thay trong 6 tháng tới.",
                    "Xe ở tình trạng tốt, không cần lưu ý đặc biệt.",
                    "",
                ]),
                inspection_date=timezone.now().date() - timedelta(days=random.randint(5, 180)),
                is_public=(insp_status == "COMPLETED" and random.random() > 0.1),
            )

            # Tạo items theo từng category
            for cat in categories:
                item_score = random.randint(4, 10)
                if has_failed_item and cat.name in ("Động cơ", "Hệ thống phanh") and random.random() > 0.5:
                    condition = "FAILED"
                    item_score = random.randint(1, 4)
                else:
                    condition = "GOOD" if item_score >= 8 else "FAIR" if item_score >= 6 else "POOR"

                needs = condition in ("POOR", "FAILED") and random.random() > 0.4
                InspectionItem.objects.create(
                    inspection=insp,
                    category=cat,
                    name=f"Kiểm tra {cat.name.lower()}",
                    condition=condition,
                    score=item_score,
                    needs_repair=needs,
                    estimated_repair_cost=Decimal(random.randint(300_000, 8_000_000)) if needs else None,
                    note=fake.sentence() if random.random() > 0.5 else "",
                )

    # ── REFURBISHMENTS ────────────────────────────────────────────

    def create_refurbishments(self, vehicles, users):
        """
        Xe từ WAIT_REFURBISH trở đi đều có lệnh tân trang.
        Đủ 4 status: PENDING / IN_PROGRESS / COMPLETED / CANCELLED
        """
        technicians = users["TECHNICIAN"]
        admins      = users["ADMIN"]

        eligible = [v for v in vehicles if v.status in [
            "WAIT_REFURBISH", "REFURBISHING", "READY_FOR_SALE",
            "LISTED", "RESERVED", "SOLD", "WARRANTY",
        ]]

        for i, v in enumerate(eligible):
            if RefurbishmentOrder.objects.filter(vehicle=v).exists():
                continue

            scenario = i % 10
            if scenario < 2:
                r_status = "PENDING"
                start_date = completed_date = approved_by = None
            elif scenario < 4:
                r_status   = "IN_PROGRESS"
                start_date = timezone.now().date() - timedelta(days=random.randint(3, 15))
                completed_date = approved_by = None
            elif scenario == 4:
                r_status   = "CANCELLED"
                start_date = timezone.now().date() - timedelta(days=random.randint(5, 20))
                completed_date = approved_by = None
            else:
                r_status       = "COMPLETED"
                start_date     = timezone.now().date() - timedelta(days=random.randint(15, 90))
                completed_date = start_date + timedelta(days=random.randint(3, 14))
                approved_by    = random.choice(admins)

            order = RefurbishmentOrder.objects.create(
                vehicle=v,
                technician=random.choice(technicians),
                status=r_status,
                start_date=start_date,
                completed_date=completed_date,
                approved_by=approved_by,
                note=fake.sentence(),
            )

            # 3-8 hạng mục ngẫu nhiên
            chosen = random.sample(REFURB_ITEMS, random.randint(3, 8))
            for name, itype in chosen:
                qty = random.choice([1, 1, 2, 4])
                RefurbishmentItem.objects.create(
                    order=order, name=name, item_type=itype, quantity=qty,
                    unit_cost=Decimal(random.randint(150_000, 3_000_000)),
                    description=fake.sentence() if random.random() > 0.6 else "",
                    is_completed=(r_status == "COMPLETED"),
                )

    # ── PRICINGS ──────────────────────────────────────────────────

    def create_pricings(self, vehicles, users):
        """Phiếu định giá cho tất cả xe từ READY_FOR_SALE trở đi."""
        pricing_users = users["PRICING"]
        admin_users   = users["ADMIN"]

        eligible = [v for v in vehicles if v.status in [
            "READY_FOR_SALE", "LISTED", "RESERVED", "SOLD", "WARRANTY",
        ]]

        for i, v in enumerate(eligible):
            if VehiclePricing.objects.filter(vehicle=v).exists():
                continue

            purchase  = v.purchase_price or Decimal(300_000_000)
            refurbish = Decimal(random.randint(3_000_000, 50_000_000))
            other     = Decimal(random.randint(500_000, 15_000_000))
            target    = purchase + refurbish + other + Decimal(random.randint(15_000_000, 120_000_000))

            scenario = i % 5
            if scenario < 2:
                p_status = "APPROVED"
            elif scenario == 2:
                p_status = "PENDING"
            else:
                p_status = "REJECTED" if scenario == 3 else "APPROVED"

            approved_price = approved_by = approved_at = None
            if p_status == "APPROVED":
                approved_price = target + Decimal(random.randint(-10_000_000, 10_000_000))
                approved_by    = random.choice(admin_users)
                approved_at    = timezone.now() - timedelta(days=random.randint(1, 60))

            VehiclePricing.objects.create(
                vehicle=v,
                purchase_price=purchase,
                refurbish_cost=refurbish,
                other_cost=other,
                target_price=target,
                approved_price=approved_price,
                note=fake.sentence() if random.random() > 0.5 else "",
                status=p_status,
                created_by=random.choice(pricing_users),
                approved_by=approved_by,
                approved_at=approved_at,
            )

    # ── LISTINGS ──────────────────────────────────────────────────

    def create_listings(self, vehicles):
        """Listing cho xe LISTED + RESERVED. Một số is_active=False."""
        for v in vehicles:
            if v.status not in ["LISTED", "RESERVED"]:
                continue
            if Listing.objects.filter(vehicle=v).exists():
                continue

            price    = v.sale_price or (v.purchase_price + Decimal(50_000_000))
            scenario = hash(v.vin) % 10
            is_active   = scenario != 0   # 10% inactive
            is_featured = scenario in (1, 2, 3)  # 30% featured

            Listing.objects.create(
                vehicle=v,
                title=f"{v.brand} {v.model} {v.year} — {v.color} — {v.variant or 'Tiêu chuẩn'}",
                slug=f"{v.brand.lower().replace(' ','-')}-{v.model.lower().replace(' ','-')}-{v.vin.lower()}",
                description=(
                    f"Xe {v.brand} {v.model} {v.year}, đã đi {v.mileage:,}km. "
                    f"Màu {v.color}, {v.fuel_type_display if hasattr(v,'fuel_type_display') else v.fuel_type}. "
                    f"{fake.text(120)}"
                ),
                listed_price=price,
                is_active=is_active,
                is_featured=is_featured,
            )

    # ── APPOINTMENTS ──────────────────────────────────────────────

    def create_appointments(self, vehicles, users):
        """
        Đầy đủ 5 trạng thái: PENDING / CONFIRMED / COMPLETED / CANCELLED / NO_SHOW
        Đảm bảo xe LISTED có ít nhất 1 lịch hẹn PENDING hoặc CONFIRMED
        để badge hiển thị trên card.
        """
        customers = users["CUSTOMER"]
        sales     = users["SALES"]

        listed   = [v for v in vehicles if v.status == "LISTED"]
        reserved = [v for v in vehicles if v.status == "RESERVED"]
        all_bookable = listed + reserved

        # ── Mỗi xe LISTED: 40% có PENDING, 30% có CONFIRMED ───────
        for v in listed:
            r = hash(v.vin) % 10
            if r < 4:
                status_appt = "PENDING"
            elif r < 7:
                status_appt = "CONFIRMED"
            else:
                continue  # 30% không có lịch hẹn hiện tại

            cust = random.choice(customers)
            Appointment.objects.get_or_create(
                vehicle=v,
                customer=cust,
                defaults=dict(
                    customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                    customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                    customer_email=cust.email or "",
                    scheduled_at=timezone.now() + timedelta(days=random.randint(1, 21), hours=random.randint(8, 17)),
                    status=status_appt,
                    note="Muốn xem xe trực tiếp tại showroom.",
                    handled_by=(random.choice(sales) if status_appt == "CONFIRMED" else None),
                ),
            )

        # ── Lịch hẹn cũ (COMPLETED / CANCELLED / NO_SHOW) ─────────
        STATUS_POOL = (
            ["COMPLETED"] * 5 + ["CANCELLED"] * 3 + ["NO_SHOW"] * 2
        )
        for _ in range(100):
            v    = random.choice(all_bookable)
            cust = random.choice(customers)
            st   = random.choice(STATUS_POOL)
            days_ago = random.randint(1, 90)

            Appointment.objects.create(
                vehicle=v, customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                scheduled_at=timezone.now() - timedelta(days=days_ago, hours=random.randint(8, 17)),
                status=st,
                note=fake.sentence() if random.random() > 0.5 else "",
                handled_by=(random.choice(sales) if st in ("COMPLETED","NO_SHOW") else None),
            )

        # ── Thêm lịch hẹn tương lai đa dạng ──────────────────────
        for _ in range(60):
            v    = random.choice(all_bookable)
            cust = random.choice(customers)
            st   = random.choice(["PENDING", "CONFIRMED", "CANCELLED"])
            Appointment.objects.create(
                vehicle=v, customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                scheduled_at=timezone.now() + timedelta(days=random.randint(0, 30), hours=random.randint(8, 17)),
                status=st,
                note=fake.sentence() if random.random() > 0.4 else "",
                handled_by=(random.choice(sales) if st == "CONFIRMED" else None),
            )

    # ── DEPOSITS ──────────────────────────────────────────────────

    def create_deposits(self, vehicles, users):
        """
        5 trạng thái: PENDING / CONFIRMED / CANCELLED / REFUNDED / CONVERTED
        Xe RESERVED bắt buộc có deposit CONFIRMED.
        """
        customers = users["CUSTOMER"]
        sales     = users["SALES"]

        # ── Xe RESERVED bắt buộc có CONFIRMED ────────────────────
        for v in [x for x in vehicles if x.status == "RESERVED"]:
            if Deposit.objects.filter(vehicle=v, status="CONFIRMED").exists():
                continue
            cust = random.choice(customers)
            Deposit.objects.create(
                vehicle=v, customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                amount=Decimal(random.choice([5_000_000, 10_000_000, 15_000_000, 20_000_000])),
                status="CONFIRMED",
                confirmed_by=random.choice(sales),
                note="Đặt cọc qua cổng MoMo.",
                momo_order_id=f"DEPOSIT_R_{v.id:05d}",
                momo_trans_id=f"TRANS_{random.randint(100000000, 999999999)}",
            )

        # ── Pool 5 status ─────────────────────────────────────────
        STATUS_POOL = (
            ["PENDING"]   * 10 +
            ["CONFIRMED"] * 5  +
            ["CANCELLED"] * 6  +
            ["REFUNDED"]  * 3  +
            ["CONVERTED"] * 6
        )
        listed_sold = [v for v in vehicles if v.status in ["LISTED", "SOLD", "RESERVED"]]

        for i in range(120):
            cust   = random.choice(customers)
            status = STATUS_POOL[i % len(STATUS_POOL)]
            target = random.choice(listed_sold)
            days   = random.randint(0, 180)

            # Không CONFIRMED thứ 2 trên cùng 1 xe
            if status == "CONFIRMED" and Deposit.objects.filter(vehicle=target, status="CONFIRMED").exists():
                status = "PENDING"

            d = Deposit.objects.create(
                vehicle=target, customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                customer_email=cust.email or "",
                amount=Decimal(random.choice([5_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000])),
                status=status,
                confirmed_by=(random.choice(sales) if status == "CONFIRMED" else None),
                note=fake.sentence() if random.random() > 0.5 else "",
                momo_order_id=f"DEPOSIT_S_{i:05d}",
                momo_trans_id=(f"TRANS_{random.randint(100000000,999999999)}" if status == "CONFIRMED" else ""),
            )
            Deposit.objects.filter(pk=d.pk).update(
                created_at=timezone.now() - timedelta(days=days)
            )

    # ── SALES ORDERS ──────────────────────────────────────────────

    def create_sales_orders(self, vehicles, users):
        """
        SalesOrder cho tất cả xe SOLD + WARRANTY.
        Rải đều 24 tháng để biểu đồ doanh thu có đủ dữ liệu.
        """
        sales_users = users["SALES"]
        customers   = users["CUSTOMER"]
        now         = timezone.now()

        sold_vehicles = [v for v in vehicles if v.status in ["SOLD", "WARRANTY"]]
        # Bổ sung thêm xe LISTED/RESERVED để đủ đơn nếu cần
        if len(sold_vehicles) < 60:
            extras = [v for v in vehicles if v.status not in ["SOLD","WARRANTY"] and v.sale_price]
            random.shuffle(extras)
            sold_vehicles += extras[:60 - len(sold_vehicles)]

        for idx, v in enumerate(sold_vehicles[:80]):
            if SalesOrder.objects.filter(vehicle=v).exists():
                continue

            cust       = random.choice(customers)
            seller     = random.choice(sales_users)
            price      = v.sale_price or Decimal(random.randint(200_000_000, 900_000_000))

            # Rải sold_at đều qua 24 tháng
            months_ago  = idx % 24
            days_offset = random.randint(0, 27)
            sold_at     = now - timedelta(days=months_ago * 30 + days_offset)

            # Tạo deposit CONVERTED nếu xe có deposit cũ
            dep = Deposit.objects.filter(vehicle=v, status="CONFIRMED").first()
            if dep:
                dep.status = "CONVERTED"
                dep.save(update_fields=["status"])

            order = SalesOrder.objects.create(
                vehicle=v, customer=cust,
                customer_name=f"{cust.first_name} {cust.last_name}".strip() or fake.name(),
                customer_phone=cust.phone or f"09{random.randint(10000000,99999999)}",
                deposit=dep,
                sale_price=price,
                contract_number=f"HD-{2024 - months_ago // 12}-{idx+1:04d}",
                sold_by=seller,
                note=f"Hợp đồng bán xe {v.brand} {v.model} {v.year}.",
            )
            SalesOrder.objects.filter(pk=order.pk).update(sold_at=sold_at)
            VehicleUnit.objects.filter(pk=v.pk).update(status="SOLD")

        self.stdout.write(f"    → {min(len(sold_vehicles), 80)} đơn rải qua 24 tháng")

    # ── HANDOVERS ─────────────────────────────────────────────────

    def create_handovers(self, users):
        """
        Biên bản bàn giao cho 60-70% đơn bán.
        Một số đơn mới chưa có biên bản (thực tế).
        """
        sales = users["SALES"]
        orders = list(SalesOrder.objects.filter(handover__isnull=True).select_related("vehicle"))
        # Chỉ tạo cho 70%
        for order in orders[:int(len(orders) * 0.7)]:
            HandoverRecord.objects.get_or_create(
                sales_order=order,
                defaults=dict(
                    handover_date=timezone.now() - timedelta(days=random.randint(0, 60)),
                    mileage_at_handover=int(order.vehicle.mileage) + random.randint(0, 500)
                    if order.vehicle.mileage else random.randint(5_000, 200_000),
                    staff=random.choice(sales),
                    note=random.choice([
                        "Bàn giao đầy đủ giấy tờ, chìa khóa, sách hướng dẫn.",
                        "Xe sạch, đã vệ sinh trước bàn giao.",
                        "Khách hàng nhận xe và ký biên bản.",
                        "Bàn giao kèm phụ kiện theo hợp đồng.",
                        "",
                    ]),
                ),
            )

    # ── WARRANTIES ────────────────────────────────────────────────

    def create_warranties(self):
        """
        4 scenario bảo hành:
        0 → ACTIVE còn nhiều tháng
        1 → ACTIVE sắp hết (≤30 ngày)
        2 → EXPIRED đã hết hạn
        3 → VOID đã hủy
        """
        orders = SalesOrder.objects.filter(warranty__isnull=True)
        today  = timezone.now().date()

        for idx, order in enumerate(orders):
            sc = idx % 4

            if sc == 0:
                months     = random.randint(6, 36)
                start_date = today - timedelta(days=random.randint(10, 90))
                end_date   = today + timedelta(days=months * 30)
                w_status   = "ACTIVE"

            elif sc == 1:
                months     = 6
                start_date = today - timedelta(days=random.randint(150, 360))
                end_date   = today + timedelta(days=random.randint(3, 29))
                w_status   = "ACTIVE"

            elif sc == 2:
                months     = random.randint(3, 12)
                start_date = today - timedelta(days=random.randint(200, 500))
                end_date   = today - timedelta(days=random.randint(1, 90))
                w_status   = "EXPIRED"

            else:
                months     = 3
                start_date = today - timedelta(days=random.randint(30, 150))
                end_date   = today + timedelta(days=random.randint(30, 180))
                w_status   = "VOID"

            WarrantyRecord.objects.get_or_create(
                sales_order=order,
                defaults=dict(
                    warranty_months=months,
                    max_mileage=random.choice([10_000, 15_000, 20_000, 30_000]),
                    coverage_note=random.choice([
                        "Bảo hành động cơ và hộp số.",
                        "Bảo hành toàn bộ phần cơ khí.",
                        "Bảo hành động cơ, hộp số, hệ thống điện.",
                        "Bảo hành toàn diện theo tiêu chuẩn AUTO Leng Art.",
                        "Không bảo hành hao mòn tự nhiên.",
                    ]),
                    status=w_status,
                    start_date=start_date,
                    end_date=end_date,
                ),
            )

    # ── SELL & CONTACT INQUIRIES ──────────────────────────────────

    def create_inquiries(self):
        """SellInquiry + ContactInquiry đủ cả is_contacted=True/False"""
        for i in range(30):
            SellInquiry.objects.create(
                name=fake.name(),
                phone=f"09{random.randint(10000000,99999999)}",
                email=fake.email() if random.random() > 0.4 else "",
                brand=random.choice(BRANDS),
                model=random.choice(["Camry","CR-V","Ranger","X5","Tucson","CX-5"]),
                year=str(random.randint(2015, 2022)),
                mileage=f"{random.randint(10,200):,}000 km",
                expected_price=f"{random.randint(200,700)} triệu",
                note=fake.sentence() if random.random() > 0.5 else "",
                is_contacted=(i % 3 != 0),  # 2/3 đã liên hệ
            )

        for i in range(20):
            ContactInquiry.objects.create(
                name=fake.name(),
                phone=f"09{random.randint(10000000,99999999)}" if random.random() > 0.2 else "",
                email=fake.email() if random.random() > 0.3 else "",
                message=fake.text(200),
                is_contacted=(i % 4 != 0),  # 75% đã liên hệ
            )

    # ── SUMMARY ───────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write("\n" + "─"*55)
        self.stdout.write("📊 TÓM TẮT DATABASE")
        self.stdout.write("─"*55)

        # Vehicles
        total = VehicleUnit.objects.count()
        self.stdout.write(f"\n🚗 Vehicles: {total}")
        for st in ["PURCHASED","WAIT_INSPECTION","INSPECTING","INSPECTED",
                   "WAIT_REFURBISH","REFURBISHING","READY_FOR_SALE",
                   "LISTED","RESERVED","SOLD","WARRANTY"]:
            cnt = VehicleUnit.objects.filter(status=st).count()
            bar = "█" * (cnt // 2)
            self.stdout.write(f"   {st:<20} {cnt:>4}  {bar}")

        # Others
        self.stdout.write(f"\n👤 Users:          {User.objects.count()}")
        self.stdout.write(f"🔍 Inspections:    {Inspection.objects.count()}")
        self.stdout.write(f"   COMPLETED:      {Inspection.objects.filter(status='COMPLETED').count()}")
        self.stdout.write(f"   FAILED:         {Inspection.objects.filter(status='FAILED').count()}")
        self.stdout.write(f"   IN_PROGRESS:    {Inspection.objects.filter(status='IN_PROGRESS').count()}")
        self.stdout.write(f"🔧 Refurbishments: {RefurbishmentOrder.objects.count()}")
        self.stdout.write(f"   COMPLETED:      {RefurbishmentOrder.objects.filter(status='COMPLETED').count()}")
        self.stdout.write(f"   IN_PROGRESS:    {RefurbishmentOrder.objects.filter(status='IN_PROGRESS').count()}")
        self.stdout.write(f"   CANCELLED:      {RefurbishmentOrder.objects.filter(status='CANCELLED').count()}")
        self.stdout.write(f"💰 Pricings:       {VehiclePricing.objects.count()}")
        self.stdout.write(f"   APPROVED:       {VehiclePricing.objects.filter(status='APPROVED').count()}")
        self.stdout.write(f"   PENDING:        {VehiclePricing.objects.filter(status='PENDING').count()}")
        self.stdout.write(f"   REJECTED:       {VehiclePricing.objects.filter(status='REJECTED').count()}")
        self.stdout.write(f"📋 Appointments:   {Appointment.objects.count()}")
        self.stdout.write(f"   PENDING:        {Appointment.objects.filter(status='PENDING').count()}")
        self.stdout.write(f"   CONFIRMED:      {Appointment.objects.filter(status='CONFIRMED').count()}")
        self.stdout.write(f"   COMPLETED:      {Appointment.objects.filter(status='COMPLETED').count()}")
        self.stdout.write(f"   CANCELLED:      {Appointment.objects.filter(status='CANCELLED').count()}")
        self.stdout.write(f"   NO_SHOW:        {Appointment.objects.filter(status='NO_SHOW').count()}")
        self.stdout.write(f"💵 Deposits:       {Deposit.objects.count()}")
        self.stdout.write(f"   PENDING:        {Deposit.objects.filter(status='PENDING').count()}")
        self.stdout.write(f"   CONFIRMED:      {Deposit.objects.filter(status='CONFIRMED').count()}")
        self.stdout.write(f"   CANCELLED:      {Deposit.objects.filter(status='CANCELLED').count()}")
        self.stdout.write(f"   REFUNDED:       {Deposit.objects.filter(status='REFUNDED').count()}")
        self.stdout.write(f"   CONVERTED:      {Deposit.objects.filter(status='CONVERTED').count()}")
        self.stdout.write(f"📄 Sales Orders:   {SalesOrder.objects.count()}")
        self.stdout.write(f"🤝 Handovers:      {HandoverRecord.objects.count()}")
        self.stdout.write(f"🛡  Warranties:     {WarrantyRecord.objects.count()}")
        self.stdout.write(f"   ACTIVE:         {WarrantyRecord.objects.filter(status='ACTIVE').count()}")
        self.stdout.write(f"   EXPIRED:        {WarrantyRecord.objects.filter(status='EXPIRED').count()}")
        self.stdout.write(f"   VOID:           {WarrantyRecord.objects.filter(status='VOID').count()}")
        self.stdout.write(f"📨 Sell Inquiries: {SellInquiry.objects.count()}")
        self.stdout.write(f"📩 Contact Req:    {ContactInquiry.objects.count()}")
        self.stdout.write("─"*55)
        self.stdout.write("\n✅ Tài khoản test: admin1 / admin123")
        self.stdout.write("✅ Nhân viên:      admin_1..admin_3 / Test@12345")
        self.stdout.write("✅ Khách hàng:     customer_1..customer_30 / Test@12345")

    # ── CLEAR ─────────────────────────────────────────────────────

    def clear_data(self):
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
        VehicleStatusLog.objects.all().delete()
        VehicleUnit.objects.all().delete()
        try:
            SellInquiry.objects.all().delete()
            ContactInquiry.objects.all().delete()
        except Exception:
            pass
        User.objects.all().delete()
        self.stdout.write("  ✓ Đã xóa toàn bộ dữ liệu cũ")