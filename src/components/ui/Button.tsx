'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'default' | 'large' | 'small';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-colors cursor-pointer select-none text-center focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed border';

    const variants = {
      primary:
        'bg-amber-700 text-white border-amber-800 hover:bg-amber-800 active:bg-amber-900 shadow-sm',
      secondary:
        'bg-stone-100 text-stone-900 border-stone-300 hover:bg-stone-200 active:bg-stone-300',
      outline:
        'bg-white text-stone-900 border-stone-400 hover:bg-stone-50 active:bg-stone-100',
      danger:
        'bg-rose-700 text-white border-rose-800 hover:bg-rose-800 active:bg-rose-900',
      ghost:
        'bg-transparent text-stone-800 border-transparent hover:bg-stone-100 active:bg-stone-200',
    };

    const sizes = {
      small: 'px-3 py-2 text-base min-h-[44px] gap-2',
      default: 'px-5 py-3 text-lg min-h-[50px] gap-2.5',
      large: 'px-7 py-4 text-xl min-h-[58px] gap-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
