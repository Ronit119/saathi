'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe, Check, X } from 'lucide-react';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({ isOpen, onClose }: LanguageSelectorModalProps) {
  const { uiLocale, setUiLocale, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await setUiLocale(code);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-selector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <Card className="max-w-md w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl border-2 border-stone-300 relative bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Globe className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 id="language-selector-title" className="text-2xl font-black text-stone-900">
              {t('a11y.language')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-base text-stone-600">
          Choose your preferred language for Saathi&apos;s menus, buttons, and display.
        </p>

        {/* List of 8 Languages */}
        <div className="flex flex-col gap-2.5">
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => {
            const isSelected = uiLocale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer min-h-[56px] text-left ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                    : 'border-stone-200 bg-white hover:border-amber-400 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-bold leading-tight">{lang.nativeName}</span>
                  <span className="text-sm font-normal text-stone-500">{lang.name} ({lang.script})</span>
                </div>
                {isSelected && (
                  <Check className="w-6 h-6 text-amber-700 stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-stone-200">
          <Button variant="outline" size="default" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
