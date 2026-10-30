"use client";

import { useEffect, useLayoutEffect, useState } from "react";

export type PopoverPos = { left: number; top: number; width: number; maxHeight: number; up: boolean };

/**
 * Positions a portalled popover (fixed, z-[100]) against its trigger: below by default, flipped above when
 * there isn't `needHeight` px of room. Follows scroll/resize and closes on a mousedown outside both elements.
 */
export function useAnchoredPopover(
  open: boolean,
  close: () => void,
  triggerRef: React.RefObject<HTMLElement>,
  popRef: React.RefObject<HTMLElement>,
  { minWidth = 180, needHeight = 220, maxHeight = 300 }: { minWidth?: number; needHeight?: number; maxHeight?: number } = {}
): PopoverPos | null {
  const [pos, setPos] = useState<PopoverPos | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < needHeight && above > below;
      // Keep the popover inside the viewport horizontally.
      const width = Math.max(r.width, minWidth);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
      setPos({ left, top: up ? r.top - 6 : r.bottom + 6, width, maxHeight: Math.min(maxHeight, up ? above : below), up });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerRef, minWidth, needHeight, maxHeight]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) close();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close, triggerRef, popRef]);

  return open ? pos : null;
}
