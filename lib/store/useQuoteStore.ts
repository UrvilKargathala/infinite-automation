import { create } from "zustand";
import type { Quote } from "@/types";

const seedQuotes: Quote[] = [
  {
    id: 1, number: "IA-Q-2026-001", clientId: 3, client: "Sharma Smart Homes", date: "2026-08-01", validUntil: "2026-08-31", status: "Draft",
    sections: [
      { id: "s1a", name: "Ground Floor", items: [
        { id: "i1a1", productId: 1, name: "4-Gang Smart Switch", brand: "Infinite AUS", qty: 6, price: 4500, discount: 0 },
        { id: "i1a2", productId: 3, name: "Dimmer Module 2CH", brand: "Infinite AUS", qty: 4, price: 3800, discount: 5 },
        { id: "i1a3", productId: 25, name: "Motion Sensor PIR", brand: "Sensors & Alarms", qty: 3, price: 1800, discount: 0 },
      ]},
      { id: "s1b", name: "First Floor", items: [
        { id: "i1b1", productId: 2, name: "8-Gang Smart Switch", brand: "Infinite AUS", qty: 4, price: 7200, discount: 0 },
        { id: "i1b2", productId: 7, name: "Curtain Motor 45W", brand: "Infinite AUS", qty: 3, price: 8900, discount: 10 },
      ]},
      { id: "s1c", name: "Outdoor", items: [
        { id: "i1c1", productId: 18, name: "G5 Turret Ultra", brand: "Camera", qty: 4, price: 22000, discount: 0 },
        { id: "i1c2", productId: 20, name: "G4 Bullet Camera", brand: "Camera", qty: 2, price: 14200, discount: 0 },
      ]},
    ],
  },
  {
    id: 2, number: "IA-Q-2026-002", clientId: 6, client: "Bradley Office Tower", date: "2026-08-03", validUntil: "2026-09-02", status: "Sent",
    sections: [
      { id: "s2a", name: "Reception & Lobby", items: [
        { id: "i2a1", productId: 15, name: "U7 Pro Access Point", brand: "Wifi", qty: 6, price: 18500, discount: 5 },
        { id: "i2a2", productId: 23, name: "7-inch Intercom Panel", brand: "Video Door Phone", qty: 2, price: 15000, discount: 0 },
        { id: "i2a3", productId: 22, name: "NFC Card Reader", brand: "Video Door Phone", qty: 4, price: 4800, discount: 0 },
      ]},
      { id: "s2b", name: "Office Floors", items: [
        { id: "i2b1", productId: 16, name: "U6 Lite Access Point", brand: "Wifi", qty: 12, price: 9800, discount: 10 },
        { id: "i2b2", productId: 6, name: "Split AC Controller", brand: "Infinite AUS", qty: 8, price: 5200, discount: 0 },
      ]},
    ],
  },
  {
    id: 3, number: "IA-Q-2026-003", clientId: 5, client: "Patel Holiday Stays", date: "2026-08-05", validUntil: "2026-09-04", status: "Accepted",
    sections: [
      { id: "s3a", name: "Living Area", items: [
        { id: "i3a1", productId: 1, name: "4-Gang Smart Switch", brand: "Infinite AUS", qty: 8, price: 4500, discount: 0 },
        { id: "i3a2", productId: 8, name: "IR Blaster Pro", brand: "Infinite AUS", qty: 4, price: 2200, discount: 0 },
        { id: "i3a3", productId: 12, name: "Smart Door Lock E200", brand: "Electrical Product", qty: 3, price: 12500, discount: 5 },
      ]},
      { id: "s3b", name: "Security", items: [
        { id: "i3b1", productId: 19, name: "G4 Dome Camera", brand: "Camera", qty: 6, price: 16500, discount: 0 },
        { id: "i3b2", productId: 27, name: "Alarm Hub Central", brand: "Sensors & Alarms", qty: 1, price: 9500, discount: 0 },
      ]},
    ],
  },
  {
    id: 4, number: "IA-Q-2026-004", clientId: 4, client: "Mitchell Agri Farms", date: "2026-07-20", validUntil: "2026-08-19", status: "Rejected",
    sections: [
      { id: "s4a", name: "Farm Office", items: [
        { id: "i4a1", productId: 28, name: "UDM Pro Gateway", brand: "Advance Hosting", qty: 1, price: 35000, discount: 0 },
        { id: "i4a2", productId: 15, name: "U7 Pro Access Point", brand: "Wifi", qty: 3, price: 18500, discount: 0 },
      ]},
    ],
  },
  {
    id: 5, number: "IA-Q-2026-005", clientId: 7, client: "Singh Warehousing", date: "2026-08-10", validUntil: "2026-09-09", status: "Draft",
    sections: [
      { id: "s5a", name: "Warehouse Floor", items: [
        { id: "i5a1", productId: 21, name: "AI Camera 360", brand: "Camera", qty: 8, price: 28000, discount: 5 },
        { id: "i5a2", productId: 13, name: "Zigbee Smart Bulb 9W", brand: "Electrical Product", qty: 50, price: 850, discount: 10 },
      ]},
      { id: "s5b", name: "Loading Dock", items: [
        { id: "i5b1", productId: 20, name: "G4 Bullet Camera", brand: "Camera", qty: 4, price: 14200, discount: 0 },
        { id: "i5b2", productId: 26, name: "Flood Sensor", brand: "Sensors & Alarms", qty: 6, price: 2200, discount: 0 },
      ]},
    ],
  },
];

interface QuoteStore {
  quotes: Quote[];
  nextId: number;
  nextSeq: number;
  add: (q: Omit<Quote, "id" | "number">) => void;
  update: (id: number, patch: Partial<Quote>) => void;
  remove: (id: number) => void;
  setAll: (quotes: Quote[]) => void;
}

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: seedQuotes,
  nextId: 6,
  nextSeq: 6,
  add: (q) => {
    const { nextId, nextSeq } = get();
    const year = new Date().getFullYear();
    const number = `IA-Q-${year}-${String(nextSeq).padStart(3, "0")}`;
    set((s) => ({
      quotes: [...s.quotes, { ...q, id: nextId, number }],
      nextId: nextId + 1,
      nextSeq: nextSeq + 1,
    }));
  },
  update: (id, patch) =>
    set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
  remove: (id) =>
    set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
  setAll: (quotes) => set({ quotes }),
}));
