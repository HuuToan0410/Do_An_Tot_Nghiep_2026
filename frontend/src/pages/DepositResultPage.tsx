// src/pages/DepositResultPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Home, ArrowRight } from "lucide-react";
import api from "../api/client";

interface DepositStatus {
  deposit_id: number;
  status: string;
  status_label: string;
  amount: string;
  vehicle_name: string;
  momo_trans_id: string;
}

export default function DepositResultPage() {
  const [params] = useSearchParams();
  const resultCode = Number(params.get("resultCode") ?? "-1");
  const orderId = params.get("orderId") ?? "";
  const depositId = sessionStorage.getItem("pendingDepositId");

  const [info, setInfo] = useState<DepositStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!depositId) {
      setLoading(false);
      return;
    }
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await api.get(`/deposits/${depositId}/momo/`);
        setInfo(res.data);
        if (res.data.status === "PENDING" && attempts < 4) {
          attempts++;
          setTimeout(poll, 1500);
        } else {
          setLoading(false);
          if (res.data.status !== "PENDING")
            sessionStorage.removeItem("pendingDepositId");
        }
      } catch {
        setLoading(false);
      }
    };
    poll();
  }, [depositId]);

  const isSuccess = resultCode === 0 || info?.status === "CONFIRMED";

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-pink-500" />
        <p className="text-gray-500 text-sm">Đang xác nhận thanh toán...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              Đặt cọc thành công!
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Nhân viên sẽ liên hệ bạn trong vòng 30 phút.
            </p>
            {info && (
              <div className="bg-green-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Xe</span>
                  <span className="font-semibold text-gray-800">
                    {info.vehicle_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-bold text-green-700">
                    {Number(info.amount).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mã GD</span>
                  <span className="font-mono text-xs text-gray-600">
                    {info.momo_trans_id || orderId}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Link
                to="/profile"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Xem lịch sử đặt cọc <ArrowRight size={16} />
              </Link>
              <Link
                to="/vehicles"
                className="w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Home size={15} /> Trang chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              Thanh toán không thành công
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Giao dịch bị hủy hoặc hết thời gian. Vui lòng thử lại.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/vehicles"
                className="w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Home size={15} /> Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
