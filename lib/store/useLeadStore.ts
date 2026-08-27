import { create } from "zustand";
import type { Lead, LeadStage } from "@/types";

interface LeadStore {
  leads: Lead[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (lead: Omit<Lead, "id">) => Promise<void>;
  update: (id: number, patch: Partial<Omit<Lead, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setAll: (leads: Lead[]) => void;
  moveStage: (id: number, stage: LeadStage) => Promise<void>;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const res = await fetch("/api/leads");
    const leads = await res.json();
    set({ leads, loaded: true, loading: false });
  },
  add: async (lead) => {
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    const created = await res.json();
    set((s) => ({ leads: [...s.leads, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await res.json();
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
  },
  remove: async (id) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  },
  setAll: (leads) => set({ leads, loaded: true }),
  moveStage: async (id, stage) => {
    const prevStage = get().leads.find((l) => l.id === id)?.stage;
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)) }));
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
      if (!res.ok) throw new Error("Failed to update stage");
    } catch {
      if (prevStage) set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, stage: prevStage } : l)) }));
    }
  },
}));
