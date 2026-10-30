"use client";

import { useQuery } from "@tanstack/react-query";
import type { PipelineStage } from "@/types";

export const STAGES_QUERY_KEY = ["pipeline-stages"];

async function fetchStages(): Promise<PipelineStage[]> {
  const res = await fetch("/api/pipeline-stages");
  if (!res.ok) throw new Error("Couldn't load CRM stages");
  return res.json();
}

/** CRM pipeline columns in order — the six defaults plus any custom stages. */
export function usePipelineStages() {
  const q = useQuery({ queryKey: STAGES_QUERY_KEY, queryFn: fetchStages, staleTime: 60_000 });
  return { stages: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}
