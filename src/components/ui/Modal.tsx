'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg bg-white rounded-3xl border-2 border-stone-400 p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-stone-200">
          <div>
            <h2 id="modal-title" className="text-2xl font-bold text-stone-900">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-base text-stone-600 mt-1">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 min-h-[44px] min-w-[44px] rounded-full hover:bg-stone-200"
          >
            <X className="w-6 h-6 text-stone-700" />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
