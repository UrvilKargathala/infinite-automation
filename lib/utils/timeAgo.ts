/** Renders a YYYY-MM-DD date string as a relative "2d ago" / "in 3d" label. */
export function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(dateStr).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days > 1) return `${days}d ago`;
  if (days === -1) return "Tomorrow";
  return `in ${-days}d`;
}
