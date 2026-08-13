"use client";

import { Avatar } from "@/components/ui/Avatar";

interface Props {
  assignees: { name: string; count: number }[];
  selected: string | null;
  onToggle: (name: string) => void;
}

export function AssigneeStack({ assignees, selected, onToggle }: Props) {
  const visible = assignees.slice(0, 6);
  const extra = assignees.length - 6;

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Team</span>
      <div className="flex items-center gap-3">
        {visible.map((a) => {
          const isSelected = selected === a.name;
          const dimmed = selected && !isSelected;
          return (
            <button
              key={a.name}
              onClick={() => onToggle(a.name)}
              className={`flex flex-col items-center gap-0.5 transition-opacity ${dimmed ? "opacity-60" : ""}`}
            >
              <Avatar
                name={a.name}
                size="sm"
                className={`ring-2 ${isSelected ? "ring-brand-blue" : "ring-white"}`}
              />
              <span className="text-[10px] text-text-secondary font-normal">
                {a.count}
              </span>
            </button>
          );
        })}
        {extra > 0 && (
          <div className="-ml-2 w-8 h-8 rounded-full bg-surface-alt text-text-secondary text-xs flex items-center justify-center ring-2 ring-white">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}
