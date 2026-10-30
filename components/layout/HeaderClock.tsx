"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { CURRENCIES } from "@/lib/utils/currency";

/** Header date + time in the user's currency zone (INR → India time, AED → Dubai time…), ticking every second. */
export function HeaderClock() {
  const { timeZone, city } = CURRENCIES[useCurrency()];
  // Null until mounted, so the server-rendered HTML never disagrees with the browser's clock.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Line the ticks up with the start of each second so the display never lags a whole second behind.
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => { clearTimeout(align); clearInterval(interval); };
  }, []);

  const date = now?.toLocaleDateString("en-AU", { timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = now?.toLocaleTimeString("en-AU", { timeZone, hour: "numeric", minute: "2-digit", second: "2-digit" });

  return (
    <span className="hidden md:inline-flex items-center gap-2 h-9 pl-3.5 pr-1.5 rounded-full glass text-sm text-text-primary" title={`${city} time (${timeZone}) — set by your currency in Settings`}>
      <span className="w-2 h-2 rounded-full bg-success" />
      {now ? (
        <>
          <span>{date}</span>
          <span className="text-text-muted">·</span>
          {/* Fixed width + tabular digits so the pill doesn't twitch as the seconds change. */}
          <span className="font-numeric tabular-nums min-w-[7.5ch]">{time}</span>
          <span className="pr-2 text-text-primary">{city}</span>
        </>
      ) : (
        <span className="w-40 h-3 mr-2 rounded bg-white/50 animate-pulse" />
      )}
    </span>
  );
}
