import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "../api/auth";

interface AuthState {
  token:   string | null;
  refresh: string | null;
  user:    UserProfile | null;

  setAuth:         (access: string, refresh: string, user?: UserProfile) => void;
  setUser:         (user: UserProfile) => void;
  logout:          () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:   null,
      refresh: null,
      user:    null,

      setAuth: (access, refresh, user) =>
        set({
          token:   access,
          refresh,
          user:    user ?? get().user,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          token:   null,
          refresh: null,
          user:    null,
        }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
      // Chỉ persist những field cần thiết — không persist method
      partialize: (state) => ({
        token:   state.token,
        refresh: state.refresh,
        user:    state.user,
      }),
    }
  )
);