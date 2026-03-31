from django.core.management.base import BaseCommand
from inspections.models import Inspection, InspectionCategory, InspectionItem
from vehicles.models import VehicleUnit
from django.contrib.auth import get_user_model
import random


class Command(BaseCommand):
    help = "Seed inspection data"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        inspector = (
            User.objects.filter(role="INSPECTOR").first()
            or User.objects.filter(is_superuser=True).first()
        )

        cats_data = [
            ("Động cơ & Hộp số", 1),
            ("Hệ thống phanh", 2),
            ("Hệ thống lái", 3),
            ("Ngoại thất", 4),
            ("Nội thất", 5),
            ("Điện & Điều hòa", 6),
            ("Gầm & Khung xe", 7),
        ]

        cats = {}
        for name, order in cats_data:
            cat, _ = InspectionCategory.objects.get_or_create(
                name=name, defaults={"display_order": order}
            )
            cats[name] = cat

        ITEMS_BY_CAT = {
            "Động cơ & Hộp số": [
                "Động cơ",
                "Hộp số",
                "Hệ thống làm mát",
                "Dầu máy",
                "Dây curoa",
            ],
            "Hệ thống phanh": ["Phanh trước", "Phanh sau", "Dầu phanh", "Má phanh"],
            "Hệ thống lái": ["Vô lăng", "Trợ lực lái", "Thanh lái", "Góc chỉnh bánh"],
            "Ngoại thất": [
                "Thân xe",
                "Kính chắn gió",
                "Gương chiếu hậu",
                "Đèn pha",
                "Đèn hậu",
            ],
            "Nội thất": [
                "Ghế ngồi",
                "Bảng điều khiển",
                "Điều hòa",
                "Hệ thống âm thanh",
            ],
            "Điện & Điều hòa": ["Ắc quy", "Hệ thống điện", "Điều hòa", "Cảm biến"],
            "Gầm & Khung xe": ["Khung xe", "Hệ thống treo", "Lốp xe", "Mâm xe"],
        }

        listed_vehicles = VehicleUnit.objects.filter(status="LISTED")[:50]
        count = 0

        for vehicle in listed_vehicles:
            if Inspection.objects.filter(vehicle=vehicle, is_public=True).exists():
                continue

            grade = random.choice(["A", "A", "B", "B", "C"])
            score = {
                "A": random.uniform(8.5, 10),
                "B": random.uniform(7.0, 8.4),
                "C": random.uniform(5.0, 6.9),
            }[grade]

            inspection = Inspection.objects.create(
                vehicle=vehicle,
                inspector=inspector,
                status="COMPLETED",
                is_public=True,
                quality_grade=grade,
                overall_score=round(score, 1),
                conclusion=f"Xe đạt chất lượng loại {grade}, đủ điều kiện bán.",
                recommendation=(
                    "Có thể niêm yết và bán ngay."
                    if grade in ("A", "B")
                    else "Nên tân trang thêm trước khi bán."
                ),
            )

            for cat_name, items in ITEMS_BY_CAT.items():
                cat = cats[cat_name]
                for item_name in items:
                    cond = random.choices(
                        ["GOOD", "FAIR", "POOR"], weights=[60, 30, 10]
                    )[0]
                    needs = cond == "POOR"

                    InspectionItem.objects.create(
                        inspection=inspection,
                        category=cat,
                        name=item_name,
                        condition=cond,
                        score=round(random.uniform(5, 10), 1),
                        needs_repair=needs,
                        estimated_repair_cost=(
                            random.randint(500, 5000) * 1000 if needs else 0
                        ),
                    )

            count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Đã tạo {count} phiếu kiểm định công khai")
        )
