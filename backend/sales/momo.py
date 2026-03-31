# sales/momo.py — DEBUG VERSION
import hashlib, hmac, re, uuid
from dataclasses import dataclass
import requests
from django.conf import settings


@dataclass
class MoMoResponse:
    success: bool
    pay_url: str = ""
    qr_code_url: str = ""
    deep_link: str = ""
    order_id: str = ""
    result_code: int = -1
    message: str = ""


def _sign(raw: str) -> str:
    key = getattr(settings, "MOMO_SECRET_KEY", "")
    return hmac.new(
        key.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _safe(text: str) -> str:
    """Bỏ mọi ký tự ngoài ASCII printable (space đến ~)."""
    return re.sub(r"[^\x20-\x7E]", "", str(text)).strip()[:255]


def create_momo_payment(
    order_id: str, amount: int, order_info: str, extra_data: str = ""
) -> MoMoResponse:
    partner = getattr(settings, "MOMO_PARTNER_CODE", "MOMOBKUN20180529")
    access = getattr(settings, "MOMO_ACCESS_KEY", "klm05TvNBzhg7h7j")
    endpoint = getattr(
        settings, "MOMO_ENDPOINT", "https://test-payment.momo.vn/v2/gateway/api/create"
    )
    redirect = getattr(
        settings, "MOMO_REDIRECT_URL", "http://localhost:5173/deposit/result"
    ).strip()
    ipn_url = getattr(settings, "MOMO_IPN_URL", "").strip()
    request_id = str(uuid.uuid4())

    s_info = _safe(order_info)
    s_extra = _safe(extra_data)
    s_oid = _safe(order_id)

    raw = (
        f"accessKey={access}"
        f"&amount={amount}"
        f"&extraData={s_extra}"
        f"&ipnUrl={ipn_url}"
        f"&orderId={s_oid}"
        f"&orderInfo={s_info}"
        f"&partnerCode={partner}"
        f"&redirectUrl={redirect}"
        f"&requestId={request_id}"
        f"&requestType=captureWallet"
    )

    sig = _sign(raw)

    # ── In ra terminal Django để debug ──
    print("\n" + "=" * 70)
    print("[MOMO] raw:", raw)
    print("[MOMO] sig:", sig)
    print("[MOMO] partner:", partner, "| access:", access[:6] + "***")
    print("[MOMO] ipn_url:", ipn_url)
    print("=" * 70 + "\n")

    body = {
        "partnerCode": partner,
        "accessKey": access,
        "requestId": request_id,
        "amount": str(amount),
        "orderId": s_oid,
        "orderInfo": s_info,
        "redirectUrl": redirect,
        "ipnUrl": ipn_url,
        "extraData": s_extra,
        "requestType": "captureWallet",
        "signature": sig,
        "lang": "vi",
    }

    try:
        r = requests.post(
            endpoint,
            json=body,
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        d = r.json()
        print("[MOMO RESPONSE]", d)
        if d.get("resultCode") == 0:
            return MoMoResponse(
                success=True,
                pay_url=d.get("payUrl", ""),
                qr_code_url=d.get("qrCodeUrl", ""),
                deep_link=d.get("deeplink", ""),
                order_id=s_oid,
                result_code=0,
                message=d.get("message", ""),
            )
        return MoMoResponse(
            success=False,
            result_code=d.get("resultCode", -1),
            message=d.get("message", "Lỗi từ MoMo"),
            order_id=s_oid,
        )
    except requests.Timeout:
        return MoMoResponse(success=False, message="Timeout kết nối MoMo (15s)")
    except Exception as e:
        return MoMoResponse(success=False, message=str(e))


def verify_ipn(data: dict) -> bool:
    access = getattr(settings, "MOMO_ACCESS_KEY", "klm05TvNBzhg7h7j")
    raw = (
        f"accessKey={access}&amount={data.get('amount')}"
        f"&extraData={data.get('extraData','')}&message={data.get('message','')}"
        f"&orderId={data.get('orderId')}&orderInfo={data.get('orderInfo','')}"
        f"&orderType={data.get('orderType','')}&partnerCode={data.get('partnerCode')}"
        f"&payType={data.get('payType','')}&requestId={data.get('requestId')}"
        f"&responseTime={data.get('responseTime')}&resultCode={data.get('resultCode')}"
        f"&transId={data.get('transId')}"
    )
    return hmac.compare_digest(_sign(raw), data.get("signature", ""))
