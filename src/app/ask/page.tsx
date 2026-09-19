'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessibility } from '@/features/accessibility/context';
import { ExplanationResponse } from '@/types/assistant';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExplanationCard } from '@/components/assistant/ExplanationCard';
import { HelpCircle, Send, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'What does Two-Factor Authentication mean?',
  'Explain OTP in simple terms',
  'What does this email asking to update KYC mean?',
  'Why do apps ask for permission to use my camera?',
];

export default function AskPage() {
  const router = useRouter();
  const { preferences } = useAccessibility();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAsk = async (textToAsk?: string, forcedLevel?: 'simple' | 'standard' | 'detailed') => {
    const q = (textToAsk !== undefined ? textToAsk : query).trim();
    if (!q) {
      setErrorMessage('Please type or paste what you would like Saathi to explain.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          explanationLevel: forcedLevel || preferences.explanationLevel,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMessage(
          json.error || 'I could not reach Saathi right now. Please check your connection and try again.'
        );
        return;
      }

      setExplanation(json.data);
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setErrorMessage('I could not reach Saathi right now. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = (actionText: string) => {
    if (actionText.startsWith('Help me do this')) {
      // Direct transition to interactive guide creation!
      const goal = explanation?.title ? `How to set up or use ${explanation.title}` : actionText;
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
    setErrorMessage(null);
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <HelpCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Help Me Understand
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              Type or paste any confusing message, term, or notification.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="flex flex-col gap-4 border-2 border-stone-300">
        <Textarea
          label="What is confusing you or what would you like explained?"
          placeholder="For example: What does two-factor authentication mean? Or paste a message here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          rows={3}
        />

        {/* Quick Example Chips */}
        {!explanation && (
          <div className="flex flex-col gap-2">
            <span className="text-sm sm:text-base font-bold text-stone-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Try asking about:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
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
              Try again
            </Button>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {explanation ? (
            <Button
              variant="outline"
              size="default"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-5 h-5 text-stone-700" />}
            >
              Ask another question
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="large"
            onClick={() => handleAsk()}
            isLoading={isLoading}
            disabled={isLoading || !query.trim()}
            rightIcon={<Send className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Saathi is simplifying this…' : 'Explain Simply'}
          </Button>
        </div>
      </Card>

      {/* Explanation Result Card */}
      {explanation && (
        <ExplanationCard
          explanation={explanation}
          onFollowUp={handleFollowUp}
          onExplainMoreSimply={handleExplainMoreSimply}
        />
      )}
    </div>
  );
}
