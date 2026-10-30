"use client";

import { type LucideIcon } from "lucide-react";

const variants = {
  primary:
    "bg-brand-gradient text-white shadow-btn hover:-translate-y-px hover:brightness-105 active:translate-y-0",
  secondary:
    "glass-control border border-border text-text-primary hover:bg-white",
  danger: "bg-danger text-white shadow-btn hover:brightness-105",
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
      className={`inline-flex items-center gap-2 rounded-lg font-normal transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed ${variants[variant]} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
