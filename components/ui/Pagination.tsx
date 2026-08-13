"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Num } from "@/components/ui/Num";

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: Props) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  function pages(): (number | "...")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) result.push(i);
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }

  if (totalPages <= 1) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <span className="text-xs text-text-muted">Showing <Num>{totalItems}</Num> of <Num>{totalItems}</Num> items</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
      <span className="text-xs text-text-muted">
        Showing <Num>{start}</Num>–<Num>{end}</Num> of <Num>{totalItems}</Num>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-[#F9FAFB] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-muted">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-normal transition-colors ${
                p === page
                  ? "bg-brand-blue text-white"
                  : "text-text-secondary hover:bg-[#F9FAFB]"
              }`}
            >
              <Num>{p}</Num>
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-[#F9FAFB] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
