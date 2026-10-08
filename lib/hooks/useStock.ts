"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { stockStatus, type StockStatus } from "@/lib/utils/inventory";
import type { StockRow } from "@/types";

export const STOCK_QUERY_KEY = ["stock"];

async function fetchStock(): Promise<StockRow[]> {
  const res = await fetch("/api/inventory/stock");
  if (!res.ok) throw new Error("Couldn't load stock levels");
  return res.json();
}

/** Live stock per product, already run through stockStatus(). Shared by Master and Procurement. */
export function useStock() {
  const { data, isLoading, isError } = useQuery({ queryKey: STOCK_QUERY_KEY, queryFn: fetchStock });
  const byProduct = useMemo(
    () => new Map<number, StockStatus>((data ?? []).map((r) => [r.productId, stockStatus(r)])),
    [data],
  );
  return { byProduct, isLoading, isError };
}
