import type { Role } from "@/types";

const roleColors: Record<Role, string> = {
  "Super Admin": "#8B5CF6",
  Admin: "#3A90C3",
  Staff: "#64748B",
};

export function RoleBadge({ role }: { role: Role }) {
  const color = roleColors[role];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
      style={{ backgroundColor: color + "18", color }}
    >
      {role}
    </span>
  );
}
