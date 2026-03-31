"""
sales/views_momo.py

MOCK MODE (MOMO_MOCK = True):
- Tạo deposit với status=PENDING
- Trả về mock pay_url để test UI flow
- Xe KHÔNG bị đổi trạng thái ngay
- Dùng DepositMoMoStatusView để simulate confirm sau

Khi MOMO_MOCK = False: dùng MoMo API thật.
"""

import uuid
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from sales.models import Deposit
from sales.momo import create_momo_payment, verify_ipn


class OptionalJWTAuthentication(JWTAuthentication):
    """Token hợp lệ → authenticate, token lỗi/không có → anonymous user."""

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None
        except Exception:
            return None


class DepositCreateWithMoMoView(APIView):
    """
    GET  /api/deposits/ — danh sách deposits của user hiện tại
    POST /api/deposits/ — tạo deposit mới + MoMo payment link
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]

    def get(self, request):
        """Trả về danh sách deposits của user hiện tại."""
        if not request.user or not request.user.is_authenticated:
            return Response([], status=200)

        deposits = (
            Deposit.objects.filter(customer=request.user)
            .select_related("vehicle")
            .order_by("-created_at")
        )

        from sales.serializers import DepositSerializer

        serializer = DepositSerializer(deposits, many=True)
        return Response(serializer.data)

    def post(self, request):
        vehicle_id = request.data.get("vehicle")
        amount = request.data.get("amount")
        customer_name = request.data.get("customer_name", "").strip()
        customer_phone = request.data.get("customer_phone", "").strip()
        customer_email = request.data.get("customer_email", "").strip()
        note = request.data.get("note", "")

        # ── Validate ──────────────────────────────────────────
        if not vehicle_id or not amount:
            return Response(
                {"detail": "Vui lòng cung cấp vehicle và amount."}, status=400
            )
        if not customer_name or not customer_phone:
            return Response(
                {"detail": "Vui lòng nhập họ tên và số điện thoại."}, status=400
            )

        amount_int = int(float(amount))
        if amount_int < 100_000:
            return Response(
                {"detail": "Số tiền đặt cọc tối thiểu 100.000 đ."}, status=400
            )

        # ── Kiểm tra xe ───────────────────────────────────────
        from vehicles.models import VehicleUnit

        try:
            vehicle = VehicleUnit.objects.get(pk=vehicle_id)
        except VehicleUnit.DoesNotExist:
            return Response({"detail": "Xe không tồn tại."}, status=404)

        if vehicle.status not in ["LISTED", "READY_FOR_SALE"]:
            return Response(
                {"detail": f"Xe không thể đặt cọc (trạng thái: {vehicle.status})."},
                status=400,
            )

        if Deposit.objects.filter(vehicle=vehicle, status="CONFIRMED").exists():
            return Response(
                {"detail": "Xe này đã có người đặt cọc thành công."}, status=400
            )

        # ── Tạo Deposit với status PENDING ────────────────────
        momo_order_id = f"DEPOSIT_{uuid.uuid4().hex[:16].upper()}"
        customer = request.user if request.user.is_authenticated else None

        deposit = Deposit.objects.create(
            vehicle=vehicle,
            customer=customer,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            amount=amount_int,
            note=note,
            status=Deposit.Status.PENDING,  # ✅ Luôn bắt đầu là PENDING
            momo_order_id=momo_order_id,
        )

        # ── MOCK MODE ─────────────────────────────────────────
        if getattr(settings, "MOMO_MOCK", True):
            return self._mock_payment(deposit, vehicle, momo_order_id, amount_int)

        # ── REAL MOMO ─────────────────────────────────────────
        order_info = (
            f"Dat coc xe {vehicle.brand} {vehicle.model} {vehicle.year or ''} "
            f"- {customer_name} - {customer_phone}"
        ).strip()

        momo_resp = create_momo_payment(
            order_id=momo_order_id,
            amount=amount_int,
            order_info=order_info,
            extra_data=str(deposit.id),
        )

        if not momo_resp.success:
            deposit.delete()
            return Response(
                {"detail": f"Không thể tạo thanh toán MoMo: {momo_resp.message}"},
                status=502,
            )

        deposit.momo_pay_url = momo_resp.pay_url
        deposit.save(update_fields=["momo_pay_url"])

        return Response(
            {
                "deposit_id": deposit.id,
                "pay_url": momo_resp.pay_url,
                "qr_code_url": momo_resp.qr_code_url,
                "deep_link": momo_resp.deep_link,
                "order_id": momo_order_id,
                "amount": amount_int,
                "message": "Đã tạo link thanh toán MoMo.",
            },
            status=201,
        )

    def _mock_payment(self, deposit, vehicle, momo_order_id, amount_int):
        
        redirect_url = getattr(
            settings, "MOMO_REDIRECT_URL", "http://localhost:5173/deposit/result"
        )

        
        auto_confirm = getattr(settings, "MOMO_MOCK_AUTO_CONFIRM", )

        if auto_confirm:
            # Auto confirm: cập nhật deposit + xe
            from vehicles.models import VehicleStatusLog

            mock_trans_id = f"MOCK_{uuid.uuid4().hex[:8].upper()}"
            deposit.status = Deposit.Status.CONFIRMED
            deposit.momo_trans_id = mock_trans_id
            deposit.save(update_fields=["status", "momo_trans_id"])

            old_status = vehicle.status
            vehicle.status = "RESERVED"
            vehicle.save(update_fields=["status", "updated_at"])
            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status="RESERVED",
                note=f"[MOCK AUTO-CONFIRM] Đặt cọc #{deposit.id}",
            )
            print(
                f"\n[MOCK AUTO] Deposit #{deposit.id} CONFIRMED | xe #{vehicle.id} → RESERVED\n"
            )
        else:
            # Giữ PENDING — test flow thực tế
            mock_trans_id = f"MOCK_{uuid.uuid4().hex[:8].upper()}"
            deposit.momo_trans_id = mock_trans_id
            deposit.save(update_fields=["momo_trans_id"])
            print(
                f"\n[MOCK PENDING] Deposit #{deposit.id} created | xe #{vehicle.id} vẫn {vehicle.status}\n"
            )

        mock_pay_url = (
            f"{redirect_url}"
            f"?resultCode=0"
            f"&orderId={momo_order_id}"
            f"&transId={mock_trans_id}"
            f"&amount={amount_int}"
            f"&depositId={deposit.id}"
            f"&mock=1"
        )

        deposit.momo_pay_url = mock_pay_url
        deposit.save(update_fields=["momo_pay_url"])

        return Response(
            {
                "deposit_id": deposit.id,
                "pay_url": mock_pay_url,
                "qr_code_url": "",
                "deep_link": "",
                "order_id": momo_order_id,
                "amount": amount_int,
                "message": "[MOCK] Link thanh toán mô phỏng đã tạo.",
            },
            status=201,
        )


class MoMoIPNView(APIView):
    """POST /api/momo/ipn/ — MoMo callback sau khi thanh toán thật."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        result_code = int(data.get("resultCode", -1))
        order_id = data.get("orderId", "")
        trans_id = data.get("transId", "")

        if not verify_ipn(data):
            return Response({"message": "Invalid signature"}, status=400)

        try:
            deposit = Deposit.objects.select_related("vehicle").get(
                momo_order_id=order_id
            )
        except Deposit.DoesNotExist:
            return Response({"message": "Order not found"}, status=404)

        if result_code == 0:
            if deposit.status == Deposit.Status.PENDING:
                deposit.status = Deposit.Status.CONFIRMED
                deposit.momo_trans_id = str(trans_id)
                deposit.save(update_fields=["status", "momo_trans_id"])

                from vehicles.models import VehicleStatusLog

                vehicle = deposit.vehicle
                old_status = vehicle.status
                vehicle.status = "RESERVED"
                vehicle.save(update_fields=["status", "updated_at"])
                VehicleStatusLog.objects.create(
                    vehicle=vehicle,
                    old_status=old_status,
                    new_status="RESERVED",
                    note=f"Đặt cọc MoMo #{deposit.id} thành công (transId: {trans_id})",
                )
        else:
            if deposit.status == Deposit.Status.PENDING:
                deposit.status = Deposit.Status.CANCELLED
                deposit.save(update_fields=["status"])

        return Response({"message": "OK"})


class DepositMoMoStatusView(APIView):
    

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            deposit = Deposit.objects.select_related("vehicle").get(pk=pk)
        except Deposit.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn đặt cọc."}, status=404)

        # ── Mock confirm (chỉ khi MOMO_MOCK=True và có param mock_confirm) ──
        if (
            getattr(settings, "MOMO_MOCK", True)
            and request.query_params.get("mock_confirm") == "1"
            and deposit.status == Deposit.Status.PENDING
        ):
            from vehicles.models import VehicleStatusLog

            deposit.status = Deposit.Status.CONFIRMED
            deposit.save(update_fields=["status"])

            vehicle = deposit.vehicle
            old_status = vehicle.status
            vehicle.status = "RESERVED"
            vehicle.save(update_fields=["status", "updated_at"])
            VehicleStatusLog.objects.create(
                vehicle=vehicle,
                old_status=old_status,
                new_status="RESERVED",
                note=f"[MOCK CONFIRM] Đặt cọc #{deposit.id}",
            )
            print(f"\n[MOCK CONFIRM] Deposit #{deposit.id} confirmed | xe → RESERVED\n")

        STATUS_LABELS = {
            "PENDING": "Chờ thanh toán",
            "CONFIRMED": "Thanh toán thành công",
            "CANCELLED": "Đã hủy",
            "REFUNDED": "Đã hoàn tiền",
            "CONVERTED": "Đã chuyển đơn",
        }
        v = deposit.vehicle
        return Response(
            {
                "deposit_id": deposit.id,
                "status": deposit.status,
                "status_label": STATUS_LABELS.get(deposit.status, deposit.status),
                "amount": str(deposit.amount),
                "vehicle_name": f"{v.brand} {v.model} {v.year or ''}".strip(),
                "vehicle_status": v.status,
                "momo_trans_id": getattr(deposit, "momo_trans_id", ""),
                "created_at": deposit.created_at.isoformat(),
            }
        )
