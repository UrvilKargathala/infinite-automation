import type { Quote, Section } from "@/types";

export function generateQuoteNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `IA-Q-${year}-${String(seq).padStart(3, "0")}`;
}

export function calcLineTotal(qty: number, price: number, discount: number): number {
  return qty * price * (1 - discount / 100);
}

export function calcSectionSubtotal(section: Section): number {
  return section.items.reduce((s, i) => s + calcLineTotal(i.qty, i.price, i.discount), 0);
}

export function calcQuoteTotal(quote: Quote): { subtotal: number; gst: number; grandTotal: number } {
  const subtotal = quote.sections.reduce((s, sec) => s + calcSectionSubtotal(sec), 0);
  const gst = subtotal * 0.18;
  return { subtotal, gst, grandTotal: subtotal + gst };
}
