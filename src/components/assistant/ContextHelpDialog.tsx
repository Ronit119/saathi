'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { SpeechButton } from '@/components/ui/SpeechButton';
import { HelpCircle, Send, AlertCircle, Sparkles } from 'lucide-react';
import { ContextHelpResponse } from '@/types/assistant';

export interface ContextHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guideTitle: string;
  stepNumber: number;
  stepTitle: string;
  stepInstruction: string;
  guideLanguage?: string;
  initialQuestion?: string;
}

export function ContextHelpDialog({
  isOpen,
  onClose,
  guideTitle,
  stepNumber,
  stepTitle,
  stepInstruction,
  guideLanguage,
  initialQuestion = '',
}: ContextHelpDialogProps) {
  const { t, uiLocale } = useLanguage();
  const [question, setQuestion] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ContextHelpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetLang = guideLanguage || uiLocale;

  const handleAskHelp = async (qText?: string) => {
    const q = (qText !== undefined ? qText : question).trim();
    if (!q) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/context-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideTitle,
          stepNumber,
          stepTitle,
          stepInstruction,
          userQuestion: q,
          responseLanguage: targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || t('common.errorConnection'));
        return;
      }

      setResponse(json.data);
    } catch (err: unknown) {
      console.error('Context help error:', err);
      setError(t('common.errorConnection'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (quickText: string) => {
    setQuestion(quickText);
    handleAskHelp(quickText);
  };

  const handleClose = () => {
    setResponse(null);
    setError(null);
    setQuestion('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${t('guides.stepViewer.needHelp')} (${stepNumber})`}
      description={stepTitle}
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Step context reminder */}
        <div className="p-3.5 bg-stone-100 rounded-xl border border-stone-300 text-stone-800 text-base">
          <strong>{t('guides.stepViewer.whatToDo')}</strong> {stepInstruction}
        </div>

        {/* Quick prompt buttons */}
        {!response && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-stone-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Quick questions:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickQuestion(t('guides.stepViewer.cantFind'))}
                className="text-left text-base bg-white hover:bg-amber-50 text-stone-800 font-medium px-3.5 py-2 rounded-xl border border-stone-300 cursor-pointer min-h-[44px]"
              >
                {t('guides.stepViewer.cantFind')}
              </button>
              <button
                type="button"
                onClick={() => handleQuickQuestion(t('guides.stepViewer.explainStep'))}
                className="text-left text-base bg-white hover:bg-amber-50 text-stone-800 font-medium px-3.5 py-2 rounded-xl border border-stone-300 cursor-pointer min-h-[44px]"
              >
                {t('guides.stepViewer.explainStep')}
              </button>
            </div>
          </div>
        )}

        {/* Custom question input */}
        <Textarea
          label={t('guides.stepViewer.needHelp')}
          placeholder="For example: What does this button look like?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          rows={2}
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-400 rounded-xl text-rose-900 text-base font-medium"
          >
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Answer section */}
        {response && (
          <div className="flex flex-col gap-3 p-4 bg-amber-50/80 rounded-2xl border-2 border-amber-400 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
                <HelpCircle className="w-5 h-5 text-amber-700" />
                <span>Saathi&apos;s Advice:</span>
              </div>
              <SpeechButton
                textToRead={`${response.answer}. ${response.reassurance}`}
                label={t('guides.stepViewer.readStep')}
              />
            </div>
            <p className="text-lg text-stone-900 font-normal leading-relaxed">
              {response.answer}
            </p>
            {response.suggestedAction && (
              <div className="p-2.5 bg-white rounded-xl border border-amber-300 text-stone-900 text-base font-semibold">
                👉 <strong>Try this:</strong> {response.suggestedAction}
              </div>
            )}
            <p className="text-sm font-medium text-amber-950 italic">
              {response.reassurance}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="default" onClick={handleClose}>
            {response ? t('common.done') : t('common.cancel')}
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={() => handleAskHelp()}
            isLoading={isLoading}
            disabled={isLoading || !question.trim()}
            rightIcon={<Send className="w-5 h-5" />}
          >
            {isLoading ? t('common.loading') : t('ask.submit.explain')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
