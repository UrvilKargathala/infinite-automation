"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, MapPin, Ticket as TicketIcon, Layers, FileText } from "lucide-react";
import type { Customer, CustomerSegment } from "@/types";

const segmentColors: Record<CustomerSegment, string> = {
  Residential: "#3A90C3",
  Hospitality: "#8B5CF6",
  "Government / Council": "#64748B",
  Retail: "#F59E0B",
  "Healthcare / Aged Care": "#EF4444",
  Industrial: "#44BE4A",
};

interface LinkedData extends Customer {
  tickets: { id: number; subject: string; status: string; priority: string }[];
  projects: { id: number; siteAddress: string; stage: string }[];
  quotes: { id: number; number: string; status: string; currency: string }[];
}

export function CustomerDetailPanel({ customerId, onClose }: { customerId: number | null; onClose: () => void }) {
  const [data, setData] = useState<LinkedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId == null) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/customers/${customerId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (customerId == null) return null;

  const rowClass = "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#F9FAFB]";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:w-[420px] h-full shadow-modal flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
          <span className="text-sm text-text-primary">Customer</span>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F9FAFB]">
            <X size={16} />
          </button>
        </div>

        {loading || !data ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div>
              <div className="text-lg text-text-primary">{data.name}</div>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs mt-2"
                style={{ backgroundColor: segmentColors[data.segment] + "18", color: segmentColors[data.segment] }}
              >
                {data.segment}
              </span>
            </div>

            <div className="space-y-2">
              {data.contactName && <div className="text-sm text-text-secondary">{data.contactName}</div>}
              {data.email && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail size={14} className="text-text-muted shrink-0" /> {data.email}
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone size={14} className="text-text-muted shrink-0" /> {data.phone}
                </div>
              )}
              {data.address && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={14} className="text-text-muted shrink-0" /> {data.address}
                </div>
              )}
              {data.notes && <div className="text-sm text-text-muted italic mt-2">{data.notes}</div>}
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted mb-2">
                <TicketIcon size={12} /> Tickets ({data.tickets.length})
              </div>
              <div className="space-y-1.5">
                {data.tickets.length === 0 ? (
                  <div className="text-xs text-text-muted py-2">No tickets yet</div>
                ) : (
                  data.tickets.map((t) => (
                    <div key={t.id} className={rowClass}>
                      <span className="text-sm text-text-primary truncate">{t.subject}</span>
                      <span className="text-xs text-text-muted shrink-0">{t.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted mb-2">
                <Layers size={12} /> Projects ({data.projects.length})
              </div>
              <div className="space-y-1.5">
                {data.projects.length === 0 ? (
                  <div className="text-xs text-text-muted py-2">No projects yet</div>
                ) : (
                  data.projects.map((p) => (
                    <div key={p.id} className={rowClass}>
                      <span className="text-sm text-text-primary truncate">{p.siteAddress || "—"}</span>
                      <span className="text-xs text-text-muted shrink-0">{p.stage}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted mb-2">
                <FileText size={12} /> Quotes ({data.quotes.length})
              </div>
              <div className="space-y-1.5">
                {data.quotes.length === 0 ? (
                  <div className="text-xs text-text-muted py-2">No quotes yet</div>
                ) : (
                  data.quotes.map((q) => (
                    <div key={q.id} className={rowClass}>
                      <span className="text-sm text-brand-blue font-mono truncate">{q.number}</span>
                      <span className="text-xs text-text-muted shrink-0">{q.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
