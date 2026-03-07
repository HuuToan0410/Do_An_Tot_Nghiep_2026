from rest_framework import serializers
from .models import Inspection, InspectionItem, InspectionResult


class InspectionResultSerializer(serializers.ModelSerializer):

    class Meta:
        model = InspectionResult
        fields = [
            "id",
            "ket_qua",
            "diem",
            "ghi_chu",
            "hinh_anh",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InspectionItemSerializer(serializers.ModelSerializer):

    ket_qua_kiem_dinh = InspectionResultSerializer(required=False)

    class Meta:
        model = InspectionItem
        fields = [
            "id",
            "name",
            "status",
            "score",
            "note",
            "image",
            "ket_qua_kiem_dinh",
        ]
        read_only_fields = ["id"]


class InspectionSerializer(serializers.ModelSerializer):

    items = InspectionItemSerializer(many=True)

    class Meta:
        model = Inspection
        fields = [
            "id",
            "vehicle",
            "inspector",
            "status",
            "overall_score",
            "note",
            "inspection_date",
            "created_at",
            "items",
        ]

        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):

        items_data = validated_data.pop("items")

        inspection = Inspection.objects.create(**validated_data)

        for item_data in items_data:

            result_data = item_data.pop("ket_qua_kiem_dinh", None)

            item = InspectionItem.objects.create(inspection=inspection, **item_data)

            if result_data:
                InspectionResult.objects.create(item=item, **result_data)

        return inspection
