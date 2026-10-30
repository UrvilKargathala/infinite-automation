import { create } from "zustand";
import { toast } from "sonner";
import type { Role } from "@/types";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  ticketAlerts: boolean;
  quoteAlerts: boolean;
  currency: CurrencyCode;
}

interface AuthStore {
  user: CurrentUser | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchMe: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<CurrentUser, "fullName" | "ticketAlerts" | "quoteAlerts" | "currency">>) => Promise<void>;
  reset: () => void;
}

const emptyUser: CurrentUser = { id: 0, fullName: "", email: "", role: "Purchase", ticketAlerts: true, quoteAlerts: false, currency: DEFAULT_CURRENCY };

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loaded: false,
  loading: false,
  error: null,
  fetchMe: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        set({ loading: false, loaded: true, error: body.error ?? "Failed to load account", user: null });
        return;
      }
      const user = await res.json();
      set({ user, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true, error: "Failed to load account", user: null });
    }
  },
  updateProfile: async (patch) => {
    const current = get().user ?? emptyUser;
    const res = await fetch(`/api/users/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update profile");
      throw new Error(body.error ?? "Failed to update profile");
    }
    const updated = await res.json();
    set({ user: updated });
  },
  reset: () => set({ user: null, loaded: false, loading: false, error: null }),
}));
