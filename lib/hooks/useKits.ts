"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Kit, KitInput } from "@/types";

export const KITS_QUERY_KEY = ["kits"];

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Something went wrong");
  return body as T;
}
const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export function useKits() {
  const q = useQuery({ queryKey: KITS_QUERY_KEY, queryFn: () => call<Kit[]>("/api/kits") });
  return { kits: q.data ?? [], isLoading: q.isLoading };
}

export function useKitActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: KITS_QUERY_KEY });
  const onError = (e: Error) => toast.error(e.message);
  return {
    create: useMutation({ mutationFn: (k: KitInput) => call<Kit>("/api/kits", json("POST", k)), onSuccess: (k) => { refresh(); toast.success(`Kit ${k.name} created`); }, onError }),
    update: useMutation({ mutationFn: ({ id, ...k }: KitInput & { id: number }) => call<Kit>(`/api/kits/${id}`, json("PATCH", k)), onSuccess: (k) => { refresh(); toast.success(`Kit ${k.name} saved`); }, onError }),
    remove: useMutation({ mutationFn: (id: number) => call(`/api/kits/${id}`, { method: "DELETE" }), onSuccess: () => { refresh(); toast.success("Kit deleted"); }, onError }),
    importKits: useMutation({
      mutationFn: (kits: unknown[]) => call<{ imported: number; skipped: { sku: string; reason: string }[] }>("/api/kits/import", json("POST", { kits })),
      onSuccess: () => refresh(),
      onError,
    }),
  };
}
