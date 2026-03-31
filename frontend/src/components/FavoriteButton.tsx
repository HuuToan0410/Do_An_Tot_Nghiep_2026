import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toggleFavorite, getFavoriteStatus } from "../api/favorites";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
interface Props {
  vehicleId: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 14, btn: "p-1.5 rounded-lg" },
  md: { icon: 18, btn: "p-2 rounded-xl" },
  lg: { icon: 22, btn: "p-2.5 rounded-xl" },
};

export default function FavoriteButton({
  vehicleId,
  size = "md",
  showLabel = false,
  className = "",
}: Props) {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isAuthenticated());
  const { icon, btn } = sizeMap[size];
  const navigate = useNavigate();
  const location = useLocation();
  // Kiểm tra trạng thái yêu thích
  const { data, isLoading } = useQuery({
    queryKey: ["favoriteStatus", vehicleId],
    queryFn: () => getFavoriteStatus(vehicleId),
    enabled: isLoggedIn,
    staleTime: 1000 * 60,
  });

  const favorited = isLoggedIn ? (data?.favorited ?? false) : false;

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(vehicleId),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ["favoriteStatus", vehicleId],
      });
      const prev = queryClient.getQueryData<{ favorited: boolean }>([
        "favoriteStatus",
        vehicleId,
      ]);
      queryClient.setQueryData(["favoriteStatus", vehicleId], {
        favorited: !favorited,
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      // Rollback
      queryClient.setQueryData(["favoriteStatus", vehicleId], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["favoriteStatus", vehicleId],
      });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  //if (!isLoggedIn) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
          navigate("/login", { state: { from: location } });
          return;
        }

        if (!mutation.isPending) mutation.mutate();
      }}
      disabled={isLoading || mutation.isPending}
      title={favorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      className={`flex items-center gap-1.5 transition-all ${btn} ${
        favorited
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50"
      } ${mutation.isPending ? "opacity-60" : ""} ${className}`}
    >
      <Heart
        size={icon}
        className={`transition-all ${
          mutation.isPending ? "animate-pulse" : ""
        }`}
        fill={favorited ? "currentColor" : "none"}
      />
      {showLabel && (
        <span className="text-xs font-semibold">
          {favorited ? "Đã thích" : "Yêu thích"}
        </span>
      )}
    </button>
  );
}
