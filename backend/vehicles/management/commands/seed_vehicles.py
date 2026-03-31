

import random
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files import File
from django.contrib.auth import get_user_model

from vehicles.models import VehicleUnit, VehicleSpec, VehicleStatusLog

User = get_user_model()

# ── Dữ liệu thực tế xe Việt Nam ────────────────────────────────

CARS = [
    # (brand, model, variant, fuel, transmission, body_type, seats, doors, engine_cc, hp)
    # Toyota
    ("Toyota", "Camry", "2.5Q", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.5, 203),
    ("Toyota", "Camry", "2.0G", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.0, 155),
    ("Toyota", "Corolla Cross", "1.8HV", "HYBRID", "CVT", "SUV", 5, 4, 1.8, 122),
    ("Toyota", "Corolla Cross", "1.8V", "GASOLINE", "CVT", "SUV", 5, 4, 1.8, 140),
    ("Toyota", "Fortuner", "2.7V", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 2.7, 166),
    ("Toyota", "Fortuner", "2.4G", "DIESEL", "MANUAL", "SUV", 7, 4, 2.4, 150),
    ("Toyota", "Innova", "2.0E", "GASOLINE", "MANUAL", "MPV", 7, 4, 2.0, 134),
    ("Toyota", "Innova", "2.0V", "GASOLINE", "AUTOMATIC", "MPV", 7, 4, 2.0, 134),
    ("Toyota", "Veloz Cross", "1.5AT", "GASOLINE", "CVT", "MPV", 7, 4, 1.5, 107),
    ("Toyota", "Raize", "1.0T", "GASOLINE", "CVT", "SUV", 5, 4, 1.0, 98),
    ("Toyota", "Vios", "1.5G", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.5, 107),
    ("Toyota", "Vios", "1.5E", "GASOLINE", "MANUAL", "SEDAN", 5, 4, 1.5, 107),
    ("Toyota", "Yaris", "1.5G", "GASOLINE", "CVT", "HATCHBACK", 5, 4, 1.5, 107),
    ("Toyota", "Hilux", "2.8G", "DIESEL", "AUTOMATIC", "PICKUP", 5, 4, 2.8, 204),
    # Honda
    ("Honda", "CR-V", "1.5L Turbo", "GASOLINE", "CVT", "SUV", 5, 4, 1.5, 190),
    ("Honda", "CR-V", "2.0L HEV", "HYBRID", "CVT", "SUV", 5, 4, 2.0, 145),
    ("Honda", "City", "1.5RS", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.5, 119),
    ("Honda", "City", "1.5Top", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.5, 119),
    ("Honda", "Civic", "1.5RS", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.5, 182),
    ("Honda", "HR-V", "1.8L", "GASOLINE", "CVT", "SUV", 5, 4, 1.8, 140),
    ("Honda", "Accord", "1.5L Turbo", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.5, 192),
    ("Honda", "Brio", "1.2RS", "GASOLINE", "CVT", "HATCHBACK", 5, 4, 1.2, 90),
    # Mazda
    ("Mazda", "CX-5", "2.0 Luxury", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 165),
    ("Mazda", "CX-5", "2.5 Signature", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.5, 188),
    ("Mazda", "CX-8", "2.5L", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 2.5, 188),
    ("Mazda", "Mazda3", "1.5L Sport", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 1.5, 111),
    (
        "Mazda",
        "Mazda3",
        "2.0L Sport",
        "GASOLINE",
        "AUTOMATIC",
        "HATCHBACK",
        5,
        4,
        2.0,
        158,
    ),
    ("Mazda", "CX-3", "1.5L", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 1.5, 111),
    ("Mazda", "BT-50", "3.2 AT", "DIESEL", "AUTOMATIC", "PICKUP", 5, 4, 3.2, 200),
    (
        "Mazda",
        "Mazda6",
        "2.0L Premium",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        2.0,
        165,
    ),
    ("Mazda", "CX-30", "2.0L Premium", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 158),
    # Hyundai
    ("Hyundai", "Tucson", "2.0 AT", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 156),
    (
        "Hyundai",
        "Tucson",
        "1.6T Đặc Biệt",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        5,
        4,
        1.6,
        178,
    ),
    ("Hyundai", "Santa Fe", "2.2 CRDi", "DIESEL", "AUTOMATIC", "SUV", 7, 4, 2.2, 199),
    ("Hyundai", "Accent", "1.4AT", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 1.4, 100),
    ("Hyundai", "i10", "1.2AT", "GASOLINE", "AUTOMATIC", "HATCHBACK", 5, 4, 1.2, 87),
    ("Hyundai", "Elantra", "1.6AT", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 1.6, 127),
    ("Hyundai", "Kona", "2.0AT", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 147),
    ("Hyundai", "Creta", "1.5T-GDI", "GASOLINE", "DCT", "SUV", 5, 4, 1.5, 158),
    ("Hyundai", "Stargazer", "1.5AT", "GASOLINE", "AUTOMATIC", "MPV", 7, 4, 1.5, 115),
    ("Hyundai", "Custin", "1.5T", "GASOLINE", "AUTOMATIC", "MPV", 7, 4, 1.5, 158),
    # Kia
    ("Kia", "Seltos", "1.4T Premium", "GASOLINE", "DCT", "SUV", 5, 4, 1.4, 138),
    ("Kia", "Sorento", "2.2D Luxury", "DIESEL", "AUTOMATIC", "SUV", 7, 4, 2.2, 202),
    ("Kia", "Morning", "1.25MT", "GASOLINE", "MANUAL", "HATCHBACK", 5, 4, 1.25, 87),
    ("Kia", "K3", "1.6AT", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 1.6, 123),
    ("Kia", "Carnival", "2.2D Luxury", "DIESEL", "AUTOMATIC", "MPV", 8, 4, 2.2, 202),
    ("Kia", "Sportage", "1.6T", "GASOLINE", "DCT", "SUV", 5, 4, 1.6, 178),
    ("Kia", "Sonet", "1.5AT", "GASOLINE", "CVT", "SUV", 5, 4, 1.5, 115),
    # Ford
    (
        "Ford",
        "Ranger",
        "2.0L Wildtrak",
        "DIESEL",
        "AUTOMATIC",
        "PICKUP",
        5,
        4,
        2.0,
        213,
    ),
    ("Ford", "Ranger", "2.2L XLS", "DIESEL", "MANUAL", "PICKUP", 5, 4, 2.2, 160),
    ("Ford", "Everest", "2.0L Titanium+", "DIESEL", "AUTOMATIC", "SUV", 7, 4, 2.0, 213),
    (
        "Ford",
        "Territory",
        "1.5L EcoBoost",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        5,
        4,
        1.5,
        143,
    ),
    (
        "Ford",
        "Explorer",
        "2.3L EcoBoost",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        7,
        4,
        2.3,
        300,
    ),
    ("Ford", "Transit", "2.0L", "DIESEL", "MANUAL", "MPV", 16, 4, 2.0, 130),
    # Mitsubishi
    (
        "Mitsubishi",
        "Xpander",
        "1.5AT Cross",
        "GASOLINE",
        "AUTOMATIC",
        "MPV",
        7,
        4,
        1.5,
        105,
    ),
    ("Mitsubishi", "Outlander", "2.0CVT", "GASOLINE", "CVT", "SUV", 7, 4, 2.0, 145),
    (
        "Mitsubishi",
        "Pajero Sport",
        "2.4D",
        "DIESEL",
        "AUTOMATIC",
        "SUV",
        7,
        4,
        2.4,
        181,
    ),
    ("Mitsubishi", "Attrage", "1.2CVT", "GASOLINE", "CVT", "SEDAN", 5, 4, 1.2, 78),
    ("Mitsubishi", "Eclipse Cross", "1.5T", "GASOLINE", "CVT", "SUV", 5, 4, 1.5, 150),
    (
        "Mitsubishi",
        "Triton",
        "2.4D MIVEC",
        "DIESEL",
        "AUTOMATIC",
        "PICKUP",
        5,
        4,
        2.4,
        181,
    ),
    # Nissan
    ("Nissan", "Navara", "2.5AT VL", "DIESEL", "AUTOMATIC", "PICKUP", 5, 4, 2.5, 190),
    ("Nissan", "Terra", "2.5V", "DIESEL", "AUTOMATIC", "SUV", 7, 4, 2.5, 190),
    # Suzuki
    ("Suzuki", "Ertiga", "1.5AT Sport", "GASOLINE", "AUTOMATIC", "MPV", 7, 4, 1.5, 105),
    ("Suzuki", "XL7", "1.5AT", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 1.5, 105),
    ("Suzuki", "Swift", "1.2AT GL", "GASOLINE", "CVT", "HATCHBACK", 5, 4, 1.2, 90),
    ("Suzuki", "Vitara", "1.4T", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 1.4, 138),
    # VinFast
    ("VinFast", "VF 8", "Plus", "ELECTRIC", "AUTOMATIC", "SUV", 5, 4, 0.0, 402),
    ("VinFast", "VF 9", "Plus", "ELECTRIC", "AUTOMATIC", "SUV", 7, 4, 0.0, 402),
    ("VinFast", "VF e34", "Standard", "ELECTRIC", "AUTOMATIC", "SUV", 5, 4, 0.0, 147),
    ("VinFast", "Fadil", "1.4AT", "GASOLINE", "AUTOMATIC", "HATCHBACK", 5, 4, 1.4, 98),
    (
        "VinFast",
        "Lux A2.0",
        "2.0 Turbo",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        2.0,
        228,
    ),
    (
        "VinFast",
        "Lux SA2.0",
        "2.0 Turbo",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        7,
        4,
        2.0,
        228,
    ),
    # Mercedes-Benz
    (
        "Mercedes-Benz",
        "C200",
        "Avantgarde",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        1.5,
        204,
    ),
    (
        "Mercedes-Benz",
        "E200",
        "Avantgarde",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        1.5,
        197,
    ),
    (
        "Mercedes-Benz",
        "GLC200",
        "AMG Line",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        5,
        4,
        1.5,
        204,
    ),
    (
        "Mercedes-Benz",
        "GLE450",
        "4MATIC",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        5,
        4,
        3.0,
        367,
    ),
    (
        "Mercedes-Benz",
        "A200",
        "Sedan",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        1.3,
        163,
    ),
    (
        "Mercedes-Benz",
        "CLA200",
        "AMG",
        "GASOLINE",
        "AUTOMATIC",
        "COUPE",
        5,
        4,
        1.3,
        163,
    ),
    # BMW
    ("BMW", "3 Series", "320i Sport", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.0, 184),
    (
        "BMW",
        "5 Series",
        "520i Luxury",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        2.0,
        184,
    ),
    ("BMW", "X3", "xDrive20i", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 184),
    ("BMW", "X5", "xDrive40i", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 3.0, 340),
    ("BMW", "7 Series", "730Li", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.0, 265),
    # Audi
    ("Audi", "A4", "40 TFSI", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.0, 190),
    ("Audi", "A6", "40 TFSI", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.0, 190),
    ("Audi", "Q5", "40 TFSI", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.0, 190),
    ("Audi", "Q7", "45 TFSI", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 2.0, 245),
    # Lexus
    ("Lexus", "RX350", "F-Sport", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 3.5, 278),
    ("Lexus", "NX250", "Premium", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 2.5, 203),
    ("Lexus", "ES250", "Premium", "GASOLINE", "AUTOMATIC", "SEDAN", 5, 4, 2.5, 203),
    # Volkswagen
    (
        "Volkswagen",
        "Tiguan",
        "Allspace 2.0",
        "GASOLINE",
        "AUTOMATIC",
        "SUV",
        7,
        4,
        2.0,
        220,
    ),
    (
        "Volkswagen",
        "Passat",
        "Business",
        "GASOLINE",
        "AUTOMATIC",
        "SEDAN",
        5,
        4,
        1.8,
        180,
    ),
    ("Volkswagen", "Teramont", "2.0T", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 2.0, 220),
    # Peugeot
    ("Peugeot", "3008", "1.6T Allure", "GASOLINE", "AUTOMATIC", "SUV", 5, 4, 1.6, 163),
    ("Peugeot", "5008", "1.6T", "GASOLINE", "AUTOMATIC", "SUV", 7, 4, 1.6, 163),
    # Subaru
    ("Subaru", "Forester", "2.0i-S EyeSight", "GASOLINE", "CVT", "SUV", 5, 4, 2.0, 156),
    ("Subaru", "Outback", "2.5i Premium", "GASOLINE", "CVT", "SUV", 5, 4, 2.5, 182),
]

COLORS = [
    "Trắng ngọc trai",
    "Đen huyền",
    "Bạc kim loại",
    "Xám titan",
    "Đỏ đô",
    "Xanh dương",
    "Nâu đồng",
    "Trắng tinh",
    "Xám khói",
    "Đen bóng",
    "Xanh lá",
    "Vàng cát",
]

ORIGINS = ["DOMESTIC", "IMPORTED"]

CONDITIONS = ["Tốt", "Rất tốt", "Xuất sắc", "Bình thường"]

STATUSES_POOL = [
    "PURCHASED",
    "WAIT_INSPECTION",
    "INSPECTING",
    "INSPECTED",
    "WAIT_REFURBISH",
    "REFURBISHING",
    "READY_FOR_SALE",
    "LISTED",
    "LISTED",
    "LISTED",  # tăng tỉ lệ xe đang bán
    "RESERVED",
    "SOLD",
]

PURCHASE_NOTE_TEMPLATES = [
    "Xe gia đình, ít sử dụng, nội thất còn rất tốt.",
    "Xe công ty, bảo dưỡng định kỳ đầy đủ tại đại lý.",
    "Chủ cũ bán lại do nâng cấp xe mới.",
    "Xe một chủ từ đầu, không đâm đụng, không ngập nước.",
    "Bảo dưỡng đúng hạn, có đầy đủ giấy tờ gốc.",
    "Xe nhập khẩu chính hãng, xuất xứ Nhật/Thái/Hàn.",
    "Xe lướt, đi ít km, còn bảo hành hãng.",
]


def random_vin():
    import string

    chars = string.ascii_uppercase + string.digits
    return "VIN" + "".join(random.choices(chars, k=14))


def random_price(brand: str, year: int) -> Decimal:
    """Giá thực tế theo hãng và năm."""
    base_ranges = {
        "Toyota": (450, 1400),
        "Honda": (420, 1200),
        "Mazda": (500, 1100),
        "Hyundai": (380, 1100),
        "Kia": (400, 1200),
        "Ford": (600, 1400),
        "Mitsubishi": (450, 1100),
        "Nissan": (550, 950),
        "Suzuki": (380, 700),
        "VinFast": (350, 1200),
        "Mercedes-Benz": (1400, 4500),
        "BMW": (1500, 5500),
        "Audi": (1400, 4000),
        "Lexus": (2000, 5000),
        "Volkswagen": (900, 2000),
        "Peugeot": (900, 1500),
        "Subaru": (1000, 1600),
    }
    lo, hi = base_ranges.get(brand, (400, 1200))
    # Xe cũ giảm theo năm
    age = 2024 - year
    depreciation = min(0.5, age * 0.06)  # tối đa giảm 50%
    lo_adj = int(lo * (1 - depreciation))
    hi_adj = int(hi * (1 - depreciation))
    price_m = random.randint(max(200, lo_adj), max(lo_adj + 100, hi_adj))
    return Decimal(str(price_m * 1_000_000))


def random_mileage(year: int) -> int:
    age = 2024 - year
    km_per_year = random.randint(8_000, 25_000)
    return age * km_per_year + random.randint(0, 5_000)


class Command(BaseCommand):
    help = "Seed ≥ 200 xe ô tô đã qua sử dụng vào database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", type=int, default=220, help="Số lượng xe cần tạo (mặc định: 220)"
        )
        parser.add_argument(
            "--clear", action="store_true", help="Xóa toàn bộ xe trước khi seed"
        )

    def handle(self, *args, **options):
        count = options["count"]
        do_clear = options["clear"]

        if do_clear:
            self.stdout.write("🗑  Xóa toàn bộ xe cũ...")
            VehicleUnit.objects.all().delete()
            self.stdout.write(self.style.WARNING("Đã xóa xong."))

        # Lấy admin user để gán created_by
        admin = User.objects.filter(role="ADMIN").first()
        if not admin:
            admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(
                self.style.WARNING(
                    "⚠  Không tìm thấy ADMIN user — created_by sẽ là None"
                )
            )

        # Tìm ảnh xe từ thư mục frontend/public
        # Ảnh đặt tại: frontend/public/anh_xe_1.jpg ... anh_xe_4.jpg
        # Khi seed, dùng URL tương đối — Django lưu trường file nhưng
        # không cần copy file thực (ảnh phục vụ qua frontend static)
        IMAGE_NAMES = [
            "anh_xe_1.jpg",
            "anh_xe_2.jpg",
            "anh_xe_3.jpg",
            "anh_xe_4.jpg",
            "anh_xe_5.jpg",
            "anh_xe_6.jpg",
            "anh_xe_7.jpg",
            "anh_xe_8.jpg",
            "anh_xe_9.jpg",
            "anh_xe_10.jpg",
        ]

        created = 0
        years_pool = list(range(2016, 2024))

        self.stdout.write(f"🚗  Đang tạo {count} xe...")

        # Lặp qua danh sách xe, repeat nếu cần đủ count
        car_pool = CARS * ((count // len(CARS)) + 2)
        random.shuffle(car_pool)

        for idx in range(count):
            car = car_pool[idx]
            (
                brand,
                model,
                variant,
                fuel,
                transmission,
                body_type,
                seats,
                doors,
                engine_cc,
                hp,
            ) = car

            year = random.choice(years_pool)
            mileage = random_mileage(year)
            color = random.choice(COLORS)
            status = random.choice(STATUSES_POOL)
            origin = random.choice(ORIGINS)
            purchase_price = random_price(brand, year)

            # Giá bán = giá thu mua + 10-25% lợi nhuận
            margin = Decimal(str(random.uniform(1.10, 1.25)))
            sale_price = (purchase_price * margin).quantize(Decimal("1000000"))

            # Purchase date
            days_ago = random.randint(30, 365)
            purchase_date = date.today() - timedelta(days=days_ago)

            # VIN unique
            vin = random_vin()
            while VehicleUnit.objects.filter(vin=vin).exists():
                vin = random_vin()

            # Biển số giả
            prefixes = ["30A", "51G", "43A", "29A", "36A", "92A", "61A", "74A"]
            plate = f"{random.choice(prefixes)}-{random.randint(10000, 99999)}"

            try:
                vehicle = VehicleUnit.objects.create(
                    vin=vin,
                    license_plate=plate,
                    brand=brand,
                    model=model,
                    variant=variant,
                    year=year,
                    mileage=mileage,
                    color=color,
                    transmission=transmission,
                    fuel_type=fuel,
                    sale_price=sale_price,
                    purchase_price=purchase_price,
                    purchase_date=purchase_date,
                    purchase_note=random.choice(PURCHASE_NOTE_TEMPLATES),
                    description=(
                        f"{brand} {model} {variant} năm {year}, "
                        f"đi {mileage:,} km. Màu {color.lower()}. "
                        f"Xe {origin.lower() == 'imported' and 'nhập khẩu' or 'lắp ráp trong nước'}, "
                        f"bảo dưỡng định kỳ đầy đủ. Nội thất sạch đẹp, máy móc hoạt động tốt."
                    ),
                    status=status,
                    created_by=admin,
                )

                # Tạo VehicleSpec
                VehicleSpec.objects.create(
                    vehicle=vehicle,
                    body_type=body_type,
                    engine_capacity=float(engine_cc) if engine_cc > 0 else None,
                    horsepower=hp,
                    doors=doors,
                    seats=seats,
                    origin=origin,
                    has_abs=random.choice([True, True, False]),
                    has_airbags=random.choice([True, True, False]),
                    airbag_count=random.choice([2, 4, 6, 7, 8]),
                    has_camera=random.choice([True, True, False]),
                    has_360_camera=random.choice([True, False, False]),
                    has_sunroof=random.choice([True, False, False]),
                    engine_condition=random.choice(CONDITIONS),
                    brake_condition=random.choice(CONDITIONS),
                    tire_condition=random.choice(CONDITIONS),
                    electrical_condition=random.choice(CONDITIONS),
                )

                # Tạo VehicleMedia — gán 1-2 ảnh từ public frontend
                from vehicles.models import VehicleMedia

                num_images = random.randint(1, 2)
                selected_images = random.sample(
                    IMAGE_NAMES, min(num_images, len(IMAGE_NAMES))
                )

                for img_idx, img_name in enumerate(selected_images):
                    # Lưu path tương đối — ảnh phục vụ qua frontend /public/
                    # Django lưu file path trong DB để FE biết đường dẫn
                    # Tạo VehicleMedia với file path trỏ về public frontend
                    VehicleMedia.objects.create(
                        vehicle=vehicle,
                        file=f"vehicles/media/{img_name}",  # path trong MEDIA_ROOT
                        media_type="IMAGE",
                        is_primary=(img_idx == 0),
                        caption=f"{brand} {model} {variant}",
                        display_order=img_idx,
                    )

                # Tạo status log
                VehicleStatusLog.objects.create(
                    vehicle=vehicle,
                    old_status="PURCHASED",
                    new_status=status,
                    changed_by=admin,
                    note="Seed data tự động",
                )

                created += 1
                if created % 50 == 0:
                    self.stdout.write(f"  ✓ Đã tạo {created}/{count} xe...")

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Lỗi khi tạo xe {brand} {model}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Hoàn thành! Đã tạo {created} xe.\n"
                f"   Tổng xe trong DB: {VehicleUnit.objects.count()}"
            )
        )
        self.stdout.write(
            "\n📌 Lưu ý về ảnh:\n"
            "   Copy 4 file ảnh vào thư mục MEDIA_ROOT/vehicles/media/:\n"
            "     anh_xe_1.jpg  anh_xe_2.jpg  anh_xe_3.jpg  anh_xe_4.jpg\n"
            "   Hoặc chạy lệnh copy bên dưới (điều chỉnh đường dẫn):\n"
            "     cp frontend/public/anh_xe_*.jpg backend/media/vehicles/media/\n"
        )
