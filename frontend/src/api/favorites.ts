import api from "./client";

export interface Favorite {
  id:                number;
  vehicle:           number;
  vehicle_name:      string;
  vehicle_thumbnail: string | null;
  vehicle_price:     string | null;
  vehicle_status:    string;
  vehicle_year:      number | null;
  vehicle_mileage:   number | null;
  created_at:        string;
}

export interface FavoriteToggleResponse {
  favorited: boolean;
  message:   string;
  id?:       number;
}

// ── API calls ──────────────────────────────────────────────────

/** Danh sách xe yêu thích của user */
export async function getFavorites(): Promise<Favorite[]> {
  const res = await api.get("/favorites/");
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
}

/** Toggle yêu thích */
export async function toggleFavorite(
  vehicleId: number
): Promise<FavoriteToggleResponse> {
  const res = await api.post(`/favorites/${vehicleId}/toggle/`);
  return res.data;
}

/** Kiểm tra trạng thái yêu thích */
export async function getFavoriteStatus(
  vehicleId: number
): Promise<{ favorited: boolean }> {
  const res = await api.get(`/favorites/${vehicleId}/status/`);
  return res.data;
}