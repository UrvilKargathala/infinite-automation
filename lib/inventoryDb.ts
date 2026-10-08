import type { PoolClient } from "@neondatabase/serverless";
import { sql } from "@/lib/db";
import { splitReadyBackordered } from "@/lib/utils/inventory";
import type { AllocationStatus, Project, StockRow, VendorPO } from "@/types";
import type { CurrencyCode } from "@/lib/utils/currency";

/** A row-returning query, so the same loader runs on the HTTP client or inside a transaction. */
export type Query = (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>;
export const viaSql: Query = (text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>;
export const viaTx = (db: PoolClient): Query => async (text, params) => (await db.query(text, params)).rows;

export function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as number,
    customerId: (row.customer_id as number) ?? null,
    customerName: row.customer_name as string,
    siteAddress: row.site_address as string,
    assigned: row.assigned as string,
    architect: row.architect as string,
    quoteId: (row.quote_id as number) ?? null,
    notes: row.notes as string,
    stage: row.stage as Project["stage"],
    createdAt: row.created_at as string,
    lastStageChange: row.last_stage_change as string,
    confirmedAt: (row.confirmed_at as string) ?? null,
  };
}

export interface SlipLine {
  allocationId: number;
  productId: number;
  name: string;
  sku: string;
  brand: string;
  qty: number;
  shippedQty: number;
  status: AllocationStatus;
  ready: number;       // can ship now (first-confirmed, first-served across all projects)
  backordered: number; // outstanding but no stock for it yet
}

/** The project's reservations, each split into ready vs backordered against current physical stock. */
export async function loadSlipLines(q: Query, projectId: number): Promise<SlipLine[]> {
  const own = await q(
    `SELECT a.id, a.product_id, a.qty, a.shipped_qty, a.status, p.name, p.sku, p.brand
       FROM inventory_allocations a JOIN products p ON p.id = a.product_id
      WHERE a.project_id = $1
      ORDER BY p.brand, p.name`,
    [projectId],
  );
  if (own.length === 0) return [];

  const productIds = own.map((r) => r.product_id as number);
  const competing = await q(
    `SELECT id, product_id, qty - shipped_qty AS outstanding, created_at::text AS created_at
       FROM inventory_allocations
      WHERE status = 'Reserved' AND product_id = ANY($1::int[])`,
    [productIds],
  );
  const stock = await q(`SELECT id, physical_stock FROM products WHERE id = ANY($1::int[])`, [productIds]);

  const split = splitReadyBackordered(
    competing.map((r) => ({
      id: r.id as number,
      productId: r.product_id as number,
      outstanding: r.outstanding as number,
      createdAt: r.created_at as string,
    })),
    new Map(stock.map((r) => [r.id as number, r.physical_stock as number])),
  );

  return own.map((r) => {
    const f = split.get(r.id as number) ?? { ready: 0, backordered: 0 };
    return {
      allocationId: r.id as number,
      productId: r.product_id as number,
      name: r.name as string,
      sku: r.sku as string,
      brand: r.brand as string,
      qty: r.qty as number,
      shippedQty: r.shipped_qty as number,
      status: r.status as AllocationStatus,
      ready: f.ready,
      backordered: f.backordered,
    };
  });
}

/** Every input stockStatus() needs, per product. Pass productIds to load just those. */
export async function loadStockRows(q: Query, productIds?: number[]): Promise<StockRow[]> {
  const rows = await q(
    `SELECT p.id, p.physical_stock, p.min_buffer,
            COALESCE(a.allocated, 0) AS allocated, COALESCE(qd.quoted, 0) AS quoted, COALESCE(i.incoming, 0) AS incoming
       FROM products p
       LEFT JOIN (SELECT product_id, SUM(qty - shipped_qty)::int AS allocated
                    FROM inventory_allocations WHERE status = 'Reserved' GROUP BY product_id) a ON a.product_id = p.id
       LEFT JOIN (SELECT qi.product_id, SUM(qi.qty)::int AS quoted
                    FROM quote_items qi
                    JOIN quote_sections qs ON qs.id = qi.section_id
                    JOIN quotes qt ON qt.id = qs.quote_id
                   WHERE qt.status IN ('Draft', 'Sent') AND qi.product_id IS NOT NULL
                   GROUP BY qi.product_id) qd ON qd.product_id = p.id
       LEFT JOIN (SELECT pi.product_id, SUM(GREATEST(pi.qty_ordered - pi.qty_received, 0))::int AS incoming
                    FROM vendor_po_items pi JOIN vendor_pos po ON po.id = pi.po_id
                   WHERE po.status IN ('Issued', 'Partially Received')
                   GROUP BY pi.product_id) i ON i.product_id = p.id
      WHERE $1::int[] IS NULL OR p.id = ANY($1::int[])
      ORDER BY p.id`,
    [productIds ?? null],
  );
  return rows.map((r) => ({
    productId: r.id as number,
    physical: r.physical_stock as number,
    minBuffer: r.min_buffer as number,
    allocated: r.allocated as number,
    quoted: r.quoted as number,
    incoming: r.incoming as number,
  }));
}

/** Vendor POs with their lines, newest first. Pass ids to load just those. */
export async function loadPurchaseOrders(q: Query, ids?: number[]): Promise<VendorPO[]> {
  const pos = await q(
    `SELECT id, number, brand, vendor_name, status, currency, notes, created_by, created_at::text, issued_at::text
       FROM vendor_pos WHERE $1::int[] IS NULL OR id = ANY($1::int[]) ORDER BY id DESC`,
    [ids ?? null],
  );
  if (pos.length === 0) return [];
  const items = await q(
    `SELECT id, po_id, product_id, qty_ordered, qty_received, unit_cost FROM vendor_po_items WHERE po_id = ANY($1::int[]) ORDER BY id`,
    [pos.map((p) => p.id)],
  );
  return pos.map((p) => ({
    id: p.id as number,
    number: p.number as string,
    brand: p.brand as string,
    vendorName: p.vendor_name as string,
    status: p.status as VendorPO["status"],
    currency: p.currency as CurrencyCode,
    notes: p.notes as string,
    createdBy: (p.created_by as number) ?? null,
    createdAt: p.created_at as string,
    issuedAt: (p.issued_at as string) ?? null,
    items: items
      .filter((i) => i.po_id === p.id)
      .map((i) => ({
        id: i.id as number,
        productId: i.product_id as number,
        qtyOrdered: i.qty_ordered as number,
        qtyReceived: i.qty_received as number,
        unitCost: i.unit_cost != null ? Number(i.unit_cost) : null,
      })),
  }));
}
