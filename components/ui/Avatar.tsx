"use client";

import { initials } from "@/lib/utils/initials";

const sizes = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
} as const;

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full bg-brand-blue flex items-center justify-center text-white font-normal shrink-0 ${sizes[size]} ${className}`}
    >
      {initials(name)}
    </div>
  );
}
