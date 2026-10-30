"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { collectOptions } from "./selectOptions";
import { useAnchoredPopover } from "./useAnchoredPopover";

/** Same change shape as a native <select>, so call sites keep `onChange={(e) => set(e.target.value)}`. */
export type SelectChange = { target: { value: string } };

type SelectProps = {
  value?: string | number | null;
  onChange?: (e: SelectChange) => void;
  label?: string;
  disabled?: boolean;
  title?: string;
  className?: string;
  /** `<option value="…">Label</option>` elements, exactly as you would pass to a native select. */
  children: React.ReactNode;
};

const DEFAULT_CONTROL =
  "w-full glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";

/** Custom dropdown — replaces the browser's native <select> menu everywhere in the app. */
export function Select({ value, onChange, label, disabled, title, className, children }: SelectProps) {
  const options = useMemo(() => collectOptions(children), [children]);
  const current = String(value ?? "");
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === current));
  const selected = options[selectedIndex];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  const pos = useAnchoredPopover(open, close, triggerRef, listRef);

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    if (disabled) return;
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(i: number) {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    setOpen(false);
    triggerRef.current?.focus();
    if (opt.value !== current) onChange?.({ target: { value: opt.value } });
  }

  function step(from: number, dir: 1 | -1) {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
    return from;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      // Stop Escape here so a surrounding modal stays open.
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); }
      setOpen(false);
    } else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => step(a, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => step(a, -1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(step(-1, 1)); }
    else if (e.key === "End") { e.preventDefault(); setActive(step(options.length, -1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key.length === 1) {
      const now = Date.now();
      const t = typeahead.current;
      t.text = now - t.at < 600 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
      t.at = now;
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(t.text));
      if (hit >= 0) setActive(hit);
    }
  }

  const firstAction = options.findIndex((o) => o.action);

  const control = (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        disabled={disabled}
        title={title}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${className ?? DEFAULT_CONTROL} inline-flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed ${open ? "!border-brand-blue" : ""}`}
      >
        {/* Every label stacked in one cell keeps the width steady — like a native select sizing to its longest option. */}
        <span className="grid min-w-0 flex-1">
          {options.map((o) => (
            <span key={o.value} aria-hidden className="col-start-1 row-start-1 invisible h-0 whitespace-nowrap overflow-hidden">{o.label}</span>
          ))}
          <span className="col-start-1 row-start-1 truncate">{selected?.label ?? ""}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={listRef}
          id={id}
          role="listbox"
          style={{ left: pos.left, top: pos.top, minWidth: pos.width, maxHeight: pos.maxHeight }}
          className={`fixed z-[100] overflow-y-auto rounded-xl glass-pop p-1 text-sm ${pos.up ? "-translate-y-full" : ""}`}
        >
          {options.map((o, i) => (
            <div key={`${o.value}-${i}`}>
              {i === firstAction && i > 0 && <div className="my-1 h-px bg-border" />}
              <div
                id={`${id}-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === selectedIndex}
                aria-disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                  o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                } ${i === active && !o.disabled ? "bg-brand-blue/10" : ""} ${
                  o.action ? "text-brand-blue" : i === selectedIndex ? "text-brand-blue" : "text-text-primary"
                }`}
              >
                <span className="flex-1">{o.label}</span>
                {i === selectedIndex && !o.action && <Check size={15} className="shrink-0" />}
              </div>
            </div>
          ))}
          {options.length === 0 && <div className="px-3 py-2 text-text-muted">No options</div>}
        </div>,
        document.body
      )}
    </>
  );

  // Without a label the button itself is the layout item, exactly where a native <select> would sit.
  if (!label) return control;
  return (
    <div>
      <label className="block text-sm text-text-primary mb-1" onClick={() => triggerRef.current?.focus()}>{label}</label>
      {control}
    </div>
  );
}
