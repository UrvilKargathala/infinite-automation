"use client";

import { useMemo } from "react";
import { Inbox, MessageCircle, MessageSquareWarning, Package, ScrollText, FileText, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useComplaints } from "@/lib/hooks/useComplaints";
import { useProjectUnread } from "@/lib/hooks/useProjectUnread";
import { useTicketUnread } from "@/lib/hooks/useTicketUnread";
import { useStock } from "@/lib/hooks/useStock";
import { useAuditUnreadCount } from "@/lib/hooks/useAuditUnreadCount";
import { daysUntil } from "@/lib/utils/dashboardMetrics";
import { can } from "@/lib/utils/permissions";

export interface AttentionRow {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  count: number;
  /** Colour of the count pill when it's above zero. */
  tone: "warn" | "danger" | "info";
  /** Still loading, so the count isn't known yet. */
  loading?: boolean;
}

/** Quotes this close to (or past) their valid-until date need a follow-up. */
const QUOTE_FOLLOW_UP_DAYS = 7;

/**
 * "Needs attention": live counts of things waiting on the signed-in user, one row per module. They're worked out from
 * data the app already holds (or polls), not stored — so a count drops the moment the work is done.
 */
export function useAttention(): { rows: AttentionRow[]; total: number; markAuditViewed: () => void } {
  const role = useAuthStore((s) => s.user?.role ?? "Purchase");
  const isAdmin = can(role, "manageComplaints");
  const { complaints, isLoading: complaintsLoading } = useComplaints();
  const unread = useProjectUnread();
  const ticketUnread = useTicketUnread();
  const tickets = useTicketStore((s) => s.tickets);
  const quotes = useQuoteStore((s) => s.quotes);
  const { byProduct, isLoading: stockLoading } = useStock();
  const audit = useAuditUnreadCount();

  const rows = useMemo<AttentionRow[]>(() => {
    const pendingComplaints = complaints.filter((c) => c.status === "Pending").length;
    const unreadChats = Object.values(unread).reduce((sum, n) => sum + n, 0);
    const unreadTicketChats = Object.values(ticketUnread).reduce((sum, n) => sum + n, 0);
    const openTickets = tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;
    const open = quotes.filter((q) => q.status === "Draft" || q.status === "Sent").map((q) => daysUntil(q.validUntil));
    const expired = open.filter((d) => d < 0).length;
    const followUps = open.filter((d) => d <= QUOTE_FOLLOW_UP_DAYS).length;
    const toReorder = [...byProduct.values()].filter((s) => s.low).length;

    const list: AttentionRow[] = [
      { key: "complaints", label: isAdmin ? "Pending complaints" : "Complaints assigned to you", icon: MessageSquareWarning, href: "/complaints", count: pendingComplaints, tone: "warn", loading: complaintsLoading },
      { key: "crm", label: "Unread CRM chats", icon: MessageCircle, href: "/crm", count: unreadChats, tone: "info" },
      { key: "ticketChats", label: "Unread ticket chats", icon: MessageCircle, href: "/tickets", count: unreadTicketChats, tone: "info" },
      { key: "tickets", label: "Open tickets", icon: Inbox, href: "/tickets", count: openTickets, tone: "warn" },
      { key: "quotes", label: "Quotes to follow up", icon: FileText, href: "/quote", count: followUps, tone: expired > 0 ? "danger" : "warn" },
      { key: "procurement", label: "Items to reorder", icon: Package, href: "/procurement", count: toReorder, tone: "warn", loading: stockLoading },
    ];
    if (audit.canView) list.push({ key: "audit", label: "New audit log entries", icon: ScrollText, href: "/audit", count: audit.count, tone: "info" });
    return list;
  }, [complaints, complaintsLoading, unread, ticketUnread, tickets, quotes, byProduct, stockLoading, isAdmin, audit.canView, audit.count]);

  // Audit entries are activity to browse, not work waiting on you, so they don't add to the headline total.
  const total = rows.filter((r) => r.key !== "audit").reduce((sum, r) => sum + r.count, 0);
  return { rows, total, markAuditViewed: audit.markViewed };
}
