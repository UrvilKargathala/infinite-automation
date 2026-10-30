import type { PipelineStage, ProjectStage } from "@/types";

// The CRM pipeline is data (pipeline_stages). These names are the fixed defaults the app reasons about;
// custom stages slot in between them and are grouped by position.
export const STAGE_INQUIRY = "Inquiry";
export const STAGE_CONFIRM_ORDER = "Confirm Order";
/** Cancelled is a status, not a column — reachable from any stage. */
export const CANCELLED: ProjectStage = "Cancelled";
export const CANCELLED_COLOR = "#EF4444";

/** Colours handed to custom stages in turn. */
export const CUSTOM_STAGE_COLORS = ["#0EA5E9", "#EC4899", "#14B8A6", "#EAB308", "#6366F1", "#84CC16", "#A855F7", "#64748B"];

export function stageColor(stages: PipelineStage[], name: ProjectStage): string {
  if (name === CANCELLED) return CANCELLED_COLOR;
  return stages.find((s) => s.name === name)?.color ?? "#94A3B8";
}

export type StagePhase = "inquiry" | "preSale" | "delivery" | "done" | "cancelled";

/**
 * Where a stage sits in the funnel, by position: Inquiry → pre-sale (before Confirm Order) →
 * delivery (Confirm Order up to the last stage) → done (the last stage — Install by default).
 */
export function stagePhase(stages: PipelineStage[], name: ProjectStage): StagePhase {
  if (name === CANCELLED) return "cancelled";
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const idx = ordered.findIndex((s) => s.name === name);
  if (idx <= 0) return "inquiry";
  if (idx === ordered.length - 1) return "done";
  const confirmIdx = ordered.findIndex((s) => s.name === STAGE_CONFIRM_ORDER);
  return confirmIdx >= 0 && idx < confirmIdx ? "preSale" : "delivery";
}
