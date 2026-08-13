export function Badge({
  children,
  color = "#64748B",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${className}`}
      style={{ backgroundColor: color + "18", color }}
    >
      {children}
    </span>
  );
}
