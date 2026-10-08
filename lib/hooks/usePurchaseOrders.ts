"use client";

import { useQuery } from "@tanstack/react-query";
import type { VendorPO } from "@/types";

export const PO_QUERY_KEY = ["purchase-orders"];

async function fetchPOs(): Promise<VendorPO[]> {
  const res = await fetch("/api/procurement/pos");
  if (!res.ok) throw new Error("Couldn't load purchase orders");
  return res.json();
}

export function usePurchaseOrders() {
  return useQuery({ queryKey: PO_QUERY_KEY, queryFn: fetchPOs });
}
