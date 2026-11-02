import * as XLSX from "xlsx";
import { toast } from "sonner";

/** Download the given rows as a one-sheet Excel file — the same Export every list page uses. `label` reads "12 complaints exported". */
export function exportSheet(rows: Record<string, string | number>[], sheet: string, file: string, label: string): void {
  if (rows.length === 0) {
    toast.error(`No ${label} to export`);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet);
  XLSX.writeFile(wb, file);
  toast.success(`${rows.length} ${label} exported`);
}
