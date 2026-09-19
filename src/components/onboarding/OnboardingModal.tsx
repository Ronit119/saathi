'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { getUserPreferences, saveUserPreferences } from '@/features/persistence/preferences';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextSizePreference } from '@/types/user';
import {
  HeartHandshake,
  Globe,
  Type,
  Mic,
  ArrowRight,
  Check,
} from 'lucide-react';

export function OnboardingModal() {
  const { uid, isLoaded } = useAuth();
  const { uiLocale, setUiLocale } = useLanguage();
  const { preferences, updateTextSize } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isLoaded || !uid) return;

    let isMounted = true;
    getUserPreferences(uid).then((prefs) => {
      if (isMounted) {
        // Show onboarding if not yet marked completed
        if (!prefs.onboardingCompleted) {
          setIsOpen(true);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded]);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsOpen(false);
    if (uid) {
      const current = await getUserPreferences(uid);
      await saveUserPreferences(uid, { ...current, onboardingCompleted: true });
    }
  };

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await setUiLocale(code);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn"
    >
      <Card className="max-w-xl w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border-2 border-stone-300 relative bg-white max-h-[92vh] overflow-y-auto">
        {/* Step Indicator & Skip */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">
            Step {currentStep} of 4
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="text-sm font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer py-1 px-2"
          >
            Skip intro
          </button>
        </div>

        {/* STEP 1: Welcome */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center gap-4 py-3">
            <div className="w-20 h-20 rounded-3xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <HeartHandshake className="w-12 h-12" aria-hidden="true" />
            </div>
            <h2 id="onboarding-step-title" className="text-3xl font-black text-stone-900 tracking-tight">
              Hello, I&apos;m Saathi.
            </h2>
            <p className="text-xl text-stone-700 leading-relaxed max-w-md">
              I am here to make everyday phones, bills, and digital messages easy, safe, and stress-free for you.
            </p>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-stone-800 text-base font-medium max-w-md">
              💡 <em>You can always ask me questions, go at your own pace, or speak in your own language.</em>
            </div>
          </div>
        )}

        {/* STEP 2: Language Selection */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 id="onboarding-step-title" className="text-2xl font-black text-stone-900">
                  How should Saathi speak with you?
                </h2>
                <p className="text-base text-stone-600">Choose your language:</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
              {Object.values(SUPPORTED_LANGUAGES).map((lang) => {
                const isSelected = uiLocale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between text-left transition-all cursor-pointer min-h-[56px] ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-400 text-stone-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">{lang.nativeName}</span>
                      <span className="text-xs text-stone-500">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-amber-700 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Text Size */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
                <Type className="w-6 h-6" />
              </div>
              <div>
                <h2 id="onboarding-step-title" className="text-2xl font-black text-stone-900">
                  Make text comfortable for your eyes
                </h2>
                <p className="text-base text-stone-600">Pick a comfortable text size:</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xlarge'] as TextSizePreference[]).map((size) => {
                const isSelected = preferences.textSize === size;
                const labels = {
                  normal: 'Normal (18px)',
                  large: 'Large (21px)',
                  xlarge: 'Extra Large (24px)',
                };
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateTextSize(size)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[70px] ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-400 text-stone-800'
                    }`}
                  >
                    <span className="text-base font-bold">{labels[size].split(' ')[0]}</span>
                    <span className="text-xs text-stone-500">{labels[size].split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl border border-stone-300 bg-stone-50">
              <p className="text-base font-bold text-stone-600 uppercase mb-1">Preview:</p>
              <p className="text-stone-900 font-medium">
                This is how text will look inside Saathi. You can change this anytime from the top bar.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Voice Introduction */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Mic className="w-9 h-9" />
            </div>
            <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-black text-stone-900">
              You can type or speak to Saathi
            </h2>
            <p className="text-lg text-stone-700 leading-relaxed max-w-md">
              Whenever you see the microphone button, you can tap it and speak naturally in your preferred language. Saathi will listen, answer, and speak back to you!
            </p>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 text-sm font-bold">
              🔒 Saathi only listens when you tap the microphone. Your privacy is always protected.
            </div>
          </div>
        )}

        {/* Next / Back / Complete buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              variant="primary"
              size="large"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="large"
              onClick={handleFinish}
              rightIcon={<Check className="w-5 h-5" />}
              className="bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
            >
              Get Started with Saathi
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
