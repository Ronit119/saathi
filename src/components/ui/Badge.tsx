import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant = 'default',
  icon,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-stone-100 text-stone-800 border-stone-300',
    success: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    warning: 'bg-amber-100 text-amber-950 border-amber-300',
    info: 'bg-sky-100 text-sky-950 border-sky-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
