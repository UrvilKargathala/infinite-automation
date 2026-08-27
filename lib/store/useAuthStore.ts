import { create } from "zustand";
import type { Role } from "@/types";

interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

interface AuthStore {
  user: CurrentUser | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchMe: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<CurrentUser, "fullName">>) => Promise<void>;
  reset: () => void;
}

const emptyUser: CurrentUser = { id: 0, fullName: "", email: "", role: "Staff" };

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loaded: false,
  loading: false,
  error: null,
  fetchMe: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    const res = await fetch("/api/me");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ loading: false, loaded: true, error: body.error ?? "Failed to load account", user: null });
      return;
    }
    const user = await res.json();
    set({ user, loaded: true, loading: false });
  },
  updateProfile: async (patch) => {
    const current = get().user ?? emptyUser;
    const res = await fetch(`/api/users/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    set({ user: updated });
  },
  reset: () => set({ user: null, loaded: false, loading: false, error: null }),
}));
