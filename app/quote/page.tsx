"use client";

import { useState, useMemo } from "react";
import { Search, FileText, Send, CheckCircle, XCircle, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuoteModal } from "@/components/quote/QuoteModal";
import { formatINR } from "@/lib/utils/format";
import { calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote, QuoteStatus } from "@/types";

const statusConfig: Record<QuoteStatus, { color: string; icon: typeof FileText }> = {
  Draft: { color: "#64748B", icon: FileText },
  Sent: { color: "#3B82F6", icon: Send },
  Accepted: { color: "#10B981", icon: CheckCircle },
  Rejected: { color: "#EF4444", icon: XCircle },
};

export default function QuotePage() {
  const { quotes, remove } = useQuoteStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const filtered = useMemo(() => {
    let list = quotes;
    if (statusFilter) list = list.filter((q) => q.status === statusFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.number.toLowerCase().includes(s) ||
          q.client.toLowerCase().includes(s)
      );
    }
    return list;
  }, [quotes, statusFilter, search]);

  const stats = [
    { label: "Total quotes", value: quotes.length, icon: FileText, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Draft", value: quotes.filter((q) => q.status === "Draft").length, icon: FileText, bg: "bg-[#64748B18]", accent: "#64748B" },
    { label: "Accepted", value: quotes.filter((q) => q.status === "Accepted").length, icon: CheckCircle, valueClass: "text-success", bg: "bg-[#10B98118]", accent: "#10B981" },
    { label: "Rejected", value: quotes.filter((q) => q.status === "Rejected").length, icon: XCircle, valueClass: "text-danger", bg: "bg-[#EF444418]", accent: "#EF4444" },
  ];

  function openEdit(q: Quote) {
    setEditQuote(q);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(q: Quote) {
    setEditQuote(q);
    setViewMode(true);
    setModalOpen(true);
  }

  function handleDelete(id: number) {
    if (window.confirm("Delete this quote?")) remove(id);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">Quotes</h1>
      <p className="text-sm text-text-secondary mt-1">Manage and track all quotations</p>

      <div className="grid grid-cols-4 gap-4 mt-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl shadow-card p-5 flex items-center justify-between ${s.bg}`} style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div>
              <div className="text-xs text-text-muted">{s.label}</div>
              <div className={`text-3xl font-light mt-1 ${s.valueClass ?? "text-text-primary"}`}>{s.value}</div>
            </div>
            <IconTile icon={s.icon} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden mt-6">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <div className="ml-auto">
            <Button icon={Plus} onClick={() => { setEditQuote(null); setViewMode(false); setModalOpen(true); }}>
              New quote
            </Button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-surface-alt">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Quote #</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Client</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Date</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Valid Until</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Amount</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Status</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-text-muted py-12">No quotes found</td>
              </tr>
            ) : (
              filtered.map((q) => {
                const { grandTotal } = calcQuoteTotal(q);
                const sc = statusConfig[q.status];
                return (
                  <tr key={q.id} className="border-t border-border hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-brand-blue">{q.number}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{q.client}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{q.date}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{q.validUntil}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{formatINR(grandTotal)}</td>
                    <td className="px-4 py-3"><Badge color={sc.color}>{q.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(q)} className="p-1.5 rounded-lg text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary transition-colors" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary transition-colors" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-[#F9FAFB] hover:text-danger transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <QuoteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditQuote(null); setViewMode(false); }}
        quote={editQuote}
        viewMode={viewMode}
      />
    </div>
  );
}
