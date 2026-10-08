import { formatCurrency } from "@/lib/utils/currency";
import type { Product, VendorPO } from "@/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Opens a printable purchase order in a new window and triggers window.print() — same no-library approach as printQuote. */
export function printPO(po: VendorPO, products: Product[]): void {
  const byId = new Map(products.map((p) => [p.id, p]));
  const hasCosts = po.items.some((i) => i.unitCost != null);
  const total = po.items.reduce((s, i) => s + (i.unitCost ?? 0) * i.qtyOrdered, 0);
  const units = po.items.reduce((s, i) => s + i.qtyOrdered, 0);
  const cell = "padding:8px 12px;border-bottom:1px solid #E5E7EB;";

  const rows = po.items.map((i, n) => {
    const p = byId.get(i.productId);
    return `<tr>
      <td style="${cell}" class="num">${n + 1}</td>
      <td style="${cell}">${esc(p?.name ?? `Product #${i.productId}`)}<div style="font-size:11px;color:#64748B">${esc(p?.sku ?? "")}</div></td>
      <td style="${cell}text-align:center;" class="num">${i.qtyOrdered}</td>
      ${hasCosts ? `<td style="${cell}text-align:right;" class="num">${i.unitCost != null ? formatCurrency(i.unitCost, po.currency) : "—"}</td>
      <td style="${cell}text-align:right;" class="num">${i.unitCost != null ? formatCurrency(Math.round(i.unitCost * i.qtyOrdered * 100) / 100, po.currency) : "—"}</td>` : ""}
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><title>Purchase Order ${esc(po.number)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400&family=Montserrat:wght@500&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Fredoka',Arial,sans-serif;font-weight:400;color:#0F172A;padding:40px}.num{font-family:'Montserrat',ui-monospace,system-ui,sans-serif;font-weight:500;font-variant-numeric:tabular-nums}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #3A90C3;margin-bottom:24px}
.info-blocks{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.info-card{background:#F9FAFB;padding:15px;border-radius:6px}
.info-label{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th{background:#F9FAFB;padding:10px 12px;text-align:left;font-weight:400;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;color:#64748B}
.grand{margin-top:24px;text-align:right;font-size:20px;font-weight:300;color:#44BE4A}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:56px}
.sig-line{border-top:1px solid #0F172A;padding-top:6px;font-size:12px;color:#64748B}
@media print{body{padding:20px}}</style></head><body>
<div class="header">
  <div style="display:flex;align-items:center;gap:12px">
    <img src="${window.location.origin}/logo.png" style="width:44px;height:44px;border-radius:10px;object-fit:cover" />
    <div>
      <div style="font-size:24px;font-weight:300;color:#3A90C3">Infinite Automation</div>
      <div style="font-size:11px;color:#64748B;margin-top:4px">Melbourne, Australia &nbsp;·&nbsp; info@infiniteautomation.com.au &nbsp;·&nbsp; 03 9069 2089</div>
    </div>
  </div>
  <div style="text-align:right">
    <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em">Purchase order</div>
    <div style="font-size:18px;font-weight:300">${esc(po.number)}</div>
    <div style="font-size:12px;color:#64748B;margin-top:4px">Date: ${(po.issuedAt ?? po.createdAt).slice(0, 10)}</div>
    <div style="font-size:12px;color:#64748B">Status: ${esc(po.status)}</div>
  </div>
</div>
<div class="info-blocks">
  <div class="info-card"><div class="info-label">Vendor</div><div style="font-size:16px">${esc(po.vendorName)}</div><div style="font-size:13px;color:#64748B;margin-top:2px">Brand: ${esc(po.brand)}</div></div>
  <div class="info-card"><div class="info-label">Order summary</div>
    <div style="font-size:13px;color:#64748B"><span class="num">${po.items.length}</span> product(s) · <span class="num">${units}</span> unit(s)</div>
    <div style="font-size:13px;color:#64748B;margin-top:2px">Currency: ${po.currency}</div></div>
</div>
<table><thead><tr><th>Sr.</th><th>Product</th><th style="text-align:center">Qty</th>${hasCosts ? `<th style="text-align:right">Unit cost</th><th style="text-align:right">Total</th>` : ""}</tr></thead><tbody>${rows}</tbody></table>
${hasCosts ? `<div class="grand">Total: <span class="num">${formatCurrency(Math.round(total * 100) / 100, po.currency)}</span></div>` : ""}
${po.notes ? `<div style="margin-top:24px;font-size:13px;color:#64748B;white-space:pre-wrap"><strong style="font-weight:400;color:#0F172A">Notes:</strong> ${esc(po.notes)}</div>` : ""}
<div class="signatures"><div class="sig-line">Authorized Signatory — Infinite Automation</div><div class="sig-line">Vendor Acknowledgement</div></div>
<script>window.onload=function(){window.print()}<\/script></body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
