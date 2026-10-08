"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PackageCheck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import type { Project } from "@/types";

/** Confirm-the-deal card in the project panel: reserves the linked quote's stock, then links to the order slip. */
export function ProjectFulfilment({ project }: { project: Project }) {
  const confirm = useProjectStore((s) => s.confirm);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (!window.confirm("Confirm this deal? The linked quote is marked Accepted and its items are reserved from stock.")) return;
    setBusy(true);
    const error = await confirm(project.id);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    // The server accepted the quote too; mirror that locally instead of refetching every quote.
    useQuoteStore.setState((s) => ({
      quotes: s.quotes.map((q) => (q.id === project.quoteId ? { ...q, status: "Accepted" } : q)),
    }));
    toast.success("Deal confirmed and stock reserved");
  }

  if (project.confirmedAt) {
    return (
      <div className="rounded-xl bg-success/5 border border-success/20 px-3 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <PackageCheck size={18} className="text-success shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-text-primary">Confirmed · stock reserved</div>
            <div className="text-xs text-text-muted">{project.confirmedAt.slice(0, 10)}</div>
          </div>
        </div>
        <Link href={`/projects/${project.id}/order-slip`}>
          <Button variant="secondary" icon={ClipboardList}>Order slip</Button>
        </Link>
      </div>
    );
  }

  if (project.stage === "Cancelled") return null;

  if (!project.quoteId) {
    return (
      <div className="rounded-xl bg-surface-alt px-3 py-3 text-xs text-text-muted">
        Link a quote to confirm this deal and reserve its stock.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-brand-gradient-tint px-3 py-3 flex items-center justify-between gap-3">
      <div className="text-xs text-text-secondary">Deal agreed? Confirm it to reserve the quote&apos;s items from stock.</div>
      <Button icon={PackageCheck} onClick={handleConfirm} disabled={busy}>
        {busy ? "Confirming…" : "Confirm"}
      </Button>
    </div>
  );
}
