'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import { useAccessibility } from '@/features/accessibility/context';
import { ExplanationResponse } from '@/types/assistant';
import { SafetyAssessmentResponse } from '@/lib/ai/schemas';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExplanationCard } from '@/components/assistant/ExplanationCard';
import { SafetyCard } from '@/components/assistant/SafetyCard';
import { VoiceCompanionModal } from '@/components/voice/VoiceCompanionModal';
import {
  HelpCircle,
  ShieldCheck,
  Send,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Mic,
} from 'lucide-react';

function AskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, resolveResponseLanguage } = useLanguage();
  const { preferences } = useAccessibility();

  const [mode, setMode] = useState<'explain' | 'safety'>(() => {
    return searchParams.get('mode') === 'safety' ? 'safety' : 'explain';
  });

  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [safetyAssessment, setSafetyAssessment] = useState<SafetyAssessmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const explainExamples = [
    'What does OTP mean?',
    'Explain Two-Factor Authentication',
    'What is KYC and why do banks ask for it?',
    'Why do apps ask for permission to use my contacts?',
  ];

  const safetyExamples = [
    'Your bank account will be suspended today. Click here to update PAN card.',
    'Electricity will be disconnected tonight at 9 PM due to unpaid bill. Call this number immediately.',
    'You have won Rs. 25,00,000 in KBC lottery. Share your bank details to claim.',
    'Dear customer, your SIM card is blocked. Download this app to unblock.',
  ];

  const handleAsk = async (textToAsk?: string, forcedLevel?: 'simple' | 'standard' | 'detailed') => {
    const q = (textToAsk !== undefined ? textToAsk : query).trim();
    if (!q) {
      setErrorMessage(t('ask.label.explain'));
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const targetLang = resolveResponseLanguage(q);

    try {
      const res = await fetch('/api/assistant/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          explanationLevel: forcedLevel || preferences.explanationLevel,
          responseLanguage: targetLang,
          mode,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMessage(json.error || t('common.errorConnection'));
        return;
      }

      if (mode === 'safety') {
        setSafetyAssessment(json.data);
        setExplanation(null);
      } else {
        setExplanation(json.data);
        setSafetyAssessment(null);
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setErrorMessage(t('common.errorConnection'));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger if query came in via URL parameter
  useEffect(() => {
    const initialQuery = searchParams.get('query');
    if (initialQuery && initialQuery.trim()) {
      const timer = setTimeout(() => {
        void handleAsk(initialQuery);
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFollowUp = (actionText: string) => {
    if (actionText.startsWith('Help me do this')) {
      const goal = explanation?.title ? `How to use or configure ${explanation.title}` : actionText;
      router.push(`/guides?create=${encodeURIComponent(goal)}`);
    } else {
      setQuery(actionText);
      handleAsk(actionText);
    }
  };

  const handleExplainMoreSimply = () => {
    handleAsk(query, 'simple');
  };

  const handleReset = () => {
    setExplanation(null);
    setSafetyAssessment(null);
    setErrorMessage(null);
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            {mode === 'safety' ? (
              <ShieldCheck className="w-7 h-7 text-emerald-800" aria-hidden="true" />
            ) : (
              <HelpCircle className="w-7 h-7 text-amber-900" aria-hidden="true" />
            )}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {mode === 'safety' ? t('ask.tab.safety') : t('ask.title')}
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              {t('ask.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('explain');
            handleReset();
          }}
          className={`py-3 px-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'explain'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          <HelpCircle className="w-5 h-5 text-amber-700" />
          <span>{t('ask.tab.explain')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('safety');
            handleReset();
          }}
          className={`py-3 px-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'safety'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>{t('ask.tab.safety')}</span>
        </button>
      </div>

      {/* Input Card */}
      <Card className="flex flex-col gap-4 border-2 border-stone-300">
        <Textarea
          label={mode === 'safety' ? t('ask.label.safety') : t('ask.label.explain')}
          placeholder={mode === 'safety' ? t('ask.placeholder.safety') : t('ask.placeholder.explain')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          rows={3}
        />

        {/* Examples Chips */}
        {!explanation && !safetyAssessment && (
          <div className="flex flex-col gap-2">
            <span className="text-sm sm:text-base font-bold text-stone-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              {t('ask.examplesTitle')}
            </span>
            <div className="flex flex-wrap gap-2">
              {(mode === 'safety' ? safetyExamples : explainExamples).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    handleAsk(prompt);
                  }}
                  className="text-left text-base bg-stone-100 hover:bg-amber-100 hover:border-amber-400 text-stone-800 font-medium px-3.5 py-2 rounded-xl border border-stone-300 transition-colors cursor-pointer min-h-[44px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-900"
          >
            <AlertCircle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-bold text-lg">Unable to reach Saathi</p>
              <p className="text-base">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => handleAsk()}
              className="border-rose-400 hover:bg-rose-100"
            >
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {(explanation || safetyAssessment) && (
              <Button
                variant="outline"
                size="default"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-5 h-5 text-stone-700" />}
              >
                {t('ask.anotherQuestion')}
              </Button>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={() => setIsVoiceModalOpen(true)}
              leftIcon={<Mic className="w-5 h-5 text-amber-700" />}
            >
              {t('voice.tapToSpeak')}
            </Button>
          </div>

          <Button
            variant="primary"
            size="large"
            onClick={() => handleAsk()}
            isLoading={isLoading}
            disabled={isLoading || !query.trim()}
            rightIcon={<Send className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? mode === 'safety'
                ? t('ask.loading.safety')
                : t('ask.loading.explain')
              : mode === 'safety'
              ? t('ask.submit.safety')
              : t('ask.submit.explain')}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {explanation && (
        <ExplanationCard
          explanation={explanation}
          onFollowUp={handleFollowUp}
          onExplainMoreSimply={handleExplainMoreSimply}
        />
      )}

      {safetyAssessment && (
        <SafetyCard assessment={safetyAssessment} />
      )}

      {/* Voice Modal */}
      <VoiceCompanionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xl text-stone-600">Loading…</div>}>
      <AskContent />
    </Suspense>
  );
}
