'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextSizePreference, ExplanationLevel } from '@/types/user';
import {
  Settings,
  Type,
  Eye,
  Activity,
  BookOpen,
  Volume2,
  Globe,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { uiLocale, setUiLocale, responseLocale, setResponseLocale, t } = useLanguage();
  const {
    preferences,
    isSpeechSupported,
    updateTextSize,
    toggleHighContrast,
    toggleReducedMotion,
    updateExplanationLevel,
    toggleVoiceEnabled,
  } = useAccessibility();

  const textSizes: { key: TextSizePreference; label: string; desc: string }[] = [
    { key: 'normal', label: t('a11y.textSize.normal'), desc: 'Comfortable standard size for easy reading' },
    { key: 'large', label: t('a11y.textSize.large'), desc: 'Larger text for enhanced visibility' },
    { key: 'xlarge', label: t('a11y.textSize.xlarge'), desc: 'Maximum text size for highest clarity' },
  ];

  const levels: { key: ExplanationLevel; label: string; desc: string }[] = [
    { key: 'simple', label: 'Simplest', desc: 'Short sentences with everyday analogies. Ideal for quick understanding.' },
    { key: 'standard', label: 'Standard', desc: 'Balanced explanations with clear practical context.' },
    { key: 'detailed', label: 'Detailed', desc: 'Full thorough explanations covering how things work in detail.' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <Settings className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {t('nav.settings')}
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              {t('a11y.quickTitle')}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Language Settings */}
      <Card className="border-2 border-stone-300 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-teal-700" />
          <h2 className="text-2xl font-bold text-stone-900">{t('a11y.language')}</h2>
        </div>
        <p className="text-base text-stone-600">
          Choose the language for Saathi&apos;s menus, buttons, and display.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => {
            const isSelected = uiLocale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setUiLocale(lang.code)}
                className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer min-h-[85px] focus-visible:outline-none ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50 shadow-xs'
                    : 'border-stone-300 bg-white hover:border-teal-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl font-bold text-stone-900 leading-tight">
                    {lang.nativeName}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-teal-700 stroke-[3]" />
                  )}
                </div>
                <span className="text-xs text-stone-500 font-medium">{lang.name}</span>
              </button>
            );
          })}
        </div>

        {/* Reply Language Mode */}
        <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
          <label className="text-base font-bold text-stone-900">
            {t('a11y.responseLanguage')}
          </label>
          <select
            value={responseLocale}
            onChange={(e) => setResponseLocale(e.target.value as 'auto' | SupportedLanguage)}
            className="w-full max-w-md p-3 rounded-xl border-2 border-stone-300 bg-white text-base font-medium text-stone-900 focus:border-amber-600 focus:outline-none"
          >
            <option value="auto">{t('a11y.autoReply')}</option>
            {Object.values(SUPPORTED_LANGUAGES).map((l) => (
              <option key={l.code} value={l.code}>
                Always reply in {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 2. Text Size Setting */}
      <Card className="border-2 border-stone-300 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Type className="w-6 h-6 text-amber-700" />
          <h2 className="text-2xl font-bold text-stone-900">{t('a11y.textSize')}</h2>
        </div>
        <p className="text-base text-stone-600">
          Choose the text size that feels most comfortable for your eyes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {textSizes.map((item) => {
            const isSelected = preferences.textSize === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => updateTextSize(item.key)}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer min-h-[90px] focus-visible:outline-none ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs'
                    : 'border-stone-300 bg-white hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-lg font-bold text-stone-900">
                    {item.label}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-amber-700 stroke-[3]" />
                  )}
                </div>
                <span className="text-sm text-stone-600">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. High Contrast Mode */}
      <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Eye className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              {t('a11y.contrast')}
            </h2>
            <p className="text-base text-stone-600">
              {t('a11y.contrastDesc')}
            </p>
          </div>
        </div>

        <Button
          variant={preferences.highContrast ? 'primary' : 'outline'}
          size="default"
          onClick={toggleHighContrast}
          className="shrink-0 font-bold"
        >
          {preferences.highContrast ? 'Enabled ✓' : 'Turn On'}
        </Button>
      </Card>

      {/* 4. Reduced Motion */}
      <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Activity className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              {t('a11y.motion')}
            </h2>
            <p className="text-base text-stone-600">
              {t('a11y.motionDesc')}
            </p>
          </div>
        </div>

        <Button
          variant={preferences.reducedMotion ? 'primary' : 'outline'}
          size="default"
          onClick={toggleReducedMotion}
          className="shrink-0 font-bold"
        >
          {preferences.reducedMotion ? 'Enabled ✓' : 'Turn On'}
        </Button>
      </Card>

      {/* 5. Voice Audio Controls */}
      {isSpeechSupported && (
        <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Volume2 className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {t('a11y.voice')}
              </h2>
              <p className="text-base text-stone-600">
                {t('a11y.voiceDesc')}
              </p>
            </div>
          </div>

          <Button
            variant={preferences.voiceEnabled ? 'primary' : 'outline'}
            size="default"
            onClick={toggleVoiceEnabled}
            className="shrink-0 font-bold"
          >
            {preferences.voiceEnabled ? 'Enabled ✓' : 'Turn On'}
          </Button>
        </Card>
      )}

      {/* 6. Explanation Level */}
      <Card className="border-2 border-stone-300 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-700" />
          <h2 className="text-2xl font-bold text-stone-900">
            Explanation Style
          </h2>
        </div>
        <p className="text-base text-stone-600">
          How would you prefer Saathi to explain new concepts and messages?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {levels.map((item) => {
            const isSelected = preferences.explanationLevel === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => updateExplanationLevel(item.key)}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer min-h-[90px] focus-visible:outline-none ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs'
                    : 'border-stone-300 bg-white hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-lg font-bold text-stone-900">
                    {item.label}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-amber-700 stroke-[3]" />
                  )}
                </div>
                <span className="text-sm text-stone-600">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
