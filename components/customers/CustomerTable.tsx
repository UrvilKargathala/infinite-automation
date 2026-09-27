"use client";

import { useState } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { Customer, CustomerSegment } from "@/types";

const PAGE_SIZE = 10;

const segmentColors: Record<CustomerSegment, string> = {
  Residential: "#3A90C3",
  Hospitality: "#8B5CF6",
  "Government / Council": "#64748B",
  Retail: "#F59E0B",
  "Healthcare / Aged Care": "#EF4444",
  Industrial: "#44BE4A",
};

interface Props {
  customers: Customer[];
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onDelete: (id: number) => void;
}

export function CustomerTable({ customers, onView, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(customers.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const paged = customers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const thClass = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left";
  const tdClass = "px-4 py-3 text-sm";

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-surface-alt">
              <th className={thClass}>Name</th>
              <th className={thClass}>Segment</th>
              <th className={thClass}>Contact</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Phone</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-text-muted py-12">No customers found</td>
              </tr>
            ) : (
              paged.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-[#F9FAFB]/60 transition-colors cursor-pointer" onClick={() => onView(c)}>
                  <td className={`${tdClass} text-text-primary`}>{c.name}</td>
                  <td className={tdClass}>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
                      style={{ backgroundColor: segmentColors[c.segment] + "18", color: segmentColors[c.segment] }}
                    >
                      {c.segment}
                    </span>
                  </td>
                  <td className={`${tdClass} text-text-secondary`}>{c.contactName || "—"}</td>
                  <td className={`${tdClass} text-text-secondary`}>{c.email || "—"}</td>
                  <td className={`${tdClass} text-text-secondary`}>{c.phone || "—"}</td>
                  <td className={`${tdClass} text-right`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onView(c)} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#F9FAFB] transition-colors" aria-label="View">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => onEdit(c)} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#F9FAFB] transition-colors" aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => onDelete(c.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-[#F9FAFB] transition-colors" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} totalItems={customers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
}
