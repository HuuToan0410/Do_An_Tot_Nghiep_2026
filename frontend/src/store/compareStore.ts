import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_COMPARE } from "../api/compare";

interface CompareState {
  vehicleIds: number[];
  addVehicle:    (id: number) => boolean;   // returns false nếu đã đầy hoặc trùng
  removeVehicle: (id: number) => void;
  clearAll:      () => void;
  hasVehicle:    (id: number) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      vehicleIds: [],

      addVehicle: (id) => {
        const { vehicleIds } = get();
        if (vehicleIds.includes(id))     return false;
        if (vehicleIds.length >= MAX_COMPARE) return false;
        set({ vehicleIds: [...vehicleIds, id] });
        return true;
      },

      removeVehicle: (id) =>
        set((s) => ({
          vehicleIds: s.vehicleIds.filter((v) => v !== id),
        })),

      clearAll: () => set({ vehicleIds: [] }),

      hasVehicle: (id) => get().vehicleIds.includes(id),
    }),
    {
      name:       "compare-storage",
      partialize: (s) => ({ vehicleIds: s.vehicleIds }),
    }
  )
);