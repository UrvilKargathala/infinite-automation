import { create } from "zustand";
import { toast } from "sonner";
import type { Project, ProjectStage } from "@/types";

interface ProjectStore {
  projects: Project[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  add: (project: Omit<Project, "id" | "quoteId" | "notes" | "createdAt" | "lastStageChange">) => Promise<void>;
  update: (id: number, patch: Partial<Omit<Project, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setAll: (projects: Project[]) => void;
  updateStage: (id: number, stage: ProjectStage) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loaded: false,
  loading: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const projects = await res.json();
      set({ projects, loaded: true, loading: false });
    } catch {
      set({ loading: false, loaded: true });
      toast.error("Couldn't load projects. Check your connection and try again.");
    }
  },
  add: async (project) => {
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) });
    const created = await res.json();
    set((s) => ({ projects: [...s.projects, created] }));
  },
  update: async (id, patch) => {
    const res = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await res.json();
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }));
  },
  remove: async (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  },
  setAll: (projects) => set({ projects, loaded: true }),
  updateStage: async (id, stage) => {
    const prevStage = get().projects.find((p) => p.id === id)?.stage;
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, stage } : p)) }));
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
      if (!res.ok) throw new Error("Failed to update stage");
      const updated = await res.json();
      set((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }));
    } catch {
      if (prevStage) set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, stage: prevStage } : p)) }));
    }
  },
}));
