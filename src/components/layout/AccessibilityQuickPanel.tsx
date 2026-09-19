'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { TextSizePreference } from '@/types/user';
import { Portal } from '@/components/ui/Portal';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import { Button } from '@/components/ui/Button';
import { X, Type, Eye, Activity, Volume2 } from 'lucide-react';

interface AccessibilityQuickPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityQuickPanel({ isOpen, onClose }: AccessibilityQuickPanelProps) {
  const { t, responseLocale, setResponseLocale } = useLanguage();
  const {
    preferences,
    updateTextSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleVoiceEnabled,
  } = useAccessibility();

  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scrolling while panel is open
  useBodyScrollLock(isOpen);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const textSizes: { key: TextSizePreference; label: string }[] = [
    { key: 'normal', label: t('a11y.textSize.normal') },
    { key: 'large', label: t('a11y.textSize.large') },
    { key: 'xlarge', label: t('a11y.textSize.xlarge') },
  ];

  return (
    <Portal>
      {/* Backdrop: z-[9998] */}
      <div
        className="fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog: z-[9999] */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-hidden outline-none animate-fadeIn"
      >
        <div className="flex flex-col max-h-[85dvh] bg-white rounded-3xl border-2 border-stone-300 shadow-2xl overflow-hidden">
          {/* Header - shrink-0 */}
          <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  Aa
                </div>
                <h2 id="a11y-panel-title" className="text-2xl font-black text-stone-900">
                  {t('a11y.quickTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('a11y.close')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer border-2 border-transparent focus-visible:border-amber-600 focus-visible:outline-none shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrolling Content - min-h-0 flex-1 overflow-y-auto */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 py-4 flex flex-col gap-6 overscroll-contain">
            {/* 1. Text Size */}
            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-amber-700" />
                <span>{t('a11y.textSize')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {textSizes.map((item) => {
                  const active = preferences.textSize === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateTextSize(item.key)}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-base text-center transition-all cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-amber-500 ${
                        active
                          ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                          : 'border-stone-300 bg-white hover:border-stone-400 text-stone-800'
                      }`}
                    >
                      {item.label.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. High Contrast */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-start gap-3">
                <Eye className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base text-stone-900">{t('a11y.contrast')}</p>
                  <p className="text-xs sm:text-sm text-stone-600">{t('a11y.contrastDesc')}</p>
                </div>
              </div>
              <Button
                variant={preferences.highContrast ? 'primary' : 'outline'}
                size="small"
                onClick={toggleHighContrast}
                className="shrink-0"
              >
                {preferences.highContrast ? 'ON ✓' : 'OFF'}
              </Button>
            </div>

            {/* 3. Reduced Motion */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-start gap-3">
                <Activity className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base text-stone-900">{t('a11y.motion')}</p>
                  <p className="text-xs sm:text-sm text-stone-600">{t('a11y.motionDesc')}</p>
                </div>
              </div>
              <Button
                variant={preferences.reducedMotion ? 'primary' : 'outline'}
                size="small"
                onClick={toggleReducedMotion}
                className="shrink-0"
              >
                {preferences.reducedMotion ? 'ON ✓' : 'OFF'}
              </Button>
            </div>

            {/* 4. Voice Audio Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-start gap-3">
                <Volume2 className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base text-stone-900">{t('a11y.voice')}</p>
                  <p className="text-xs sm:text-sm text-stone-600">{t('a11y.voiceDesc')}</p>
                </div>
              </div>
              <Button
                variant={preferences.voiceEnabled ? 'primary' : 'outline'}
                size="small"
                onClick={toggleVoiceEnabled}
                className="shrink-0"
              >
                {preferences.voiceEnabled ? 'ON ✓' : 'OFF'}
              </Button>
            </div>

            {/* 5. Response Language Override */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-bold text-stone-900">
                {t('a11y.responseLanguage')}
              </label>
              <select
                value={responseLocale}
                onChange={(e) => setResponseLocale(e.target.value as 'auto' | SupportedLanguage)}
                className="w-full p-3 rounded-xl border-2 border-stone-300 bg-white text-base font-medium text-stone-900 focus:border-amber-600 focus:outline-none"
              >
                <option value="auto">{t('a11y.autoReply')}</option>
                {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                  <option key={l.code} value={l.code}>
                    Always reply in {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer - shrink-0 */}
          <div className="shrink-0 p-4 sm:px-6 sm:py-3.5 border-t border-stone-200 bg-stone-50/80 flex justify-end">
            <Button variant="primary" size="default" onClick={onClose} className="min-h-[46px] px-6 font-bold">
              {t('common.done')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
