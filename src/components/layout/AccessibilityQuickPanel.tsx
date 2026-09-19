'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { TextSizePreference } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

  if (!isOpen) return null;

  const textSizes: { key: TextSizePreference; label: string }[] = [
    { key: 'normal', label: t('a11y.textSize.normal') },
    { key: 'large', label: t('a11y.textSize.large') },
    { key: 'xlarge', label: t('a11y.textSize.xlarge') },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <Card className="max-w-lg w-full p-6 sm:p-7 flex flex-col gap-6 shadow-2xl border-2 border-stone-300 relative bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

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
                  className={`py-3 px-2 rounded-xl border-2 font-bold text-base text-center transition-all cursor-pointer ${
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
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50">
          <div className="flex items-start gap-3">
            <Eye className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base text-stone-900">{t('a11y.contrast')}</p>
              <p className="text-sm text-stone-600">{t('a11y.contrastDesc')}</p>
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
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50">
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base text-stone-900">{t('a11y.motion')}</p>
              <p className="text-sm text-stone-600">{t('a11y.motionDesc')}</p>
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
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50">
          <div className="flex items-start gap-3">
            <Volume2 className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base text-stone-900">{t('a11y.voice')}</p>
              <p className="text-sm text-stone-600">{t('a11y.voiceDesc')}</p>
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

        <div className="flex justify-end pt-2 border-t border-stone-200">
          <Button variant="primary" size="default" onClick={onClose}>
            {t('common.done')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
