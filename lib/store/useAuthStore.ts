import { create } from "zustand";
import type { Role } from "@/types";

interface CurrentUser {
  fullName: string;
  email: string;
  role: Role;
}

interface AuthStore {
  user: CurrentUser;
  updateProfile: (patch: Partial<CurrentUser>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: {
    fullName: "Urvil",
    email: "urvil@infiniteautomation.com",
    role: "Super Admin",
  },
  updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
}));
