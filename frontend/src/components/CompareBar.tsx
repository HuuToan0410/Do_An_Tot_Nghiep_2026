import { Link } from "react-router-dom";
import { X, GitCompare, ArrowRight } from "lucide-react";
import { useCompareStore } from "../store/compareStore";
import { useQuery } from "@tanstack/react-query";
import { getVehicleDetail } from "../api/vehicleDetail";

function CompareItem({ id }: { id: number }) {
  const removeVehicle = useCompareStore((s) => s.removeVehicle);
  const { data } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleDetail(id),
  });

  const thumbnail = data?.media
    ?.filter((m) => m.media_type === "IMAGE")
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0]?.file;

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 min-w-[160px] max-w-[200px]">
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="w-10 h-8 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold truncate">
          {data ? `${data.brand} ${data.model}` : "Đang tải..."}
        </p>
        {data?.year && <p className="text-white/60 text-[10px]">{data.year}</p>}
      </div>
      <button
        onClick={() => removeVehicle(id)}
        className="text-white/60 hover:text-white shrink-0 p-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function CompareBar() {
  const { vehicleIds, clearAll } = useCompareStore();

  if (vehicleIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Icon + count */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <GitCompare size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">So sánh xe</p>
            <p className="text-white/50 text-[10px]">
              {vehicleIds.length}/3 xe
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 shrink-0" />

        {/* Vehicle items */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {vehicleIds.map((id) => (
            <CompareItem key={id} id={id} />
          ))}

          {/* Empty slots */}
          {Array.from({ length: 3 - vehicleIds.length }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center border border-dashed border-white/20 rounded-xl px-4 py-2 min-w-[120px] text-white/30 text-xs"
            >
              + Thêm xe
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearAll}
            className="text-white/50 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Xóa tất cả
          </button>
          {vehicleIds.length >= 2 && (
            <Link
              to={`/compare?ids=${vehicleIds.join(",")}`}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              So sánh ngay <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
