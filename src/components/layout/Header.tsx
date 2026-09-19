'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';
import { HeartHandshake, Globe, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { AccessibilityQuickPanel } from './AccessibilityQuickPanel';
import { VoiceCompanionModal } from '@/components/voice/VoiceCompanionModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export function Header() {
  const { uiLocale, t } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isA11yModalOpen, setIsA11yModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES[uiLocale] || SUPPORTED_LANGUAGES['en-IN'];

  return (
    <header className="w-full border-b border-stone-200 bg-white shadow-xs sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:rounded-xl focus-visible:outline-none"
          aria-label="Saathi Home"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors leading-none">
              SAATHI
            </h1>
            <p className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
              {t('tagline')}
            </p>
          </div>
        </Link>

        {/* Action Controls: Voice + Language + Accessibility */}
        <div className="flex items-center gap-2" role="region" aria-label="Header controls">
          {/* Quick Voice Launcher */}
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsVoiceModalOpen(true)}
            aria-label={t('voice.tapToSpeak')}
            title={t('voice.tapToSpeak')}
            leftIcon={<Mic className="w-5 h-5 text-amber-700" />}
            className="min-h-[46px] border-amber-300 bg-amber-50/60 hover:bg-amber-100 font-bold px-3 text-stone-900"
          >
            <span className="hidden sm:inline">Voice</span>
          </Button>

          {/* Language Selector */}
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsLangModalOpen(true)}
            aria-label={`Current language: ${currentLang.nativeName}. Click to change.`}
            title="Change language"
            leftIcon={<Globe className="w-5 h-5 text-teal-700" />}
            className="min-h-[46px] font-bold px-3 text-stone-900"
          >
            <span className="text-base">{currentLang.nativeName}</span>
          </Button>

          {/* Quick Accessibility Button */}
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsA11yModalOpen(true)}
            aria-label={t('a11y.quickTitle')}
            title={t('a11y.quickTitle')}
            className="min-h-[46px] font-black text-lg px-3 text-stone-900"
          >
            <span>Aa</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

      <AccessibilityQuickPanel
        isOpen={isA11yModalOpen}
        onClose={() => setIsA11yModalOpen(false)}
      />

      <VoiceCompanionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <OnboardingModal />
    </header>
  );
}
