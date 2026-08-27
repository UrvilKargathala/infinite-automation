import { create } from "zustand";
import type { Quote } from "@/types";

interface QuoteStore {
  quotes: Quote[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (q: Omit<Quote, "id" | "number">) => Promise<void>;
  update: (id: number, patch: Partial<Quote>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setAll: (quotes: Quote[]) => void;
}

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const res = await fetch("/api/quotes");
    const quotes = await res.json();
    set({ quotes, loaded: true, loading: false });
  },
  add: async (q) => {
    const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
    const created = await res.json();
    set((s) => ({ quotes: [...s.quotes, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await res.json();
    set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? updated : q)) }));
  },
  remove: async (id) => {
    set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }));
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
  },
  setAll: (quotes) => set({ quotes, loaded: true }),
}));
