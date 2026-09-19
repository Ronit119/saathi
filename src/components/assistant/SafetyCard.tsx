'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { SafetyAssessmentResponse } from '@/lib/ai/schemas';
import { Card } from '@/components/ui/Card';
import { SpeechButton } from '@/components/ui/SpeechButton';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export interface SafetyCardProps {
  assessment: SafetyAssessmentResponse;
}

export function SafetyCard({ assessment }: SafetyCardProps) {
  const { t } = useLanguage();

  const isRisky = assessment.isSuspicious;

  const fullTextToRead = `
    ${assessment.title}.
    ${t('ask.card.verdict') || 'Verdict'}: ${assessment.verdictLabel}.
    ${assessment.summary}.
    ${t('ask.card.whyRisky')}: ${assessment.riskReasons.join('. ')}.
    ${t('ask.card.recommendedAction')}: ${assessment.recommendedAction}.
    ${t('ask.card.howToVerify')}: ${assessment.howToVerify}.
  `;

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn" aria-live="polite">
      {/* Title & Verdict Banner */}
      <Card
        className={`border-2 ${
          isRisky
            ? 'border-rose-400 bg-rose-50/70'
            : 'border-emerald-400 bg-emerald-50/70'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isRisky ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isRisky ? (
                <ShieldAlert className="w-7 h-7" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-7 h-7" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span
                className={`text-sm font-bold uppercase tracking-wide ${
                  isRisky ? 'text-rose-900' : 'text-emerald-900'
                }`}
              >
                {t('ask.card.safetyAssessment')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {assessment.verdictLabel}
              </h2>
            </div>
          </div>
          <SpeechButton textToRead={fullTextToRead} label={t('ask.card.readAloud')} />
        </div>
      </Card>

      {/* Summary */}
      <Card className="border-l-8 border-l-stone-600">
        <p className="text-xl text-stone-900 leading-relaxed font-medium">
          {assessment.summary}
        </p>
      </Card>

      {/* Why this may be risky */}
      {assessment.riskReasons.length > 0 && (
        <Card
          className={`border-l-8 ${
            isRisky ? 'border-l-rose-600 bg-rose-50/30' : 'border-l-amber-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-3 text-stone-900 font-bold text-lg">
            <AlertTriangle
              className={`w-6 h-6 ${isRisky ? 'text-rose-700' : 'text-amber-700'}`}
              aria-hidden="true"
            />
            <span>{t('ask.card.whyRisky')}</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {assessment.riskReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-3 text-lg text-stone-800">
                <span className="text-rose-700 font-bold text-xl leading-none shrink-0 mt-1">
                  •
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommended Action */}
      <Card className="border-l-8 border-l-emerald-600 bg-emerald-50/30">
        <div className="flex items-center gap-2 mb-2 text-emerald-950 font-bold text-lg">
          <CheckCircle2 className="w-6 h-6 text-emerald-700" aria-hidden="true" />
          <span>{t('ask.card.recommendedAction')}</span>
        </div>
        <p className="text-lg sm:text-xl text-emerald-950 font-semibold leading-relaxed">
          {assessment.recommendedAction}
        </p>
      </Card>

      {/* How to verify safely */}
      <Card className="border-l-8 border-l-sky-600">
        <div className="flex items-center gap-2 mb-2 text-sky-950 font-bold text-lg">
          <HelpCircle className="w-6 h-6 text-sky-700" aria-hidden="true" />
          <span>{t('ask.card.howToVerify')}</span>
        </div>
        <p className="text-lg text-stone-800 leading-relaxed font-normal">
          {assessment.howToVerify}
        </p>
      </Card>

      {/* Safety Reminder */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-stone-800 text-base font-medium">
        🔒 <strong>Remember:</strong> {t('common.trustBadge')}
      </div>
    </div>
  );
}
