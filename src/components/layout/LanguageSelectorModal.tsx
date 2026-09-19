'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { Portal } from '@/components/ui/Portal';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import { Button } from '@/components/ui/Button';
import { Globe, Check, X } from 'lucide-react';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({ isOpen, onClose }: LanguageSelectorModalProps) {
  const { uiLocale, setUiLocale, t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scrolling while modal is open
  useBodyScrollLock(isOpen);

  // Handle keyboard events: Escape to close, Tab to trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on selected language button or close button
    const timer = setTimeout(() => {
      const selectedBtn = dialogRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]');
      if (selectedBtn) {
        selectedBtn.focus();
      } else if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await setUiLocale(code);
    onClose();
  };

  return (
    <Portal>
      {/* Backdrop: covers entire viewport, z-[9998] */}
      <div
        className="fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog: centered, z-[9999], max-h-[85dvh], overflow-hidden */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-selector-title"
        aria-describedby="language-selector-desc"
        className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[740px] max-h-[85dvh] overflow-hidden outline-none animate-fadeIn"
      >
        <div className="flex flex-col max-h-[85dvh] bg-white rounded-3xl border-2 border-stone-300 shadow-2xl overflow-hidden">
          {/* Header - shrink-0 */}
          <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Globe className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="language-selector-title" className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                    {t('a11y.language')}
                  </h2>
                  <p id="language-selector-desc" className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
                    Choose your preferred language for menus and buttons
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="w-11 h-11 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer border-2 border-transparent focus-visible:border-amber-600 focus-visible:outline-none shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrolling Content - min-h-0 flex-1 overflow-y-auto */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 py-4 overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(SUPPORTED_LANGUAGES).map((lang) => {
                const isSelected = uiLocale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer min-h-[56px] text-left outline-none focus-visible:ring-3 focus-visible:ring-amber-500 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-400 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xl font-bold leading-tight">{lang.nativeName}</span>
                      <span className="text-xs sm:text-sm font-normal text-stone-500 mt-0.5">
                        {lang.name} ({lang.script})
                      </span>
                    </div>
                    {isSelected ? (
                      <Check className="w-6 h-6 text-amber-700 stroke-[3] shrink-0" aria-hidden="true" />
                    ) : (
                      <span className="w-6 h-6 rounded-full border-2 border-stone-200 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer - shrink-0 */}
          <div className="shrink-0 p-4 sm:px-6 sm:py-3.5 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-stone-500">
              8 Indian languages supported
            </span>
            <Button
              variant="outline"
              size="default"
              onClick={onClose}
              className="min-h-[46px] px-5 font-bold"
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
