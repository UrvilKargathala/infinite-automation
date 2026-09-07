import { create } from "zustand";
import { toast } from "sonner";
import type { Product } from "@/types";

function normalizeCategory(raw: string): string {
  let v = raw.trim();
  v = v.replace(/Garrage/g, "Garage");
  v = v.replace(/Contoller/g, "Controller");
  v = v.replace(/Conroller/g, "Controller");
  v = v.replace(/Alarams/g, "Alarms");
  return v;
}

interface ProductStore {
  products: Product[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (p: Omit<Product, "id">) => Promise<void>;
  update: (id: number, patch: Partial<Omit<Product, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  bulkAdd: (items: Omit<Product, "id">[]) => Promise<void>;
  setAll: (items: Product[]) => void;
  brands: () => string[];
  categories: () => string[];
  categoriesByBrand: (brand: string) => string[];
  brandsByCategory: (category: string) => string[];
  productsByBrandCategory: (brand: string, category: string) => Product[];
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const products = await res.json();
      set({ products, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true });
      toast.error("Couldn't load products. Check your connection and try again.");
    }
  },
  add: async (p) => {
    const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to add product");
    }
    const created = await res.json();
    set((s) => ({ products: [...s.products, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to update product");
    }
    const updated = await res.json();
    set((s) => ({ products: s.products.map((p) => (p.id === id ? updated : p)) }));
  },
  remove: async (id) => {
    const prev = get().products;
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      set({ products: prev });
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to delete product");
    }
  },
  bulkAdd: async (items) => {
    const normalized = items.map((p) => ({ ...p, category: normalizeCategory(p.category) }));
    const bulkRes = await fetch("/api/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(normalized) });
    if (!bulkRes.ok) {
      const body = await bulkRes.json().catch(() => ({}));
      toast.error(body.error ?? "You don't have permission to do that");
      throw new Error(body.error ?? "Failed to import products");
    }
    const res = await fetch("/api/products");
    set({ products: await res.json() });
  },
  setAll: (items) => set({ products: items, loaded: true }),
  brands: () => [...new Set(get().products.map((p) => p.brand))].sort(),
  categories: () => [...new Set(get().products.map((p) => p.category))].sort(),
  categoriesByBrand: (brand) =>
    [...new Set(get().products.filter((p) => p.brand === brand).map((p) => p.category))].sort(),
  brandsByCategory: (category) =>
    [...new Set(get().products.filter((p) => p.category === category).map((p) => p.brand))].sort(),
  productsByBrandCategory: (brand, category) =>
    get().products.filter((p) => p.brand === brand && p.category === category && p.status === "Active"),
}));
