import { create } from "zustand";
import type { Lead, LeadStage } from "@/types";

const seedLeads: Lead[] = [
  { id: 1, name: "Rahul Mehta", company: "Mehta Residences", email: "rahul@mehta.in", phone: "+91 98765 43210", segment: "Residential", stage: "New", value: 185000, assigned: "Urvil", lastContact: "2026-08-10" },
  { id: 2, name: "James Cooper", company: "Cooper & Sons Commercial", email: "james@coopersons.com.au", phone: "+61 412 345 678", segment: "Commercial", stage: "New", value: 1250000, assigned: "Henil", lastContact: "2026-08-12" },
  { id: 3, name: "Ananya Sharma", company: "Sharma Smart Homes", email: "ananya@sharmahomes.in", phone: "+91 87654 32109", segment: "Residential", stage: "Qualified", value: 275000, assigned: "Urvil", lastContact: "2026-08-08" },
  { id: 4, name: "David Mitchell", company: "Mitchell Agri Farms", email: "david@mitchellagri.com.au", phone: "+61 423 456 789", segment: "Agriculture", stage: "Qualified", value: 210000, assigned: "Chirag", lastContact: "2026-08-06" },
  { id: 5, name: "Sneha Patel", company: "Patel Holiday Stays", email: "sneha@patelstays.in", phone: "+91 76543 21098", segment: "Short Term Rentals", stage: "Quoted", value: 340000, assigned: "Chirag", lastContact: "2026-08-09" },
  { id: 6, name: "Tom Bradley", company: "Bradley Office Tower", email: "tom@bradleyoffice.com.au", phone: "+61 434 567 890", segment: "Commercial", stage: "Quoted", value: 2100000, assigned: "Urvil", lastContact: "2026-08-07" },
  { id: 7, name: "Vikram Singh", company: "Singh Warehousing", email: "vikram@singhwh.in", phone: "+91 65432 10987", segment: "Commercial", stage: "Won", value: 850000, assigned: "Henil", lastContact: "2026-08-01" },
  { id: 8, name: "Sarah O'Brien", company: "O'Brien BnB Group", email: "sarah@obrienstays.com.au", phone: "+61 445 678 901", segment: "Short Term Rentals", stage: "Won", value: 420000, assigned: "Chirag", lastContact: "2026-07-28" },
  { id: 9, name: "Amit Desai", company: "Desai Irrigation", email: "amit@desaiirr.in", phone: "+91 54321 09876", segment: "Agriculture", stage: "Lost", value: 180000, assigned: "Chirag", lastContact: "2026-07-25" },
  { id: 10, name: "Emily Watson", company: "Watson Smart Living", email: "emily@watsonliving.com.au", phone: "+61 456 789 012", segment: "Residential", stage: "New", value: 195000, assigned: "Urvil", lastContact: "2026-08-11" },
  { id: 11, name: "Kavita Nair", company: "Nair Education Trust", email: "kavita@nairedu.in", phone: "+91 43210 98765", segment: "Commercial", stage: "Quoted", value: 1800000, assigned: "Urvil", lastContact: "2026-08-05" },
  { id: 12, name: "Michael Chen", company: "Chen Vineyards", email: "michael@chenvineyards.com.au", phone: "+61 467 890 123", segment: "Agriculture", stage: "Qualified", value: 290000, assigned: "Urvil", lastContact: "2026-08-04" },
  { id: 13, name: "Deepak Joshi", company: "Joshi Luxury Villas", email: "deepak@joshivillas.in", phone: "+91 32109 87654", segment: "Residential", stage: "Won", value: 310000, assigned: "Henil", lastContact: "2026-07-30" },
  { id: 14, name: "Lisa Taylor", company: "Taylor Co-Working Hub", email: "lisa@taylorcowork.com.au", phone: "+61 478 901 234", segment: "Commercial", stage: "Lost", value: 950000, assigned: "Chirag", lastContact: "2026-07-20" },
];

interface LeadStore {
  leads: Lead[];
  nextId: number;
  add: (lead: Omit<Lead, "id">) => void;
  update: (id: number, patch: Partial<Omit<Lead, "id">>) => void;
  remove: (id: number) => void;
  setAll: (leads: Lead[]) => void;
  moveStage: (id: number, stage: LeadStage) => void;
}

export const useLeadStore = create<LeadStore>((set) => ({
  leads: seedLeads,
  nextId: 15,
  add: (lead) =>
    set((s) => ({ leads: [...s.leads, { ...lead, id: s.nextId }], nextId: s.nextId + 1 })),
  update: (id, patch) =>
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  remove: (id) =>
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
  setAll: (leads) => set({ leads }),
  moveStage: (id, stage) =>
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)) })),
}));
