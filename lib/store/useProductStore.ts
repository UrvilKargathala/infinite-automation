import { create } from "zustand";
import type { Product } from "@/types";

const seedProducts: Product[] = [
  // Infinite AUS
  { id: 1, name: "4-Gang Smart Switch", sku: "IA-LC-401", brand: "Infinite AUS", category: "Light Controller", hsn: "8536", price: 4500, status: "Active" },
  { id: 2, name: "8-Gang Smart Switch", sku: "IA-LC-801", brand: "Infinite AUS", category: "Light Controller", hsn: "8536", price: 7200, status: "Active" },
  { id: 3, name: "Dimmer Module 2CH", sku: "IA-LC-DM2", brand: "Infinite AUS", category: "Light Controller", hsn: "8536", price: 3800, status: "Active" },
  { id: 4, name: "Smart Garage Opener", sku: "IA-GD-100", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "8537", price: 6500, status: "Active" },
  { id: 5, name: "Dual Garage Controller", sku: "IA-GD-200", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "8537", price: null, status: "Active" },
  { id: 6, name: "Split AC Controller", sku: "IA-AC-SP1", brand: "Infinite AUS", category: "AC Controller", hsn: "8415", price: 5200, status: "Active" },
  { id: 7, name: "Curtain Motor 45W", sku: "IA-CM-045", brand: "Infinite AUS", category: "Curtain Controller", hsn: "8501", price: 8900, status: "Active" },
  { id: 8, name: "IR Blaster Pro", sku: "IA-IR-PRO", brand: "Infinite AUS", category: "Infrared Controller", hsn: "8543", price: 2200, status: "Active" },
  // Automation Products
  { id: 9, name: "CAT6 Patch Cable 3m", sku: "AP-CB-C63", brand: "Automation Products", category: "Cables", hsn: "8544", price: 350, status: "Active" },
  { id: 10, name: "16A Smart Relay", sku: "AP-RL-16A", brand: "Automation Products", category: "Relays", hsn: "8536", price: 1800, status: "Active" },
  { id: 11, name: "DIN Rail Connector 8P", sku: "AP-CN-DR8", brand: "Automation Products", category: "Connectors", hsn: "8536", price: null, status: "Active" },
  // Electrical Product
  { id: 12, name: "Smart Door Lock E200", sku: "EP-LK-200", brand: "Electrical Product", category: "Locks", hsn: "8301", price: 12500, status: "Active" },
  { id: 13, name: "Zigbee Smart Bulb 9W", sku: "EP-LT-ZB9", brand: "Electrical Product", category: "Light", hsn: "8539", price: 850, status: "Active" },
  { id: 14, name: "LED Driver 40W", sku: "EP-DR-040", brand: "Electrical Product", category: "Driver", hsn: "8504", price: 1200, status: "Active" },
  // Wifi
  { id: 15, name: "U7 Pro Access Point", sku: "WF-AP-U7P", brand: "Wifi", category: "Access Point", hsn: "8517", price: 18500, status: "Active" },
  { id: 16, name: "U6 Lite Access Point", sku: "WF-AP-U6L", brand: "Wifi", category: "Access Point", hsn: "8517", price: 9800, status: "Active" },
  { id: 17, name: "U6 Mesh Access Point", sku: "WF-AP-U6M", brand: "Wifi", category: "Access Point", hsn: "8517", price: null, status: "Inactive" },
  // Camera
  { id: 18, name: "G5 Turret Ultra", sku: "CM-TR-G5U", brand: "Camera", category: "Turret", hsn: "8525", price: 22000, status: "Active" },
  { id: 19, name: "G4 Dome Camera", sku: "CM-DM-G4D", brand: "Camera", category: "Dome", hsn: "8525", price: 16500, status: "Active" },
  { id: 20, name: "G4 Bullet Camera", sku: "CM-BL-G4B", brand: "Camera", category: "Bullet", hsn: "8525", price: 14200, status: "Active" },
  { id: 21, name: "AI Camera 360", sku: "CM-AI-360", brand: "Camera", category: "AI Camera", hsn: "8525", price: 28000, status: "Active" },
  // Video Door Phone
  { id: 22, name: "NFC Card Reader", sku: "VD-RD-NFC", brand: "Video Door Phone", category: "Reader", hsn: "8543", price: 4800, status: "Active" },
  { id: 23, name: "7-inch Intercom Panel", sku: "VD-IC-700", brand: "Video Door Phone", category: "Intercom", hsn: "8517", price: 15000, status: "Active" },
  { id: 24, name: "Access Hub Pro", sku: "VD-AC-PRO", brand: "Video Door Phone", category: "Access Control", hsn: "8543", price: null, status: "Active" },
  // Sensors & Alarms
  { id: 25, name: "Motion Sensor PIR", sku: "SA-SN-PIR", brand: "Sensors & Alarms", category: "Sensor", hsn: "9031", price: 1800, status: "Active" },
  { id: 26, name: "Flood Sensor", sku: "SA-SN-FLD", brand: "Sensors & Alarms", category: "Sensor", hsn: "9031", price: 2200, status: "Active" },
  { id: 27, name: "Alarm Hub Central", sku: "SA-AH-CTR", brand: "Sensors & Alarms", category: "Alarm Hub", hsn: "8531", price: 9500, status: "Active" },
  // Advance Hosting
  { id: 28, name: "UDM Pro Gateway", sku: "AH-GW-UDM", brand: "Advance Hosting", category: "Gateway", hsn: "8517", price: 35000, status: "Active" },
  { id: 29, name: "Cloud Key Gen2+", sku: "AH-CK-G2P", brand: "Advance Hosting", category: "Cloud Key", hsn: "8471", price: 16000, status: "Active" },
  // Managed VoIP
  { id: 30, name: "UTP Handset", sku: "MV-HS-UTP", brand: "Managed VoIP", category: "Handset", hsn: "8517", price: null, status: "Active" },
];

interface ProductStore {
  products: Product[];
  nextId: number;
  add: (p: Omit<Product, "id">) => void;
  update: (id: number, patch: Partial<Omit<Product, "id">>) => void;
  remove: (id: number) => void;
  bulkAdd: (items: Omit<Product, "id">[]) => void;
  setAll: (items: Product[]) => void;
  brands: () => string[];
  categories: () => string[];
  categoriesByBrand: (brand: string) => string[];
  brandsByCategory: (category: string) => string[];
  productsByBrandCategory: (brand: string, category: string) => Product[];
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: seedProducts,
  nextId: 31,
  add: (p) =>
    set((s) => ({ products: [...s.products, { ...p, id: s.nextId }], nextId: s.nextId + 1 })),
  update: (id, patch) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  remove: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
  bulkAdd: (items) =>
    set((s) => {
      let id = s.nextId;
      const newProducts = items.map((p) => ({ ...p, id: id++ }));
      return { products: [...s.products, ...newProducts], nextId: id };
    }),
  setAll: (items) => set({ products: items }),
  brands: () => [...new Set(get().products.map((p) => p.brand))].sort(),
  categories: () => [...new Set(get().products.map((p) => p.category))].sort(),
  categoriesByBrand: (brand) =>
    [...new Set(get().products.filter((p) => p.brand === brand).map((p) => p.category))].sort(),
  brandsByCategory: (category) =>
    [...new Set(get().products.filter((p) => p.category === category).map((p) => p.brand))].sort(),
  productsByBrandCategory: (brand, category) =>
    get().products.filter((p) => p.brand === brand && p.category === category && p.status === "Active"),
}));
