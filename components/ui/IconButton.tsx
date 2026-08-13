"use client";

import { type LucideIcon } from "lucide-react";

export function IconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  indicator,
  className = "",
}: {
  icon: LucideIcon;
  onClick?: () => void;
  ariaLabel: string;
  indicator?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative w-10 h-10 rounded-full bg-white border border-border shadow-iconBtn flex items-center justify-center text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary active:bg-brand-gradient-tint active:text-brand-blue transition-colors ${className}`}
    >
      <Icon size={18} />
      {indicator && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-blue ring-1 ring-white" />
      )}
    </button>
  );
}
