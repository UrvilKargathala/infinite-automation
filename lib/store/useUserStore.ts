import { create } from "zustand";
import { toast } from "sonner";
import type { User } from "@/types";

interface UserStore {
  users: User[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (u: Omit<User, "id">) => Promise<void>;
  update: (id: number, patch: Partial<Omit<User, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const users = await res.json();
      set({ users, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true });
      toast.error("Couldn't load users. Check your connection and try again.");
    }
  },
  add: async (u) => {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(u) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to add user");
    }
    const created = await res.json();
    set((s) => ({ users: [...s.users, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to update user");
    }
    const updated = await res.json();
    set((s) => ({ users: s.users.map((u) => (u.id === id ? updated : u)) }));
  },
  remove: async (id) => {
    const prev = get().users;
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      set({ users: prev });
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to delete user");
    }
  },
}));
