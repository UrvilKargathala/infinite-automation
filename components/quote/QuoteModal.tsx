"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, GripVertical, Printer } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useLeadStore } from "@/lib/store/useLeadStore";
import { formatINR } from "@/lib/utils/format";
import { calcLineTotal, calcSectionSubtotal, calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote, Section, QuoteItem, QuoteStatus } from "@/types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptySection(): Section {
  return { id: uid(), name: "", items: [] };
}

function emptyQuoteDraft(): Omit<Quote, "id" | "number"> {
  const today = new Date().toISOString().slice(0, 10);
  const valid = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return { clientId: null, client: "", date: today, validUntil: valid, status: "Draft", sections: [emptySection()] };
}

export function QuoteModal({
  open,
  onClose,
  quote,
  viewMode = false,
}: {
  open: boolean;
  onClose: () => void;
  quote: Quote | null;
  viewMode?: boolean;
}) {
  const { add, update } = useQuoteStore();
  const products = useProductStore((s) => s.products);
  const leads = useLeadStore((s) => s.leads);
  const brands = useProductStore((s) => s.brands);
  const categoriesByBrand = useProductStore((s) => s.categoriesByBrand);
  const productsByBrandCategory = useProductStore((s) => s.productsByBrandCategory);

  const [draft, setDraft] = useState<Omit<Quote, "id" | "number">>(emptyQuoteDraft());

  useEffect(() => {
    if (!open) return;
    if (quote) {
      const { id: _id, number: _n, ...rest } = quote;
      setDraft(JSON.parse(JSON.stringify(rest)));
    } else {
      setDraft(emptyQuoteDraft());
    }
  }, [open, quote]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totals = useMemo(() => calcQuoteTotal({ ...draft, id: 0, number: "" } as Quote), [draft]);

  function patchDraft(p: Partial<typeof draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function updateSection(sectionId: string, patch: Partial<Section>) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    }));
  }

  function removeSection(sectionId: string) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.filter((s) => s.id !== sectionId),
    }));
  }

  function addItemToSection(sectionId: string, item: QuoteItem) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, item] } : s
      ),
    }));
  }

  function updateItem(sectionId: string, itemId: string, patch: Partial<QuoteItem>) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : s
      ),
    }));
  }

  function removeItem(sectionId: string, itemId: string) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      ),
    }));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setDraft((d) => {
      const oldIdx = d.sections.findIndex((s) => s.id === active.id);
      const newIdx = d.sections.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return d;
      return { ...d, sections: arrayMove(d.sections, oldIdx, newIdx) };
    });
  }

  function handleSave() {
    if (!draft.client.trim()) return;
    if (quote) {
      update(quote.id, draft);
    } else {
      add(draft);
    }
    onClose();
  }

  function handlePrint() {
    const q = quote ? { ...quote, ...draft } : { ...draft, id: 0, number: "PREVIEW" } as Quote;
    const t = calcQuoteTotal(q);
    let sectionRows = "";
    q.sections.forEach((sec, si) => {
      const sn = si + 1;
      sectionRows += `<tr class="sec-header"><td colspan="6" style="background:#3A90C3;color:#fff;padding:10px 12px;font-weight:400;">${sn}. ${sec.name || "Untitled Section"}</td></tr>`;
      sec.items.forEach((item, ii) => {
        const lt = calcLineTotal(item.qty, item.price, item.discount);
        sectionRows += `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;">${sn}.${ii + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;">${item.name} - ${products.find((p) => p.id === item.productId)?.sku ?? "N/A"} (${item.qty} PCS)</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;">${formatINR(item.price)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:center;">${item.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:center;">${item.discount}%</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;">${formatINR(lt)}</td>
        </tr>`;
      });
    });
    const html = `<!DOCTYPE html><html><head><title>Quote ${q.number}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Barlow',Arial,sans-serif;font-weight:400;color:#0F172A;padding:40px}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #3A90C3;margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:14px}th{background:#F9FAFB;padding:10px 12px;text-align:left;font-weight:400;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;color:#64748B}
.totals{margin-top:24px;text-align:right}.totals .row{margin:4px 0;font-size:14px}.totals .grand{font-size:20px;font-weight:300;color:#44BE4A;margin-top:8px}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><div><div style="font-size:24px;font-weight:300">Infinite Automation</div><div style="font-size:12px;color:#64748B;margin-top:4px">Smart Home & Building Automation</div></div>
<div style="text-align:right"><div style="font-size:18px;font-weight:300">${q.number}</div><div style="font-size:12px;color:#64748B;margin-top:4px">Date: ${q.date}</div><div style="font-size:12px;color:#64748B">Valid until: ${q.validUntil}</div></div></div>
<div style="margin-bottom:24px"><div style="font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Client</div><div style="font-size:16px">${q.client}</div></div>
<table><thead><tr><th>Sr.</th><th>Description</th><th style="text-align:right">Price</th><th style="text-align:center">Qty</th><th style="text-align:center">Disc.</th><th style="text-align:right">Total</th></tr></thead><tbody>${sectionRows}</tbody></table>
<div class="totals"><div class="row">Subtotal: ${formatINR(t.subtotal)}</div><div class="row">GST (18%): ${formatINR(t.gst)}</div><div class="grand">Grand Total: ${formatINR(t.grandTotal)}</div></div>
<script>window.onload=function(){window.print()}<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }

  const isEditing = !viewMode;
  const title = viewMode
    ? `Quote ${quote?.number ?? ""}`
    : quote
    ? `Edit ${quote.number}`
    : "New Quote";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>{title}</span>
          {quote && <Badge color={statusConfig(quote.status)}>{quote.status}</Badge>}
        </div>
      }
      maxWidth="max-w-6xl"
      footer={
        isEditing ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print / PDF</Button>
            <Button onClick={handleSave} disabled={!draft.client.trim()}>
              {quote ? "Save changes" : "Create quote"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print / PDF</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      {/* Header fields */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-primary mb-1">Client</label>
          {isEditing ? (
            <select
              className="w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
              value={draft.clientId ?? ""}
              onChange={(e) => {
                const lid = Number(e.target.value);
                const lead = leads.find((l) => l.id === lid);
                patchDraft({ clientId: lid || null, client: lead?.company ?? "" });
              }}
            >
              <option value="">Select client...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.company}</option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-text-primary py-2.5">{draft.client}</div>
          )}
        </div>
        <Input label="Date" type="date" value={draft.date} onChange={(e) => patchDraft({ date: e.target.value })} disabled={!isEditing} />
        <Input label="Valid Until" type="date" value={draft.validUntil} onChange={(e) => patchDraft({ validUntil: e.target.value })} disabled={!isEditing} />
        <div>
          <label className="block text-sm text-text-primary mb-1">Status</label>
          {isEditing ? (
            <select
              className="w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
              value={draft.status}
              onChange={(e) => patchDraft({ status: e.target.value as QuoteStatus })}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          ) : (
            <div className="py-2.5"><Badge color={statusColor(draft.status)}>{draft.status}</Badge></div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {draft.sections.map((section, si) => (
              <SortableSection
                key={section.id}
                section={section}
                sectionIndex={si}
                isEditing={isEditing}
                allBrands={brands()}
                categoriesByBrand={categoriesByBrand}
                productsByBrandCategory={productsByBrandCategory}
                onUpdateSection={(p) => updateSection(section.id, p)}
                onRemoveSection={() => removeSection(section.id)}
                onAddItem={(item) => addItemToSection(section.id, item)}
                onUpdateItem={(itemId, p) => updateItem(section.id, itemId, p)}
                onRemoveItem={(itemId) => removeItem(section.id, itemId)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isEditing && (
          <button
            onClick={() => patchDraft({ sections: [...draft.sections, emptySection()] })}
            className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-sm text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add section
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Subtotal</span><span className="text-text-primary">{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>GST (18%)</span><span className="text-text-primary">{formatINR(totals.gst)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-lg text-text-primary">
            <span>Grand Total</span><span className="font-light">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const STATUS_COLORS: Record<QuoteStatus, string> = {
  Draft: "#64748B",
  Sent: "#3B82F6",
  Accepted: "#10B981",
  Rejected: "#EF4444",
};

function statusColor(s: QuoteStatus) { return STATUS_COLORS[s]; }
function statusConfig(s: QuoteStatus) { return STATUS_COLORS[s]; }

function SortableSection({
  section,
  sectionIndex,
  isEditing,
  allBrands,
  categoriesByBrand,
  productsByBrandCategory,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: {
  section: Section;
  sectionIndex: number;
  isEditing: boolean;
  allBrands: string[];
  categoriesByBrand: (b: string) => string[];
  productsByBrandCategory: (b: string, c: string) => import("@/types").Product[];
  onUpdateSection: (p: Partial<Section>) => void;
  onRemoveSection: () => void;
  onAddItem: (item: QuoteItem) => void;
  onUpdateItem: (itemId: string, p: Partial<QuoteItem>) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const [pickerBrand, setPickerBrand] = useState("");
  const [pickerCat, setPickerCat] = useState("");
  const [pickerProduct, setPickerProduct] = useState("");

  const sn = sectionIndex + 1;
  const subtotal = calcSectionSubtotal(section);
  const cats = pickerBrand ? categoriesByBrand(pickerBrand) : [];
  const prods = pickerBrand && pickerCat ? productsByBrandCategory(pickerBrand, pickerCat).filter((p) => p.status === "Active") : [];

  function handleAdd() {
    const prod = prods.find((p) => String(p.id) === pickerProduct);
    if (!prod) return;
    onAddItem({
      id: uid(),
      productId: prod.id,
      name: prod.name,
      brand: prod.brand,
      qty: 1,
      price: prod.price ?? 0,
      discount: 0,
    });
    setPickerBrand("");
    setPickerCat("");
    setPickerProduct("");
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-2xl shadow-card p-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        {isEditing && (
          <button {...attributes} {...listeners} className="cursor-grab text-text-muted hover:text-text-secondary">
            <GripVertical size={18} />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-brand-gradient grid place-items-center text-white text-sm shrink-0">
          {sn}
        </div>
        {isEditing ? (
          <input
            className="flex-1 text-lg text-text-primary bg-transparent border-none outline-none placeholder:text-text-muted"
            placeholder="Section name..."
            value={section.name}
            onChange={(e) => onUpdateSection({ name: e.target.value })}
          />
        ) : (
          <span className="flex-1 text-lg text-text-primary">{section.name || "Untitled Section"}</span>
        )}
        <span className="text-sm text-text-secondary">{formatINR(subtotal)}</span>
        {isEditing && (
          <button
            onClick={onRemoveSection}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Cascading picker */}
      {isEditing && (
        <div className="flex gap-2 items-end mb-4">
          <div className="flex-1">
            <select
              className="w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
              value={pickerBrand}
              onChange={(e) => { setPickerBrand(e.target.value); setPickerCat(""); setPickerProduct(""); }}
            >
              <option value="">Choose brand</option>
              {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <select
              className="w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors disabled:opacity-50"
              value={pickerCat}
              onChange={(e) => { setPickerCat(e.target.value); setPickerProduct(""); }}
              disabled={!pickerBrand}
            >
              <option value="">Choose category</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <select
              className="w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors disabled:opacity-50"
              value={pickerProduct}
              onChange={(e) => setPickerProduct(e.target.value)}
              disabled={!pickerCat}
            >
              <option value="">Choose product</option>
              {prods.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatINR(p.price)}</option>
              ))}
            </select>
          </div>
          <Button icon={Plus} disabled={!pickerProduct} onClick={handleAdd} className="shrink-0">Add</Button>
        </div>
      )}

      {/* Items table */}
      {section.items.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="bg-surface-alt">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-muted font-normal w-16">Sr.</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-muted font-normal">Product</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-muted font-normal w-20">Brand</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-muted font-normal w-24">Price</th>
              <th className="px-3 py-2 text-center text-xs uppercase tracking-wider text-text-muted font-normal w-16">Qty</th>
              <th className="px-3 py-2 text-center text-xs uppercase tracking-wider text-text-muted font-normal w-20">Disc %</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-muted font-normal w-28">Total</th>
              {isEditing && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, ii) => {
              const lt = calcLineTotal(item.qty, item.price, item.discount);
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2 text-sm text-text-muted">{sn}.{ii + 1}</td>
                  <td className="px-3 py-2 text-sm text-text-primary">{item.name}</td>
                  <td className="px-3 py-2 text-xs text-text-secondary">{item.brand}</td>
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 text-right bg-white border border-border rounded py-1 px-2 text-sm focus:border-brand-blue focus:outline-none"
                        value={item.price}
                        onChange={(e) => onUpdateItem(item.id, { price: Number(e.target.value) || 0 })}
                      />
                    ) : (
                      <span className="text-sm">{formatINR(item.price)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-14 text-center bg-white border border-border rounded py-1 px-2 text-sm focus:border-brand-blue focus:outline-none"
                        value={item.qty}
                        min={1}
                        onChange={(e) => onUpdateItem(item.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    ) : (
                      <span className="text-sm">{item.qty}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-16 text-center bg-white border border-border rounded py-1 px-2 text-sm focus:border-brand-blue focus:outline-none"
                        value={item.discount}
                        min={0}
                        max={100}
                        onChange={(e) => onUpdateItem(item.id, { discount: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                      />
                    ) : (
                      <span className="text-sm">{item.discount}%</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-text-primary">{formatINR(lt)}</td>
                  {isEditing && (
                    <td className="px-1 py-2">
                      <button onClick={() => onRemoveItem(item.id)} className="p-1 rounded text-text-muted hover:text-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-text-muted text-sm py-8">
          {isEditing ? "Add products using the picker above" : "No items in this section"}
        </div>
      )}
    </div>
  );
}
