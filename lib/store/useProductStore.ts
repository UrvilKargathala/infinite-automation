import { create } from "zustand";
import type { Product } from "@/types";

const seedProducts: Product[] = [
  // Infinite AUS
  { id: 1, name: "4 Channel Dimmer Device", sku: "DIMMER", brand: "Infinite AUS", category: "Light Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 2, name: "2 Channel 10 AMP Device", sku: "10AMP", brand: "Infinite AUS", category: "Light Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 3, name: "2 Channel Garage Door Device", sku: "GD-2C", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 4, name: "HVAC AC Device", sku: "HVAC", brand: "Infinite AUS", category: "AC Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 5, name: "4 Channel Garage Door Device", sku: "ELV DRY", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 6, name: "Low Voltage 4 Channel Device", sku: "ELV_PWM", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 7, name: "ELV_WET", sku: "ELV_WET", brand: "Infinite AUS", category: "Garage Door Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 8, name: "Dendo Curtain/Blind Motor", sku: "DECUMO", brand: "Infinite AUS", category: "Curtain Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 9, name: "IR Device", sku: "IRD", brand: "Infinite AUS", category: "Infrared Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 10, name: "Curtain/Blind Device", sku: "BCDEV", brand: "Infinite AUS", category: "Curtain Controller", hsn: "85176990", price: null, status: "Active" },
  { id: 11, name: "Curtain/Blind Transmitter", sku: "BC TRANSMITTER", brand: "Infinite AUS", category: "Curtain Controller", hsn: "85176990", price: null, status: "Active" },
  // Automation Products
  { id: 12, name: "Device Power Supply Cable", sku: "", brand: "Automation Products", category: "Light Controller", hsn: "85444999", price: null, status: "Active" },
  { id: 13, name: "Light Power Supply Cable", sku: "", brand: "Automation Products", category: "Light Controller", hsn: "85444999", price: null, status: "Active" },
  { id: 14, name: "Switches Cable 4", sku: "", brand: "Automation Products", category: "Light Controller", hsn: "85444999", price: null, status: "Active" },
  { id: 15, name: "Switches Cable 8 For Dry Contact", sku: "", brand: "Automation Products", category: "Garage Door Controller", hsn: "85444999", price: null, status: "Active" },
  { id: 16, name: "SSR Relay", sku: "", brand: "Automation Products", category: "Light Controller", hsn: "85364900", price: null, status: "Active" },
  { id: 17, name: "Reed Switch", sku: "", brand: "Automation Products", category: "Garage Door Controller", hsn: "85044090", price: null, status: "Active" },
  // Electrical Product
  { id: 18, name: "Smart Locks", sku: "LOCKS", brand: "Electrical Product", category: "Locks", hsn: "83013000", price: null, status: "Active" },
  { id: 19, name: "Dimmable Light", sku: "LIGHT", brand: "Electrical Product", category: "Light", hsn: "94054090", price: null, status: "Active" },
  { id: 20, name: "Dimmable Light Driver", sku: "DRIVER", brand: "Electrical Product", category: "Driver", hsn: "94054090", price: null, status: "Active" },
  { id: 21, name: "Cob / Panel Light", sku: "LIGHT", brand: "Electrical Product", category: "Light", hsn: "94054090", price: null, status: "Active" },
  { id: 22, name: "Tunable Light", sku: "LIGHT", brand: "Electrical Product", category: "Light", hsn: "94054090", price: null, status: "Active" },
  { id: 23, name: "Tunable Light Driver", sku: "DRIVER", brand: "Electrical Product", category: "Driver", hsn: "94054090", price: null, status: "Active" },
  { id: 24, name: "12 - 24 Volt Driver", sku: "DRIVER", brand: "Electrical Product", category: "Driver", hsn: "85044090", price: null, status: "Active" },
  { id: 25, name: "Led Strip Driver", sku: "DRIVER", brand: "Electrical Product", category: "Driver", hsn: "94054090", price: null, status: "Active" },
  { id: 26, name: "Power Adapter ( 12 - 24 V)", sku: "DRIVER", brand: "Electrical Product", category: "Driver", hsn: "85044090", price: null, status: "Active" },
  { id: 27, name: "Wire Tape", sku: "TAPE", brand: "Electrical Product", category: "Misc", hsn: "82032000", price: null, status: "Active" },
  { id: 28, name: "RJ45 Connector", sku: "CONNECTOR", brand: "Electrical Product", category: "Misc", hsn: "85044090", price: null, status: "Active" },
  { id: 29, name: "Capacitor", sku: "CAPACITOR", brand: "Electrical Product", category: "Capacitor", hsn: "85044090", price: null, status: "Active" },
  // Wifi
  { id: 30, name: "U7 Pro XGS", sku: "U7-Pro-XGS", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 31, name: "U7 Pro XG", sku: "U7-Pro-XG", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 32, name: "U7 Pro Max", sku: "U7-Pro-Max", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 33, name: "U7 Pro", sku: "U7-Pro", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 34, name: "U7 Long Range", sku: "U7-LR", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 35, name: "U7 Lite", sku: "U7-Lite", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 36, name: "U6 Enterprise", sku: "U6-Enterprise", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 37, name: "U6 Pro", sku: "U6-Pro", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 38, name: "U6+", sku: "U6+", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  { id: 39, name: "AC Pro", sku: "UAP-AC-PRO", brand: "Wifi", category: "Wifi", hsn: "85176290", price: null, status: "Active" },
  // Video Door Phone
  { id: 40, name: "G6 Pro Entry", sku: "UVC-G6-Pro-Entry", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 41, name: "G6 Entry", sku: "UVC-G6-Entry", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 42, name: "G3 Reader Pro", sku: "UA-G3-Pro", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 43, name: "G2 Reader Pro", sku: "UA-G2-Pro", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 44, name: "Reader Flex", sku: "UA-G3-Flex", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 45, name: "G3 Reader", sku: "UA-G3", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 46, name: "G2 Reader", sku: "UA-G2", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 47, name: "Retrofit Reader", sku: "UA-Retrofit-Reader", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 48, name: "G3 Intercom", sku: "UA-G3-Intercom", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 49, name: "Intercom", sku: "UA-Intercom", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 50, name: "Access Ultra", sku: "UA-Ultra", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 51, name: "G3 Reader Fingerprint", sku: "UA-G3-Fingerprint", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 52, name: "Retrofit Reader Fingerprint", sku: "UA-Retrofit-Reader-Fingerprint", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 53, name: "Intercom Viewer", sku: "UA-Intercom-Viewer", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 54, name: "Enterprise Access Hub", sku: "EAH-8", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 55, name: "Retrofit Hub", sku: "UA-Retrofit-Hub-2", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 56, name: "Door Hub", sku: "UA-Hub-Door", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 57, name: "Door Hub Mini", sku: "UA-Hub-Door-Mini", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  { id: 58, name: "Gate Hub", sku: "UA-Hub-Gate", brand: "Video Door Phone", category: "Video Door Phone", hsn: "85311090", price: null, status: "Active" },
  // Camera
  { id: 59, name: "G6 Pro Turret", sku: "UVC-G6-Pro-Turret", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 60, name: "G6 Pro Dome", sku: "UVC-G6-Pro-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 61, name: "G6 Turret", sku: "UVC-G6-Turret", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 62, name: "G6 Dome", sku: "UVC-G6-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 63, name: "G6 Pro 360", sku: "UVC-G6-Pro-360", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 64, name: "G6 180", sku: "UVC-G6-180", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 65, name: "AI Multi Sensor 4", sku: "UVC-AI-MS-4", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 66, name: "G5 Turret Ultra", sku: "UVC-G5-Turret-Ultra", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 67, name: "G6 Mini Dome", sku: "UVC-G6-Mini-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 68, name: "AI Turret", sku: "UVC-AI-Turret", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 69, name: "AI Dome", sku: "UVC-AI-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 70, name: "AI 360", sku: "UVC-AI-360", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 71, name: "G5 Dome", sku: "UVC-G5-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 72, name: "G5 Dome Ultra", sku: "UVC-G5-Dome-Ultra", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 73, name: "G6 Edge Turret", sku: "UVC-G6-Edge-Turret", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 74, name: "G6 Edge Dome", sku: "UVC-G6-Edge-Dome", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 75, name: "AI Multi Sensor 2", sku: "UVC-AI-MS-2", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 76, name: "G6 Pro Bullet", sku: "UVC-G6-Pro-Bullet", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 77, name: "G6 Bullet", sku: "UVC-G6-Bullet", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 78, name: "G5 PRO", sku: "UVC-G5-Pro", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 79, name: "G5 Bullet", sku: "UVC-G5-Bullet", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 80, name: "G6 Edge Bullet", sku: "UVC-G6-Edge-Bullet", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 81, name: "G6 Instant", sku: "UVC-G6-INS", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 82, name: "Camera AI Theta Pro", sku: "UVC-AI-Theta-Pro", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  { id: 83, name: "G5 Flex", sku: "UVC-G5-Flex", brand: "Camera", category: "Camera", hsn: "85258900", price: null, status: "Active" },
  // Sensors & Alarms
  { id: 84, name: "Glass Break Sensor", sku: "USL-GlassBreak", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85311090", price: null, status: "Active" },
  { id: 85, name: "Environmental Sensor", sku: "USL-Environmental", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "90258090", price: null, status: "Active" },
  { id: 86, name: "Vape Detection & Air Quality Sensor", sku: "UP-AirQuality", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "90271000", price: null, status: "Active" },
  { id: 87, name: "Relay", sku: "USL-Relay", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "83564900", price: null, status: "Active" },
  { id: 88, name: "Remote Control KeyFob", sku: "USL-FOB", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85269200", price: null, status: "Active" },
  { id: 89, name: "Alarm Hub Kit", sku: "UP-AlaramHub-Kit", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85311090", price: null, status: "Active" },
  { id: 90, name: "Siren PoE", sku: "UP-Siren-PoE", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85311090", price: null, status: "Active" },
  { id: 91, name: "Siren", sku: "USL-Siren", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85311090", price: null, status: "Active" },
  { id: 92, name: "AI Speaker", sku: "UP-AI-Speaker", brand: "Sensors & Alarms", category: "Sensors & Alarms", hsn: "85182100", price: null, status: "Active" },
  // Advance Hosting
  { id: 93, name: "Gateway Fiber", sku: "UXG-Fiber(30W)", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  { id: 94, name: "Gateway Light", sku: "UXG-Lite", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  { id: 95, name: "Gateway Max", sku: "UXG-Max", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  { id: 96, name: "Gateway Pro", sku: "UXG-Pro", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  { id: 97, name: "Cloud Key Enterprise", sku: "CK-Enterprise", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  { id: 98, name: "Cloud Key+", sku: "UCK-G2-SSD", brand: "Advance Hosting", category: "Advance Hosting", hsn: "85176290", price: null, status: "Active" },
  // Managed VoIP
  { id: 99, name: "G3 Touch Enterprise", sku: "UTP-G3-Touch-Enterprise", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 100, name: "G3 Touch Pro", sku: "UTP-G3-Touch-Pro", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 101, name: "G3 Touch Wall", sku: "UTP-G3-Touch-Wall", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 102, name: "G2 Touch Max", sku: "UTP-TouchMax", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 103, name: "G2 Touch", sku: "UTP-Touch", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 104, name: "G3 Wireless Handset", sku: "UT-G3-Handset", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
  { id: 105, name: "Analog Telephone Adapter", sku: "UT-ATA", brand: "Managed VoIP", category: "Managed VoIP", hsn: "85171800", price: null, status: "Active" },
];

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
  nextId: 106,
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
      const newProducts = items.map((p) => ({ ...p, id: id++, category: normalizeCategory(p.category) }));
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
