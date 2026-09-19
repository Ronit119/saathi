'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Portal } from './Portal';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop: covers entire viewport, z-[9998] */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container: centered, z-[9999] */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-hidden outline-none animate-fadeIn"
      >
        <div
          className={cn(
            'flex flex-col max-h-[85dvh] bg-white rounded-3xl border-2 border-stone-300 shadow-2xl overflow-hidden',
            className
          )}
        >
          <div className="shrink-0 p-6 md:p-7 pb-4 flex items-start justify-between gap-4 border-b border-stone-200 bg-white">
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
              className="p-2 min-h-[44px] min-w-[44px] rounded-full hover:bg-stone-200 shrink-0"
            >
              <X className="w-6 h-6 text-stone-700" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-7 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}
