"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { CURRENCIES } from "@/lib/utils/currency";

/** Header date + time in the user's currency zone (INR → India time, AED → Dubai time…), ticking on the minute. */
export function HeaderClock() {
  const { timeZone, city } = CURRENCIES[useCurrency()];
  // Null until mounted, so the server-rendered HTML never disagrees with the browser's clock.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => { clearTimeout(align); clearInterval(interval); };
  }, []);

  const date = now?.toLocaleDateString("en-AU", { timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = now?.toLocaleTimeString("en-AU", { timeZone, hour: "numeric", minute: "2-digit" });

  return (
    <span className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full glass text-sm text-text-primary" title={`${city} time (${timeZone}) — set by your currency in Settings`}>
      <span className="w-2 h-2 rounded-full bg-success" />
      {now ? (
        <>
          <span>{date}</span>
          <span className="text-text-muted">·</span>
          <span className="font-numeric tabular-nums">{time}</span>
          <span className="text-xs text-text-muted">{city}</span>
        </>
      ) : (
        <span className="w-32 h-3 rounded bg-white/50 animate-pulse" />
      )}
    </span>
  );
}
