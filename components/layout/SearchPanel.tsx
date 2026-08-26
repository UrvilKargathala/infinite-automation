"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Users, FileText, Package, UserCog } from "lucide-react";
import { useLeadStore } from "@/lib/store/useLeadStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useUserStore } from "@/lib/store/useUserStore";

const LIMIT = 4;

export function SearchPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const leads = useLeadStore((s) => s.leads);
  const quotes = useQuoteStore((s) => s.quotes);
  const products = useProductStore((s) => s.products);
  const users = useUserStore((s) => s.users);

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

  const leadResults = q
    ? leads.filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)).slice(0, LIMIT)
    : [];
  const quoteResults = q
    ? quotes.filter((qt) => qt.number.toLowerCase().includes(q) || qt.client.toLowerCase().includes(q)).slice(0, LIMIT)
    : [];
  const productResults = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, LIMIT)
    : [];
  const userResults = q
    ? users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, LIMIT)
    : [];

  const totalResults = leadResults.length + quoteResults.length + productResults.length + userResults.length;

  function go(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[360px] max-h-[460px] flex flex-col rounded-2xl bg-white shadow-dropdown p-3 z-50"
    >
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          ref={inputRef}
          className="w-full bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
          placeholder="Search leads, quotes, products, users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto mt-2">
        {!q ? (
          <div className="text-center text-text-muted text-sm py-8">Start typing to search</div>
        ) : totalResults === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">No results for &quot;{query}&quot;</div>
        ) : (
          <div className="space-y-3">
            {leadResults.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-text-muted mb-1"><Users size={12} /> Leads</div>
                {leadResults.map((l) => (
                  <button key={l.id} onClick={() => go("/crm")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="text-sm text-text-primary">{l.name}</div>
                    <div className="text-xs text-text-muted">{l.company}</div>
                  </button>
                ))}
              </div>
            )}
            {quoteResults.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-text-muted mb-1"><FileText size={12} /> Quotes</div>
                {quoteResults.map((qt) => (
                  <button key={qt.id} onClick={() => go("/quote")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="text-sm text-text-primary">{qt.client}</div>
                    <div className="text-xs text-text-muted font-mono">{qt.number}</div>
                  </button>
                ))}
              </div>
            )}
            {productResults.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-text-muted mb-1"><Package size={12} /> Products</div>
                {productResults.map((p) => (
                  <button key={p.id} onClick={() => go("/master")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="text-sm text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-muted font-mono">{p.sku || "—"}</div>
                  </button>
                ))}
              </div>
            )}
            {userResults.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-text-muted mb-1"><UserCog size={12} /> Users</div>
                {userResults.map((u) => (
                  <button key={u.id} onClick={() => go("/users")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="text-sm text-text-primary">{u.fullName}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
