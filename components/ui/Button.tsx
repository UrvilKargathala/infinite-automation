"use client";

import { type LucideIcon } from "lucide-react";

const variants = {
  primary:
    "bg-brand-gradient text-white hover:opacity-90",
  secondary:
    "bg-white border border-border text-text-primary hover:bg-[#F9FAFB]",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-text-secondary hover:bg-[#F9FAFB]",
} as const;

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
} as const;

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  disabled,
  onClick,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizeClasses;
  icon?: LucideIcon;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg font-normal transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
