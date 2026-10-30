import { priceIn, type CurrencyCode } from "@/lib/utils/currency";
import type { Kit, Product, QuoteItem, QuoteKitComponent } from "@/types";

export interface KitPricing {
  /** Sum of component price × qty, counting only components priced in this currency. */
  componentsTotal: number;
  /** Final kit price after the discount; null when any component has no price in this currency. */
  kitPrice: number | null;
  missingPrice: Product[];
}

/** Kit price in one currency: components summed, then the kit's discount % taken off. */
export function kitPricing(kit: Pick<Kit, "items" | "discountPct">, productsById: Map<number, Product>, currency: CurrencyCode): KitPricing {
  let total = 0;
  const missingPrice: Product[] = [];
  for (const it of kit.items) {
    const p = productsById.get(it.productId);
    if (!p) continue;
    const price = priceIn(p, currency);
    if (price == null) missingPrice.push(p);
    else total += price * it.qty;
  }
  const kitPrice = missingPrice.length ? null : Math.round(total * (1 - kit.discountPct / 100) * 100) / 100;
  return { componentsTotal: Math.round(total * 100) / 100, kitPrice, missingPrice };
}

/** How many complete kits current available stock can make — the scarcest component decides. */
export function kitCanBuild(kit: Pick<Kit, "items">, availableOf: (productId: number) => number | undefined): number | null {
  if (kit.items.length === 0) return 0;
  let min = Infinity;
  for (const it of kit.items) {
    const a = availableOf(it.productId);
    if (a === undefined) return null;
    min = Math.min(min, Math.floor(Math.max(0, a) / it.qty));
  }
  return min === Infinity ? 0 : min;
}

/** Problems worth flagging on a kit: components that are inactive or unpriced in this currency. */
export function kitWarnings(kit: Pick<Kit, "items" | "discountPct">, productsById: Map<number, Product>, currency: CurrencyCode): string[] {
  const out: string[] = [];
  const inactive = kit.items.map((i) => productsById.get(i.productId)).filter((p) => p && p.status === "Inactive") as Product[];
  if (inactive.length) out.push(`${inactive.length} inactive component${inactive.length === 1 ? "" : "s"}`);
  const { missingPrice } = kitPricing(kit, productsById, currency);
  if (missingPrice.length) out.push(`${missingPrice.length} with no ${currency} price`);
  return out;
}

/** A kit as one quote line: priced as the kit in the quote's currency, with a snapshot of its components. */
export function kitQuoteLine(kit: Kit, qty: number, productsById: Map<number, Product>, currency: CurrencyCode, id: string): QuoteItem {
  const components: QuoteKitComponent[] = kit.items.map((it) => {
    const p = productsById.get(it.productId);
    return { productId: it.productId, name: p?.name ?? `Product #${it.productId}`, sku: p?.sku ?? "", qty: it.qty };
  });
  return {
    id,
    productId: null,
    kitId: kit.id,
    kitSku: kit.sku,
    components,
    name: kit.name,
    category: "Kit",
    brand: "Kit",
    description: kit.description,
    qty,
    price: kitPricing(kit, productsById, currency).kitPrice ?? 0,
    discount: 0,
  };
}

/** "2× Dimmer, 1× Hub" — how a kit line's contents read in the quote, PDF and Excel. */
export function kitContents(components: QuoteKitComponent[]): string {
  return components.map((c) => `${c.qty}× ${c.name}`).join(", ");
}
