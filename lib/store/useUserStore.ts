import { create } from "zustand";
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
    const res = await fetch("/api/users");
    const users = await res.json();
    set({ users, loaded: true, loading: false });
  },
  add: async (u) => {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(u) });
    const created = await res.json();
    set((s) => ({ users: [...s.users, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await res.json();
    set((s) => ({ users: s.users.map((u) => (u.id === id ? updated : u)) }));
  },
  remove: async (id) => {
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
    await fetch(`/api/users/${id}`, { method: "DELETE" });
  },
}));
