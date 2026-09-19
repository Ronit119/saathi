import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'subtle' | 'warning';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border-stone-300 text-stone-900',
    accent: 'bg-amber-50/70 border-amber-300 text-stone-900',
    subtle: 'bg-stone-50 border-stone-200 text-stone-900',
    warning: 'bg-amber-100/60 border-amber-400 text-amber-950',
  };

  return (
    <div
      className={cn(
        'card-theme rounded-2xl border p-5 md:p-6 shadow-sm transition-shadow',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
