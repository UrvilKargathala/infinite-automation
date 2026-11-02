"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info } from "lucide-react";
import { create } from "zustand";
import { Button } from "./Button";

export interface ConfirmOptions {
  title: string;
  /** Optional second line with the consequence, e.g. "This can't be undone." */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for deletes and cancellations: red button, and Cancel is the focused default. */
  tone?: "danger" | "default";
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
}

const useConfirmStore = create<ConfirmState>(() => ({ options: null, resolve: null }));

/**
 * Our own confirmation popup, in place of the browser's window.confirm(). Await it:
 * `if (!(await confirmDialog({ title: "Delete this quote?", tone: "danger" }))) return;`
 * Needs <ConfirmHost /> mounted once (it is, in the root layout).
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  useConfirmStore.getState().resolve?.(false); // a newer question replaces an unanswered one
  return new Promise((resolve) => useConfirmStore.setState({ options, resolve }));
}

function settle(ok: boolean) {
  const { resolve } = useConfirmStore.getState();
  useConfirmStore.setState({ options: null, resolve: null });
  resolve?.(ok);
}

/** Renders the pending confirmation. Closes on Escape, backdrop click, Cancel; confirms only on the confirm button. */
export function ConfirmHost() {
  const options = useConfirmStore((s) => s.options);

  useEffect(() => {
    if (!options) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") settle(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [options]);

  if (!options) return null;
  const danger = options.tone === "danger";
  const Icon = danger ? AlertTriangle : Info;

  // Above every side panel and photo viewer (z-[70]); portalled so a blurred card can't trap position:fixed.
  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={(e) => { e.stopPropagation(); settle(false); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={options.title}
        className="bg-white w-full max-w-sm rounded-2xl shadow-modal p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-danger/10 text-danger" : "bg-brand-blue/10 text-brand-blue"}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base text-text-primary leading-snug">{options.title}</h2>
            {options.message && <p className="mt-1 text-sm text-text-secondary leading-relaxed">{options.message}</p>}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <ButtonFocus focus={danger}>
            <Button variant="secondary" onClick={() => settle(false)}>{options.cancelLabel ?? "Cancel"}</Button>
          </ButtonFocus>
          <ButtonFocus focus={!danger}>
            <Button variant={danger ? "danger" : "primary"} onClick={() => settle(true)}>{options.confirmLabel ?? "Confirm"}</Button>
          </ButtonFocus>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Button has no autoFocus prop: focus the first button inside this wrapper when asked to. */
function ButtonFocus({ focus, children }: { focus: boolean; children: React.ReactNode }) {
  return (
    <span
      ref={(el) => { if (focus) el?.querySelector("button")?.focus(); }}
      className="inline-flex"
    >
      {children}
    </span>
  );
}
