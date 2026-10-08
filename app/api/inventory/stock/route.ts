import { NextResponse } from "next/server";
import { loadStockRows, viaSql } from "@/lib/inventoryDb";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await loadStockRows(viaSql));
}
