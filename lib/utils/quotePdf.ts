import { formatCurrency } from "@/lib/utils/currency";
import { calcLineTotal, calcSectionSubtotal, calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote, Product, Customer } from "@/types";

/** Opens a new window with a printable HTML quote and triggers window.print(). No PDF library — matches the app's locked print-based export approach. */
export function printQuote(quote: Quote, products: Product[], customers: Customer[]): void {
  const q = quote;
  const t = calcQuoteTotal(q);
  const customer = q.customerId ? customers.find((c) => c.id === q.customerId) : undefined;

  let sectionRows = "";
  q.sections.forEach((sec, si) => {
    const sn = si + 1;
    sectionRows += `<tr class="sec-header"><td colspan="6" style="background:#3A90C3;color:#fff;padding:10px 12px;font-weight:400;"><span class="num">${sn}.</span> ${sec.name || "Untitled Section"}</td></tr>`;
    sec.items.forEach((item, ii) => {
      const lt = calcLineTotal(item.qty, item.price, item.discount);
      sectionRows += `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;" class="num">${sn}.${ii + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;">${item.name} - ${products.find((p) => p.id === item.productId)?.sku ?? "N/A"} (<span class="num">${item.qty}</span> PCS)</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;" class="num">${formatCurrency(item.price, q.currency)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:center;" class="num">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:center;" class="num">${item.discount}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;" class="num">${formatCurrency(lt, q.currency)}</td>
      </tr>`;
    });
    const sectionSubtotal = calcSectionSubtotal(sec);
    sectionRows += `<tr class="sec-subtotal"><td colspan="5" style="padding:6px 12px;text-align:right;color:#64748B;font-size:12px;border-bottom:2px solid #E5E7EB;">Section total</td><td style="padding:6px 12px;text-align:right;border-bottom:2px solid #E5E7EB;" class="num">${formatCurrency(sectionSubtotal, q.currency)}</td></tr>`;
  });

  const billTo = customer
    ? `<div style="font-size:16px;font-weight:400">${customer.name}</div>
       ${customer.contactName ? `<div style="font-size:13px;color:#64748B;margin-top:4px">${customer.contactName}</div>` : ""}
       ${customer.email ? `<div style="font-size:13px;color:#64748B;margin-top:2px">${customer.email}</div>` : ""}
       ${customer.phone ? `<div style="font-size:13px;color:#64748B;margin-top:2px">${customer.phone}</div>` : ""}
       ${customer.address ? `<div style="font-size:13px;color:#64748B;margin-top:2px">${customer.address}</div>` : ""}`
    : `<div style="font-size:16px;font-weight:400">${q.client}</div>`;

  const html = `<!DOCTYPE html><html><head><title>Quote ${q.number}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400&family=Montserrat:wght@500&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Fredoka',Arial,sans-serif;font-weight:400;color:#0F172A;padding:40px}.num{font-family:'Montserrat',ui-monospace,system-ui,sans-serif;font-weight:500;font-variant-numeric:tabular-nums}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #3A90C3;margin-bottom:24px}
.info-blocks{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.info-card{background:#F9FAFB;padding:15px;border-radius:6px}
.info-label{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th{background:#F9FAFB;padding:10px 12px;text-align:left;font-weight:400;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;color:#64748B}
.totals{margin-top:24px;text-align:right}.totals .row{margin:4px 0;font-size:14px}.totals .grand{font-size:20px;font-weight:300;color:#44BE4A;margin-top:8px;padding-top:8px;border-top:2px solid #0F172A}
.footer-note{margin-top:40px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:11px;color:#64748B;line-height:1.6}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:56px}
.sig-line{border-top:1px solid #0F172A;padding-top:6px;font-size:12px;color:#64748B}
@media print{body{padding:20px}}</style></head><body>
<div class="header">
  <div style="display:flex;align-items:center;gap:12px">
    <img src="${window.location.origin}/logo.png" style="width:44px;height:44px;border-radius:10px;object-fit:cover" />
    <div>
      <div style="font-size:24px;font-weight:300;color:#3A90C3">Infinite Automation</div>
      <div style="font-size:11px;color:#64748B;margin-top:2px">Innovate. Automate. Elevate.</div>
      <div style="font-size:11px;color:#64748B;margin-top:4px">Melbourne, Australia &nbsp;·&nbsp; info@infiniteautomation.com.au &nbsp;·&nbsp; 03 9069 2089</div>
    </div>
  </div>
  <div style="text-align:right">
    <div style="font-size:18px;font-weight:300">${q.number}</div>
    <div style="font-size:12px;color:#64748B;margin-top:4px">Date: ${q.date}</div>
    <div style="font-size:12px;color:#64748B">Valid until: ${q.validUntil}</div>
  </div>
</div>
<div class="info-blocks">
  <div class="info-card"><div class="info-label">Bill To</div>${billTo}</div>
  <div class="info-card"><div class="info-label">Quote Details</div>
    <div style="font-size:13px;color:#64748B;margin-top:2px">Status: ${q.status}</div>
    <div style="font-size:13px;color:#64748B;margin-top:2px">Currency: ${q.currency}</div>
  </div>
</div>
<table><thead><tr><th>Sr.</th><th>Description</th><th style="text-align:right">Price</th><th style="text-align:center">Qty</th><th style="text-align:center">Disc.</th><th style="text-align:right">Total</th></tr></thead><tbody>${sectionRows}</tbody></table>
<div class="totals"><div class="row">Subtotal: <span class="num">${formatCurrency(t.subtotal, q.currency)}</span></div>${t.taxRate > 0 ? `<div class="row">${t.taxLabel} (<span class="num">${Math.round(t.taxRate * 100)}</span>%): <span class="num">${formatCurrency(t.tax, q.currency)}</span></div>` : ""}<div class="grand">Grand Total: <span class="num">${formatCurrency(t.grandTotal, q.currency)}</span></div></div>
<div class="footer-note">Prices in ${q.currency}, valid for 30 days from date of issue. Payment terms: 50% advance, 50% on delivery. Delivery: 2-3 weeks from confirmed order.</div>
<div class="signatures">
  <div class="sig-line">Authorized Signatory — Infinite Automation</div>
  <div class="sig-line">Client Acceptance</div>
</div>
<script>window.onload=function(){window.print()}<\/script></body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
