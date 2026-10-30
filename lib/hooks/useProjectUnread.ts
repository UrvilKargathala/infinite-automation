"use client";

import { useQuery } from "@tanstack/react-query";

export const UNREAD_QUERY_KEY = ["project-unread"];

/** Unread CRM chat messages per record for me: { [projectId]: count }. Polled so badges appear without a reload. */
export function useProjectUnread(): Record<number, number> {
  const q = useQuery({
    queryKey: UNREAD_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/projects/unread");
      if (!res.ok) throw new Error("Couldn't load unread counts");
      return (await res.json()) as Record<number, number>;
    },
    refetchInterval: 15_000,
  });
  return q.data ?? {};
}
