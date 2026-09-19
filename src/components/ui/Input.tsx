'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorMessage, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-lg font-bold text-stone-900 select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full min-h-[50px] px-4 py-3 text-lg rounded-xl border border-stone-400 bg-white text-stone-900 transition-colors focus-visible:outline-none placeholder:text-stone-500 disabled:bg-stone-100 disabled:opacity-70',
            errorMessage && 'border-rose-600 focus-visible:ring-rose-500',
            className
          )}
          aria-invalid={errorMessage ? 'true' : 'false'}
          aria-describedby={
            errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {helperText && !errorMessage && (
          <p id={`${inputId}-helper`} className="text-base text-stone-600">
            {helperText}
          </p>
        )}
        {errorMessage && (
          <p id={`${inputId}-error`} className="text-base font-semibold text-rose-700">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, errorMessage, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-lg font-bold text-stone-900 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full min-h-[120px] p-4 text-lg rounded-xl border border-stone-400 bg-white text-stone-900 transition-colors focus-visible:outline-none placeholder:text-stone-500 disabled:bg-stone-100 disabled:opacity-70 resize-y',
            errorMessage && 'border-rose-600 focus-visible:ring-rose-500',
            className
          )}
          aria-invalid={errorMessage ? 'true' : 'false'}
          aria-describedby={
            errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {helperText && !errorMessage && (
          <p id={`${inputId}-helper`} className="text-base text-stone-600">
            {helperText}
          </p>
        )}
        {errorMessage && (
          <p id={`${inputId}-error`} className="text-base font-semibold text-rose-700">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
