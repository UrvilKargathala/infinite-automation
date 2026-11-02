"use client";

import { useEffect, useRef } from "react";

/** Fired by the global search when its result is on the page you're already on (the URL doesn't change then). */
export const OPEN_RECORD_EVENT = "ia:open";

/**
 * Lets a page open one of its records from a link: `?open=<id>` in the URL (notifications, search from another page)
 * or the OPEN_RECORD_EVENT (search from the same page). Call it with `ready` = the page's data has loaded.
 * Pages that already read `?open` through useSearchParams (CRM, Tickets, Complaints) don't need this.
 */
export function useOpenParam(ready: boolean, onOpen: (id: number) => void) {
  const handler = useRef(onOpen);
  handler.current = onOpen;

  useEffect(() => {
    if (!ready) return;
    const id = Number(new URLSearchParams(window.location.search).get("open"));
    if (!id) return;
    handler.current(id);
    window.history.replaceState(null, "", window.location.pathname);
  }, [ready]);

  useEffect(() => {
    function onEvent(e: Event) {
      const id = Number((e as CustomEvent).detail);
      if (id) handler.current(id);
    }
    window.addEventListener(OPEN_RECORD_EVENT, onEvent);
    return () => window.removeEventListener(OPEN_RECORD_EVENT, onEvent);
  }, []);
}
