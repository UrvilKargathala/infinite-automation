import { create } from "zustand";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@/types";

interface TicketStore {
  tickets: Ticket[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (ticket: Omit<Ticket, "id">) => Promise<void>;
  update: (id: number, patch: Partial<Omit<Ticket, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setAll: (tickets: Ticket[]) => void;
  updateStatus: (id: number, status: TicketStatus) => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Failed to load tickets");
      const tickets = await res.json();
      set({ tickets, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true });
      toast.error("Couldn't load tickets. Check your connection and try again.");
    }
  },
  add: async (ticket) => {
    const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticket) });
    const created = await res.json();
    set((s) => ({ tickets: [...s.tickets, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await res.json();
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? updated : t)) }));
  },
  remove: async (id) => {
    set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) }));
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
  },
  setAll: (tickets) => set({ tickets, loaded: true }),
  updateStatus: async (id, status) => {
    const prevStatus = get().tickets.find((t) => t.id === id)?.status;
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) }));
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      if (prevStatus) set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status: prevStatus } : t)) }));
    }
  },
}));
