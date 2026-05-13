import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme-aware color helpers
export function avatarColor(initial: string) {
  const colors = {
    'A': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'S': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'T': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };
  return colors[initial as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
}

export function statusColor(status: string) {
  switch (status) {
    case 'safe':
      return 'bg-success/10 dark:bg-success/20 text-success dark:text-success/90';
    case 'review':
      return 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning/90';
    case 'warning':
      return 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning/90';
    case 'danger':
      return 'bg-danger/10 dark:bg-danger/20 text-danger dark:text-danger/90';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

export function lifecycleColor(lifecycle: string) {
  switch (lifecycle) {
    case 'High‑Intent':
    case 'VIP':
      return 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90';
    case 'Warm':
      return 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning/90';
    case 'Cold':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}