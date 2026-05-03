/**
 * A lightweight helper to format dates as "time ago" strings
 * without needing external libraries like date-fns.
 */
export function timeAgo(date: Date | string | number): string {
  const now = new Date().getTime();
  const past = new Date(date).getTime();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  // Fallback to simple date string
  return new Date(date).toLocaleDateString();
}
