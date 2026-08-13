export function Num({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-numeric font-medium tabular-nums ${className}`}>{children}</span>;
}
