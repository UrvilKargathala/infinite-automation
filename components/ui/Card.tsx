export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-6 ${className}`}>
      {children}
    </div>
  );
}
