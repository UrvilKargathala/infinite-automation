"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search as SearchIcon, Ticket as TicketIcon, Briefcase, FileText, Package, UserCog, Users, MessageSquareWarning, Boxes, Truck,
  type LucideIcon,
} from "lucide-react";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useComplaints } from "@/lib/hooks/useComplaints";
import { useKits } from "@/lib/hooks/useKits";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { OPEN_RECORD_EVENT } from "@/lib/hooks/useOpenParam";
import { can } from "@/lib/utils/permissions";

const LIMIT = 4;

interface Hit { id: number; title: string; sub: string }
interface Section {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Page the result opens on. */
  path: string;
  /** True when the page opens `?open=<id>` through the URL on its own; the rest listen via useOpenParam. */
  viaUrl?: boolean;
  /** Procurement opens the PO tab by id, so it needs its own param. */
  hits: Hit[];
}

export function SearchPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const role = useAuthStore((s) => s.user?.role ?? "Purchase");
  const tickets = useTicketStore((s) => s.tickets);
  const projects = useProjectStore((s) => s.projects);
  const quotes = useQuoteStore((s) => s.quotes);
  const products = useProductStore((s) => s.products);
  const users = useUserStore((s) => s.users);
  const customers = useCustomerStore((s) => s.customers);
  const { complaints } = useComplaints();
  const { kits } = useKits();
  const { data: pos = [] } = usePurchaseOrders();

  useEffect(() => {
    inputRef.current?.focus();
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const has = (...parts: (string | null | undefined)[]) => parts.some((p) => (p ?? "").toLowerCase().includes(q));

  const sections = useMemo<Section[]>(() => {
    if (!q) return [];
    const top = <T,>(list: T[], test: (x: T) => boolean, map: (x: T) => Hit) => list.filter(test).slice(0, LIMIT).map(map);
    const all: Section[] = [
      { key: "tickets", label: "Tickets", icon: TicketIcon, path: "/tickets", viaUrl: true,
        hits: top(tickets, (t) => has(t.subject, t.name, t.company), (t) => ({ id: t.id, title: t.subject, sub: `${t.name} · ${t.company}` })) },
      { key: "projects", label: "CRM records", icon: Briefcase, path: "/crm", viaUrl: true,
        hits: top(projects, (p) => has(p.customerName, p.siteAddress), (p) => ({ id: p.id, title: p.customerName, sub: `${p.stage} · ${p.siteAddress}` })) },
      { key: "complaints", label: "Complaints", icon: MessageSquareWarning, path: "/complaints", viaUrl: true,
        hits: top(complaints, (c) => has(c.number, c.customerName, c.phone, c.remarks), (c) => ({ id: c.id, title: `${c.number} · ${c.customerName}`, sub: `${c.status}${c.engineerName ? ` · ${c.engineerName}` : ""}` })) },
      { key: "customers", label: "Customers", icon: Users, path: "/customers",
        hits: top(customers, (c) => has(c.name, c.customerCode, c.email, c.phone), (c) => ({ id: c.id, title: c.name, sub: [c.customerCode, c.email].filter(Boolean).join(" · ") })) },
      { key: "quotes", label: "Quotes", icon: FileText, path: "/quote",
        hits: top(quotes, (qt) => has(qt.number, qt.client), (qt) => ({ id: qt.id, title: qt.client, sub: `${qt.number} · ${qt.status}` })) },
      { key: "products", label: "Products", icon: Package, path: "/master",
        hits: top(products, (p) => has(p.name, p.sku), (p) => ({ id: p.id, title: p.name, sub: p.sku || "—" })) },
      { key: "kits", label: "Kits", icon: Boxes, path: "/master/kits",
        hits: top(kits, (k) => has(k.name, k.sku), (k) => ({ id: k.id, title: k.name, sub: k.sku })) },
      { key: "pos", label: "Vendor POs", icon: Truck, path: "/procurement",
        hits: top(pos, (p) => has(p.number, p.vendorName, p.brand), (p) => ({ id: p.id, title: p.number, sub: `${p.vendorName || p.brand} · ${p.status}` })) },
    ];
    if (can(role, "viewUsers")) {
      all.push({ key: "users", label: "Users", icon: UserCog, path: "/users",
        hits: top(users, (u) => has(u.fullName, u.email), (u) => ({ id: u.id, title: u.fullName, sub: u.email })) });
    }
    return all.filter((s) => s.hits.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tickets, projects, complaints, customers, quotes, products, kits, pos, users, role]);

  const total = sections.reduce((n, s) => n + s.hits.length, 0);

  /** Open the exact record: a URL param for pages that read it themselves, an event when we're already on the page. */
  function open(section: Section, id: number) {
    if (!section.viaUrl && pathname === section.path) window.dispatchEvent(new CustomEvent(OPEN_RECORD_EVENT, { detail: id }));
    else router.push(`${section.path}?open=${id}`);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[360px] max-h-[460px] flex flex-col rounded-2xl glass-pop p-3 z-50"
    >
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
        <input
          ref={inputRef}
          className="w-full glass-control border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
          placeholder="Search records, quotes, customers, products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto mt-2">
        {!q ? (
          <div className="text-center text-text-muted text-sm py-8">Start typing to search</div>
        ) : total === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">No results for &quot;{query}&quot;</div>
        ) : (
          <div className="space-y-3">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key}>
                  <div className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-text-muted mb-1"><Icon size={12} /> {s.label}</div>
                  {s.hits.map((h) => (
                    <button key={h.id} onClick={() => open(s, h.id)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                      <div className="text-sm text-text-primary truncate">{h.title}</div>
                      <div className="text-xs text-text-muted truncate">{h.sub}</div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
