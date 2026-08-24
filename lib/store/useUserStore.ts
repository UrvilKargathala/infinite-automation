import { create } from "zustand";
import type { User } from "@/types";

const seedUsers: User[] = [
  { id: 1, fullName: "Urvil Kargathala", email: "infiniteautomation@ia.com", role: "Super Admin", status: "Active" },
  { id: 2, fullName: "Henil Patel", email: "infiniteautomation@ia.com", role: "Super Admin", status: "Active" },
  { id: 3, fullName: "Parth", email: "infiniteautomation@ia.com", role: "Super Admin", status: "Active" },
];

interface UserStore {
  users: User[];
  nextId: number;
  add: (u: Omit<User, "id">) => void;
  update: (id: number, patch: Partial<Omit<User, "id">>) => void;
  remove: (id: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  users: seedUsers,
  nextId: 4,
  add: (u) =>
    set((s) => ({ users: [...s.users, { ...u, id: s.nextId }], nextId: s.nextId + 1 })),
  update: (id, patch) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
  remove: (id) =>
    set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
}));
