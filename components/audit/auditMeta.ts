import {
  Plus, Edit2, Trash2, Upload, Download, ToggleLeft, ArrowRightLeft, LogIn, LogOut, Shield,
  type LucideIcon,
} from "lucide-react";
import type { AuditAction, AuditModule } from "@/types";

export const moduleColors: Record<AuditModule, string> = {
  Master: "#3A90C3",
  CRM: "#8B5CF6",
  Quote: "#10B981",
  Projects: "#8B5CF6",
  "User Management": "#F59E0B",
  Auth: "#3B82F6",
};

export const actionMeta: Record<AuditAction, { icon: LucideIcon; color: string; label: string }> = {
  create: { icon: Plus, color: "#10B981", label: "Created" },
  update: { icon: Edit2, color: "#3A90C3", label: "Updated" },
  delete: { icon: Trash2, color: "#EF4444", label: "Deleted" },
  import: { icon: Upload, color: "#3A90C3", label: "Imported" },
  export: { icon: Download, color: "#3A90C3", label: "Exported" },
  status_change: { icon: ToggleLeft, color: "#F59E0B", label: "Status changed" },
  stage_change: { icon: ArrowRightLeft, color: "#8B5CF6", label: "Stage changed" },
  login: { icon: LogIn, color: "#10B981", label: "Login" },
  logout: { icon: LogOut, color: "#64748B", label: "Logout" },
  role_change: { icon: Shield, color: "#F59E0B", label: "Role changed" },
};

export function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatShortTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}
