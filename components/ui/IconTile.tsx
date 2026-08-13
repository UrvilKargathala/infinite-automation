import { type LucideIcon } from "lucide-react";

export function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-brand-gradient-tint flex items-center justify-center shrink-0">
      <Icon size={22} className="text-brand-blue" />
    </div>
  );
}
