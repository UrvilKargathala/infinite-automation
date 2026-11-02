"use client";

import { useQuery } from "@tanstack/react-query";

export const TICKET_UNREAD_QUERY_KEY = ["ticket-unread"];

/** Unread ticket chat messages per ticket for me: { [ticketId]: count }. Polled so badges appear without a reload. */
export function useTicketUnread(): Record<number, number> {
  const q = useQuery({
    queryKey: TICKET_UNREAD_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/tickets/unread");
      if (!res.ok) throw new Error("Couldn't load unread counts");
      return (await res.json()) as Record<number, number>;
    },
    refetchInterval: 15_000,
  });
  return q.data ?? {};
}
