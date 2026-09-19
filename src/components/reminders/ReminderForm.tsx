'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import { parseReminderInput } from '@/lib/dates/parseReminder';
import { detectLanguageFromText } from '@/i18n/detectLanguage';
import { formatLocaleDate } from '@/i18n/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VoiceCompanionModal } from '@/components/voice/VoiceCompanionModal';
import {
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mic,
} from 'lucide-react';

export interface ReminderFormProps {
  onSave: (reminder: {
    title: string;
    originalInput: string;
    dueTimestamp: number;
    dueDateString: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ReminderForm({ onSave, isLoading = false }: ReminderFormProps) {
  const { t, uiLocale, resolveResponseLanguage } = useLanguage();

  const [input, setInput] = useState('');
  const [showManualDate, setShowManualDate] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('09:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Multilingual confirmation state
  const [aiConfirmation, setAiConfirmation] = useState<{
    title: string;
    scheduledAt: string;
    formattedUnderstanding: string;
  } | null>(null);

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Deterministic chrono parse for English
  const englishParsed = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const detected = detectLanguageFromText(trimmed);
    if (detected.language === 'en-IN') {
      return parseReminderInput(trimmed);
    }
    return null;
  }, [input]);

  const examples = [
    'Remind me tomorrow at 9 AM to take blood pressure medicine',
    'कल शाम 7 बजे बिजली का बिल भरने की याद दिलाना',
    'ਕੱਲ੍ਹ ਸ਼ਾਮ 7 ਵਜੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਭਰਨ ਦੀ ਯਾਦ ਦਿਵਾਉ',
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const trimmed = input.trim();
    if (!trimmed) {
      setFormError(t('reminders.inputLabel'));
      return;
    }

    // Manual date mode
    if (showManualDate) {
      if (!manualDate) {
        setFormError('Please pick a date for your reminder.');
        return;
      }
      const combined = new Date(`${manualDate}T${manualTime || '09:00'}:00`);
      if (isNaN(combined.getTime())) {
        setFormError('Invalid date or time selected.');
        return;
      }
      if (combined.getTime() < Date.now()) {
        setFormError('This time has already passed. Please select a future time.');
        return;
      }

      await onSave({
        title: trimmed,
        originalInput: trimmed,
        dueTimestamp: combined.getTime(),
        dueDateString: formatLocaleDate(combined, uiLocale),
      });

      setInput('');
      setShowManualDate(false);
      return;
    }

    // English with high certainty chrono parse
    if (englishParsed && englishParsed.success && englishParsed.dueDate && !englishParsed.isAmbiguous) {
      await onSave({
        title: englishParsed.title,
        originalInput: trimmed,
        dueTimestamp: englishParsed.dueTimestamp!,
        dueDateString: englishParsed.dueDateFormatted,
      });
      setInput('');
      return;
    }

    // Non-English or complex: use Gemini multilingual extraction with confirmation preview
    setIsExtracting(true);
    const targetLang = resolveResponseLanguage(trimmed);

    try {
      const res = await fetch('/api/assistant/extract-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          referenceDateIso: new Date().toISOString(),
          userLanguage: targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setFormError(json.error || 'Could not understand date and time. Please pick manually below.');
        setShowManualDate(true);
        return;
      }

      const extracted = json.data;
      setAiConfirmation({
        title: extracted.title,
        scheduledAt: extracted.scheduledAt,
        formattedUnderstanding: extracted.formattedUnderstanding,
      });
    } catch (err) {
      console.error('Extraction error:', err);
      setFormError('Could not understand date and time. Please pick manually below.');
      setShowManualDate(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmAiReminder = async () => {
    if (!aiConfirmation) return;
    const dateObj = new Date(aiConfirmation.scheduledAt);
    await onSave({
      title: aiConfirmation.title,
      originalInput: input,
      dueTimestamp: dateObj.getTime(),
      dueDateString: formatLocaleDate(dateObj, uiLocale),
    });

    setAiConfirmation(null);
    setInput('');
  };

  return (
    <Card className="border-2 border-stone-300 p-6 sm:p-7 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-amber-700" />
          <h2 className="text-2xl font-bold text-stone-900">{t('reminders.title')}</h2>
        </div>

        <Button
          variant="outline"
          size="small"
          onClick={() => setIsVoiceModalOpen(true)}
          leftIcon={<Mic className="w-5 h-5 text-amber-700" />}
        >
          {t('reminders.voiceDictate')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reminder-input" className="text-lg font-bold text-stone-900">
            {t('reminders.inputLabel')}
          </label>
          <Input
            id="reminder-input"
            placeholder={t('reminders.inputPlaceholder')}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setAiConfirmation(null);
            }}
            disabled={isLoading || isExtracting}
          />
        </div>

        {/* Examples */}
        {!aiConfirmation && !input && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-stone-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              {t('reminders.examplesTitle')}
            </span>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInput(ex)}
                  className="text-left text-sm sm:text-base bg-stone-100 hover:bg-amber-100 text-stone-800 font-medium px-3 py-1.5 rounded-xl border border-stone-300 transition-colors cursor-pointer min-h-[44px]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Confirmation Preview Box (Multilingual "I understood this as...") */}
        {aiConfirmation && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-base uppercase">
              <Sparkles className="w-5 h-5 text-amber-700" />
              <span>{t('reminders.confirmation.understoodAs')}</span>
            </div>
            <p className="text-xl font-bold text-stone-900">
              {aiConfirmation.formattedUnderstanding}
            </p>
            <p className="text-base text-stone-700">
              Task: <strong>{aiConfirmation.title}</strong>
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="default"
                onClick={handleConfirmAiReminder}
                isLoading={isLoading}
                rightIcon={<CheckCircle2 className="w-5 h-5" />}
                className="bg-emerald-700 hover:bg-emerald-800 border-emerald-800 font-bold"
              >
                {t('reminders.confirmation.confirmAndSave')}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setAiConfirmation(null);
                  setShowManualDate(true);
                }}
              >
                {t('reminders.confirmation.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* English Parsed Preview */}
        {!aiConfirmation && englishParsed && englishParsed.success && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-950 text-base">Understood Scheduled Time:</p>
              <p className="text-lg font-bold text-stone-900">{englishParsed.dueDateFormatted}</p>
              <p className="text-base text-stone-700">Task: {englishParsed.title}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-400 rounded-xl text-rose-900 text-base flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Manual Date/Time Toggle */}
        <div className="border-t border-stone-200 pt-3">
          <button
            type="button"
            onClick={() => setShowManualDate(!showManualDate)}
            className="text-base font-bold text-stone-700 hover:text-stone-900 flex items-center gap-2 cursor-pointer py-1"
          >
            <Clock className="w-5 h-5 text-amber-700" />
            <span>{t('reminders.scheduleTime')}</span>
            {showManualDate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showManualDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-date" className="text-sm font-bold text-stone-700">
                  Date
                </label>
                <input
                  id="manual-date"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="p-3 rounded-xl border-2 border-stone-300 bg-white text-base text-stone-900 focus:border-amber-600 focus:outline-none min-h-[48px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="manual-time" className="text-sm font-bold text-stone-700">
                  Time
                </label>
                <input
                  id="manual-time"
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="p-3 rounded-xl border-2 border-stone-300 bg-white text-base text-stone-900 focus:border-amber-600 focus:outline-none min-h-[48px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {!aiConfirmation && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isLoading || isExtracting}
              disabled={isLoading || isExtracting || !input.trim()}
              className="w-full sm:w-auto font-bold"
            >
              {isExtracting
                ? t('reminders.savingCta')
                : isLoading
                ? t('common.loading')
                : t('reminders.saveCta')}
            </Button>
          </div>
        )}
      </form>

      {/* Voice Modal */}
      <VoiceCompanionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </Card>
  );
}
