"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { INR } from "@/components/ui/INR";
import { Num } from "@/components/ui/Num";
import { Pagination } from "@/components/ui/Pagination";
import type { Product } from "@/types";

const PAGE_SIZE = 10;

interface Props {
  products: Product[];
  total: number;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ products, total, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const paged = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const thClass = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left";
  const tdClass = "px-4 py-3 text-sm";

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-surface-alt">
              <th className={thClass}>Sr.</th>
              <th className={thClass}>Product name</th>
              <th className={thClass}>SKU</th>
              <th className={thClass}>Brand</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>HSN Code</th>
              <th className={thClass}>Price (INR)</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-text-muted py-12">
                  No products found
                </td>
              </tr>
            ) : (
              paged.map((p, i) => (
                <tr key={p.id} className="border-t border-border hover:bg-[#F9FAFB]/60">
                  <td className={tdClass}><Num>{(safePage - 1) * PAGE_SIZE + i + 1}</Num></td>
                  <td className={`${tdClass} text-text-primary`}>{p.name}</td>
                  <td className={`${tdClass} font-mono text-xs text-brand-blue`}>{p.sku}</td>
                  <td className={tdClass}>{p.brand}</td>
                  <td className={tdClass}>{p.category}</td>
                  <td className={`${tdClass} font-mono text-xs text-text-secondary`}><Num>{p.hsn || "—"}</Num></td>
                  <td className={tdClass}>
                    {p.price != null ? (
                      <INR value={p.price} />
                    ) : (
                      <span className="text-warning">Not set</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: (p.status === "Active" ? "#10B981" : "#94A3B8") + "18",
                        color: p.status === "Active" ? "#10B981" : "#94A3B8",
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#F9FAFB] transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(p.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-[#F9FAFB] transition-colors"
                        aria-label="Delete"
                      >
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
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={products.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </>
  );
}
