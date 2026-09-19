'use client';

import React from 'react';
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
  Check,
} from 'lucide-react';

export default function SettingsPage() {
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
    { key: 'normal', label: 'Normal (18px)', desc: 'Comfortable standard size for easy reading' },
    { key: 'large', label: 'Large (21px)', desc: 'Larger text for enhanced visibility' },
    { key: 'xlarge', label: 'Extra Large (24px)', desc: 'Maximum text size for highest clarity' },
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
              Accessibility &amp; Display Settings
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              Customize Saathi so everything is easy to read, see, and use.
            </p>
          </div>
        </div>
      </div>

      {/* Text Size Setting */}
      <Card className="border-2 border-stone-300 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Type className="w-6 h-6 text-amber-700" />
          <h2 className="text-2xl font-bold text-stone-900">Text Size</h2>
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

      {/* High Contrast Mode */}
      <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Eye className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              High Contrast Mode
            </h2>
            <p className="text-base text-stone-600">
              Increases contrast and uses bold borders to make buttons and text stand out sharply (WCAG AAA compliant).
            </p>
          </div>
        </div>

        <Button
          variant={preferences.highContrast ? 'primary' : 'outline'}
          size="default"
          onClick={toggleHighContrast}
          className="shrink-0"
        >
          {preferences.highContrast ? 'Enabled ✓' : 'Turn On'}
        </Button>
      </Card>

      {/* Reduced Motion */}
      <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Activity className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              Reduce Motion
            </h2>
            <p className="text-base text-stone-600">
              Stops animations and page transitions. Best for users sensitive to screen movements.
            </p>
          </div>
        </div>

        <Button
          variant={preferences.reducedMotion ? 'primary' : 'outline'}
          size="default"
          onClick={toggleReducedMotion}
          className="shrink-0"
        >
          {preferences.reducedMotion ? 'Enabled ✓' : 'Turn On'}
        </Button>
      </Card>

      {/* Explanation Level */}
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

      {/* Voice Assistant Reading (Optional Stretch - only shown if speech synthesis exists!) */}
      {isSpeechSupported && (
        <Card className="border-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Volume2 className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                Voice Audio Controls
              </h2>
              <p className="text-base text-stone-600">
                Web Speech API is available in your browser. You can click the &ldquo;Read aloud&rdquo; button beside answers and steps to hear Saathi read them.
              </p>
            </div>
          </div>

          <Button
            variant={preferences.voiceEnabled ? 'primary' : 'outline'}
            size="default"
            onClick={toggleVoiceEnabled}
            className="shrink-0"
          >
            {preferences.voiceEnabled ? 'Enabled ✓' : 'Turn On'}
          </Button>
        </Card>
      )}
    </div>
  );
}
