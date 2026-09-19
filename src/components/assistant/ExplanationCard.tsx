'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { ExplanationResponse } from '@/types/assistant';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SpeechButton } from '@/components/ui/SpeechButton';
import {
  HelpCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface ExplanationCardProps {
  explanation: ExplanationResponse;
  onFollowUp?: (actionText: string) => void;
  onExplainMoreSimply?: () => void;
}

export function ExplanationCard({
  explanation,
  onFollowUp,
  onExplainMoreSimply,
}: ExplanationCardProps) {
  const { t } = useLanguage();

  const fullTextToRead = `
    ${explanation.title}.
    ${t('ask.card.meaning')}: ${explanation.meaning}.
    ${t('ask.card.whyItMatters')}: ${explanation.whyItMatters}.
    ${t('ask.card.nextSteps')}: ${explanation.nextSteps.join('. ')}.
    ${explanation.cautions && explanation.cautions.length > 0 ? `${t('ask.card.cautions')}: ${explanation.cautions.join('. ')}` : ''}
  `;

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn" aria-live="polite">
      {/* Title & Speech Action */}
      <Card variant="accent" className="border-2 border-amber-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {explanation.title}
            </h2>
          </div>
          <SpeechButton textToRead={fullTextToRead} label={t('ask.card.readAloud')} />
        </div>
      </Card>

      {/* 1. What this means */}
      <Card className="border-l-8 border-l-amber-600">
        <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-lg">
          <Info className="w-6 h-6 text-amber-700" aria-hidden="true" />
          <span>{t('ask.card.meaning')}</span>
        </div>
        <p className="text-lg sm:text-xl text-stone-800 leading-relaxed font-normal">
          {explanation.meaning}
        </p>
      </Card>

      {/* 2. Why this matters */}
      <Card className="border-l-8 border-l-sky-600">
        <div className="flex items-center gap-2 mb-2 text-sky-900 font-bold text-lg">
          <Info className="w-6 h-6 text-sky-700" aria-hidden="true" />
          <span>{t('ask.card.whyItMatters')}</span>
        </div>
        <p className="text-lg sm:text-xl text-stone-800 leading-relaxed font-normal">
          {explanation.whyItMatters}
        </p>
      </Card>

      {/* 3. What you can do */}
      <Card className="border-l-8 border-l-emerald-600">
        <div className="flex items-center gap-2 mb-3 text-emerald-900 font-bold text-lg">
          <CheckCircle2 className="w-6 h-6 text-emerald-700" aria-hidden="true" />
          <span>{t('ask.card.nextSteps')}</span>
        </div>
        <ul className="flex flex-col gap-3">
          {explanation.nextSteps.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-lg sm:text-xl text-stone-800"
            >
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shrink-0 mt-0.5 text-base border border-emerald-300">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 4. Be careful about (if present) */}
      {explanation.cautions && explanation.cautions.length > 0 && (
        <Card variant="warning" className="border-2 border-amber-500 bg-amber-50">
          <div className="flex items-center gap-2 mb-3 text-amber-950 font-bold text-lg">
            <AlertTriangle className="w-6 h-6 text-amber-700" aria-hidden="true" />
            <span>{t('ask.card.cautions')}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {explanation.cautions.map((caution, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-lg text-amber-950 font-medium"
              >
                <span className="text-amber-700 font-bold shrink-0">•</span>
                <span>{caution}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 5. Follow-up Actions */}
      <Card className="bg-stone-50 border-stone-300">
        <h3 className="text-xl font-bold text-stone-900 mb-3">
          {t('ask.card.whatNext')}
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="default"
            onClick={() => onFollowUp?.(`Help me do this: ${explanation.title}`)}
            leftIcon={<ArrowRight className="w-5 h-5" />}
          >
            {t('ask.card.guideMeStepByStep')}
          </Button>

          {onExplainMoreSimply && (
            <Button
              variant="outline"
              size="default"
              onClick={onExplainMoreSimply}
              leftIcon={<RefreshCw className="w-5 h-5 text-stone-700" />}
            >
              {t('ask.card.explainSimpler')}
            </Button>
          )}

          {explanation.followUps.map((action, idx) => (
            <Button
              key={idx}
              variant="secondary"
              size="default"
              onClick={() => onFollowUp?.(action)}
            >
              {action}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
