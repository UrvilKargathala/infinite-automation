"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Complaint, ComplaintEvent } from "@/types";

export const COMPLAINTS_QUERY_KEY = ["complaints"];

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Something went wrong");
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export type ComplaintDraft = { customerName: string; phone: string; remarks: string; engineerId: number };

/** Complaints visible to the signed-in user (admins: all; engineers: theirs), refreshed every 30s. */
export function useComplaints() {
  const q = useQuery({ queryKey: COMPLAINTS_QUERY_KEY, queryFn: () => call<Complaint[]>("/api/complaints"), refetchInterval: 30_000 });
  return { complaints: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}

export function useComplaintEvents(id: number | null) {
  return useQuery({
    queryKey: ["complaint-events", id],
    queryFn: () => call<ComplaintEvent[]>(`/api/complaints/${id}/events`),
    enabled: id != null,
  });
}

/** Create / edit / complete / reopen / delete — each refreshes the list and that complaint's history. */
export function useComplaintActions() {
  const qc = useQueryClient();
  const refresh = (id?: number) => {
    qc.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
    if (id) qc.invalidateQueries({ queryKey: ["complaint-events", id] });
  };
  const onError = (err: Error) => toast.error(err.message);

  const create = useMutation({
    mutationFn: (d: ComplaintDraft) => call<Complaint>("/api/complaints", json("POST", d)),
    onSuccess: (c) => { refresh(c.id); toast.success(`${c.number} raised and assigned to ${c.engineerName}`); },
    onError,
  });
  const edit = useMutation({
    mutationFn: ({ id, ...d }: ComplaintDraft & { id: number }) => call<Complaint>(`/api/complaints/${id}`, json("PATCH", { action: "edit", ...d })),
    onSuccess: (c) => { refresh(c.id); toast.success(`${c.number} updated`); },
    onError,
  });
  const complete = useMutation({
    mutationFn: ({ id, resolution }: { id: number; resolution: string }) => call<Complaint>(`/api/complaints/${id}`, json("PATCH", { action: "complete", resolution })),
    onSuccess: (c) => { refresh(c.id); toast.success(`${c.number} marked completed`); },
    onError,
  });
  const reopen = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => call<Complaint>(`/api/complaints/${id}`, json("PATCH", { action: "reopen", note })),
    onSuccess: (c) => { refresh(c.id); toast.success(`${c.number} reopened`); },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: number) => call<{ ok: true }>(`/api/complaints/${id}`, { method: "DELETE" }),
    onSuccess: () => { refresh(); toast.success("Complaint deleted"); },
    onError,
  });
  return { create, edit, complete, reopen, remove };
}
