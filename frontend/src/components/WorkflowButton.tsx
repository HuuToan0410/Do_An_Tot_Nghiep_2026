import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  vehicleTransition,
  type WorkflowAction,
  type WorkflowTransitionPayload,
} from "../api/workflow";

const COLOR_MAP = {
  blue: "bg-blue-600  hover:bg-blue-700  text-white",
  green: "bg-green-600 hover:bg-green-700 text-white",
  red: "border border-red-300 text-red-600 hover:bg-red-50",
  gray: "border border-gray-300 text-gray-600 hover:bg-gray-50",
} as const;

interface Props {
  vehicleId: number;
  /** new_status gửi lên Django (khớp VehicleTransitionSerializer) */
  action: WorkflowAction;
  label: string;
  note?: string;
  color?: keyof typeof COLOR_MAP;
  onSuccess?: (newStatus: string) => void;
}

export default function WorkflowButton({
  vehicleId,
  action,
  label,
  note,
  color = "blue",
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: WorkflowTransitionPayload = {
        new_status: action,
        note: note ?? "",
      };
      return vehicleTransition(vehicleId, payload);
    },
    onSuccess: (data) => {
      // Invalidate tất cả query liên quan đến xe
      queryClient.invalidateQueries({ queryKey: ["vehiclesWorkflow"] });
      queryClient.invalidateQueries({ queryKey: ["adminVehicles"] });
      queryClient.invalidateQueries({
        queryKey: ["adminVehicle", String(vehicleId)],
      });

      onSuccess?.(data.status);

      setToast({
        type: "success",
        msg: data.message ?? "Cập nhật trạng thái thành công.",
      });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: Error) => {
      setToast({
        type: "error",
        msg: err.message ?? "Thao tác thất bại. Vui lòng thử lại.",
      });
      setTimeout(() => setToast(null), 4000);
    },
  });

  return (
    <div className="relative inline-block">
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={`
          flex items-center gap-1.5 text-xs font-semibold
          px-3 py-1.5 rounded-lg transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${COLOR_MAP[color]}
        `}
      >
        {mutation.isPending && (
          <Loader2 size={13} className="animate-spin shrink-0" />
        )}
        {label}
      </button>

      {/* Toast thông báo */}
      {toast && (
        <div
          className={`
            absolute bottom-full left-0 mb-2 z-20 whitespace-nowrap
            flex items-center gap-1.5 text-xs font-medium
            px-3 py-2 rounded-lg shadow-lg
            ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}
          `}
        >
          {toast.type === "success" ? (
            <CheckCircle size={12} className="shrink-0" />
          ) : (
            <AlertCircle size={12} className="shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
