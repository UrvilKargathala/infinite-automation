"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnchoredPopover } from "./useAnchoredPopover";
import {
  WEEKDAYS, addDays, addMonths, formatDisplayDate, formatMonth, monthGrid, parseISODate, sameDay, startOfWeek, toISODate, today,
} from "./calendar";

type DatePickerProps = {
  /** YYYY-MM-DD, or "" for no date. */
  value: string;
  /** Same change shape as a native date input: `onChange={(e) => set(e.target.value)}`. */
  onChange: (e: { target: { value: string } }) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

const DEFAULT_CONTROL =
  "w-full glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";

/** Custom calendar — replaces the browser's native <input type="date"> picker everywhere in the app. */
export function DatePicker({ value, onChange, label, disabled, placeholder = "Select date", className, ...aria }: DatePickerProps) {
  const selected = parseISODate(value);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<Date>(() => selected ?? today());
  const [view, setView] = useState<Date>(() => selected ?? today());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const pos = useAnchoredPopover(open, close, triggerRef, popRef, { minWidth: 288, needHeight: 360, maxHeight: 420 });

  function show() {
    if (disabled) return;
    const start = selected ?? today();
    setFocus(start);
    setView(start);
    setOpen(true);
  }

  function moveFocus(d: Date) {
    setFocus(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(d);
  }

  function pick(iso: string) {
    setOpen(false);
    triggerRef.current?.focus();
    if (iso !== value) onChange({ target: { value: iso } });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    const keys: Record<string, () => void> = {
      ArrowLeft: () => moveFocus(addDays(focus, -1)),
      ArrowRight: () => moveFocus(addDays(focus, 1)),
      ArrowUp: () => moveFocus(addDays(focus, -7)),
      ArrowDown: () => moveFocus(addDays(focus, 7)),
      PageUp: () => moveFocus(addMonths(focus, e.shiftKey ? -12 : -1)),
      PageDown: () => moveFocus(addMonths(focus, e.shiftKey ? 12 : 1)),
      Home: () => moveFocus(startOfWeek(focus)),
      End: () => moveFocus(addDays(startOfWeek(focus), 6)),
      Enter: () => pick(toISODate(focus)),
      " ": () => pick(toISODate(focus)),
      // Stop Escape here so a surrounding modal stays open.
      Escape: () => { e.stopPropagation(); setOpen(false); },
    };
    if (e.key === "Tab") return setOpen(false);
    const run = keys[e.key];
    if (run) { e.preventDefault(); run(); }
  }

  const now = today();
  const control = (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={aria["aria-label"] ?? label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`${className ?? DEFAULT_CONTROL} inline-flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed ${open ? "!border-brand-blue" : ""}`}
      >
        <span className={`truncate font-numeric tabular-nums ${selected ? "" : "text-text-muted"}`}>
          {selected ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarDays size={16} className="shrink-0 text-text-muted" />
      </button>

      {open && pos && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Choose date"
          style={{ left: pos.left, top: pos.top, width: 288 }}
          className={`fixed z-[100] rounded-2xl glass-pop p-3 text-sm ${pos.up ? "-translate-y-full" : ""}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-brand-blue/10 hover:text-text-primary">
              <ChevronLeft size={16} />
            </button>
            <span className="text-text-primary">{formatMonth(view)}</span>
            <button type="button" aria-label="Next month" onClick={() => setView(addMonths(view, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-brand-blue/10 hover:text-text-primary">
              <ChevronRight size={16} />
            </button>
          </div>

          <div role="grid" className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="h-7 flex items-center justify-center text-[11px] uppercase tracking-wider text-text-muted">{w}</div>
            ))}
            {monthGrid(view).map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const isSel = sameDay(d, selected);
              const isToday = sameDay(d, now);
              const isFocus = sameDay(d, focus);
              return (
                <button
                  key={toISODate(d)}
                  type="button"
                  role="gridcell"
                  tabIndex={-1}
                  aria-selected={isSel}
                  onMouseEnter={() => setFocus(d)}
                  onClick={() => pick(toISODate(d))}
                  className={`h-9 rounded-lg font-numeric tabular-nums transition-colors ${
                    isSel
                      ? "bg-brand-gradient text-white shadow-[0_6px_14px_-6px_rgba(58,144,195,0.6)]"
                      : `${isFocus ? "bg-brand-blue/10" : ""} ${isToday ? "ring-1 ring-inset ring-brand-blue/40 text-brand-blue" : inMonth ? "text-text-primary" : "text-text-muted/60"}`
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
            <button type="button" onClick={() => pick("")} className="px-2 py-1 rounded-lg text-text-secondary hover:bg-brand-blue/10 hover:text-text-primary">
              Clear
            </button>
            <button type="button" onClick={() => pick(toISODate(now))} className="px-2 py-1 rounded-lg text-brand-blue hover:bg-brand-blue/10">
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );

  if (!label) return control;
  return (
    <div>
      <label className="block text-sm text-text-primary mb-1" onClick={() => triggerRef.current?.focus()}>{label}</label>
      {control}
    </div>
  );
}
