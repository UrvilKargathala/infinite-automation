import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
};

/** Desktop sidebar expanded/collapsed — remembered per browser. */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: "ia-sidebar", storage: createJSONStorage(() => localStorage) }
  )
);
