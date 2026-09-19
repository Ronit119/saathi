import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatRelativeDay(timestamp: number): string {
  const target = new Date(timestamp);
  const now = new Date();
  
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffDays = Math.round((targetDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));
  
  const timeString = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(target);

  if (diffDays === 0) {
    return `Today at ${timeString}`;
  } else if (diffDays === 1) {
    return `Tomorrow at ${timeString}`;
  } else if (diffDays === -1) {
    return `Yesterday at ${timeString}`;
  } else if (diffDays > 1 && diffDays < 7) {
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(target);
    return `${weekday} at ${timeString}`;
  } else {
    return formatDate(timestamp);
  }
}
