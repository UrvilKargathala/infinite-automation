import { create } from "zustand";
import { toast } from "sonner";
import type { Customer } from "@/types";

interface CustomerStore {
  customers: Customer[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (customer: Omit<Customer, "id" | "createdAt">) => Promise<Customer>;
  update: (id: number, patch: Partial<Omit<Customer, "id" | "createdAt">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const customers = await res.json();
      set({ customers, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true });
      toast.error("Couldn't load customers. Check your connection and try again.");
    }
  },
  add: async (customer) => {
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(customer) });
    if (!res.ok) {
      toast.error("Failed to add customer");
      throw new Error("Failed to add customer");
    }
    const created = await res.json();
    set((s) => ({ customers: [...s.customers, created].sort((a, b) => a.name.localeCompare(b.name)) }));
    return created;
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) {
      toast.error("Failed to update customer");
      throw new Error("Failed to update customer");
    }
    const updated = await res.json();
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)) }));
  },
  remove: async (id) => {
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete customer");
      throw new Error("Failed to delete customer");
    }
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
  },
}));
