"use client";

import Image from "next/image";
import { initials } from "@/lib/utils/initials";

const sizes = {
  xs: { cls: "w-6 h-6 text-[10px]", px: 24 },
  sm: { cls: "w-8 h-8 text-xs", px: 32 },
  md: { cls: "w-10 h-10 text-sm", px: 40 },
  lg: { cls: "w-12 h-12 text-base", px: 48 },
  xl: { cls: "w-16 h-16 text-lg", px: 64 },
} as const;

const AVATAR_COLORS = [
  "#3A90C3",
  "#44BE4A",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#EC4899",
  "#6366F1",
];

const AVATAR_IMAGES: Record<string, string> = {
  Urvil: "/avatars/urvil.png",
  Henil: "/avatars/henil.png",
  Chirag: "/avatars/chirag.png",
};

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  const src = AVATAR_IMAGES[name];

  if (src) {
    return (
      <div className={`rounded-full overflow-hidden shrink-0 ${s.cls} ${className}`}>
        <Image src={src} alt={name} width={s.px} height={s.px} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-normal shrink-0 ${s.cls} ${className}`}
      style={{ backgroundColor: nameToColor(name) }}
    >
      {initials(name)}
    </div>
  );
}
