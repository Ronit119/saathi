'use client';

import React, { useState, useMemo } from 'react';
import { parseReminderInput } from '@/lib/dates/parseReminder';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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

const EXAMPLE_REMINDERS = [
  'Remind me tomorrow at 9 AM to take blood pressure medicine',
  'Remind me tomorrow at 7 PM to pay electricity bill',
  'Remind me on Sunday at 11 AM to call family',
];

export function ReminderForm({ onSave, isLoading = false }: ReminderFormProps) {
  const [input, setInput] = useState('');
  const [showManualDate, setShowManualDate] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('09:00');
  const [formError, setFormError] = useState<string | null>(null);

  // Derive parsed reminder result deterministically without setState in effect
  const parsed = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return parseReminderInput(trimmed);
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    let finalTitle = '';
    let finalTimestamp = 0;
    let finalDateString = '';

    if (showManualDate) {
      if (!input.trim()) {
        setFormError('Please enter what you want to be reminded about.');
        return;
      }
      if (!manualDate) {
        setFormError('Please select a date for the reminder.');
        return;
      }
      const combined = new Date(`${manualDate}T${manualTime || '09:00'}:00`);
      if (isNaN(combined.getTime())) {
        setFormError('Please select a valid date and time.');
        return;
      }
      finalTitle = input.trim();
      finalTimestamp = combined.getTime();
      finalDateString = combined.toLocaleString();
    } else {
      if (!parsed || !parsed.success || !parsed.dueTimestamp) {
        setFormError(
          parsed?.error ||
            'Could not recognize a clear date or time. You can also pick a date manually below.'
        );
        return;
      }
      finalTitle = parsed.title;
      finalTimestamp = parsed.dueTimestamp;
      finalDateString = parsed.dueDateFormatted;
    }

    try {
      await onSave({
        title: finalTitle,
        originalInput: input,
        dueTimestamp: finalTimestamp,
        dueDateString: finalDateString,
      });
      setInput('');
      setShowManualDate(false);
    } catch (err: unknown) {
      console.error('Error saving reminder:', err);
      setFormError('Could not save reminder. Please try again.');
    }
  };

  return (
    <Card className="border-2 border-stone-300 p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-700" />
            <span>Set a New Reminder</span>
          </h2>
          <p className="text-base text-stone-600">
            Type naturally, for example: &ldquo;Remind me tomorrow at 7 PM to pay bill&rdquo;
          </p>
        </div>

        {/* Natural Language Input */}
        <Input
          placeholder="e.g. Remind me tomorrow at 7 PM to pay electricity bill"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          aria-label="What and when should Saathi remind you?"
        />

        {/* Interpreted Preview Card (Deterministic Parsing) */}
        {parsed && parsed.success && !showManualDate && (
          <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex flex-col gap-1.5 animate-fadeIn">
            <span className="text-sm font-bold text-emerald-900 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Understood Reminder:
            </span>
            <p className="text-xl font-bold text-stone-900">
              &ldquo;{parsed.title}&rdquo;
            </p>
            <p className="text-base font-semibold text-emerald-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              Scheduled for: {parsed.dueDateFormatted}
            </p>
          </div>
        )}

        {/* Ambiguity notice */}
        {parsed && parsed.isAmbiguous && !showManualDate && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-base flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Time not completely specified</p>
              <p className="text-sm">
                We defaulted to morning (9:00 AM). You can adjust using the date picker below.
              </p>
            </div>
          </div>
        )}

        {/* Manual Date & Time Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setShowManualDate(!showManualDate)}
            className="text-base font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer py-1"
          >
            {showManualDate ? (
              <>
                <ChevronUp className="w-5 h-5" /> Hide manual date/time picker
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" /> Pick specific date & time manually
              </>
            )}
          </button>

          {showManualDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-4 bg-stone-50 rounded-xl border border-stone-300 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <label htmlFor="reminder-date" className="font-bold text-base text-stone-800">
                  Date
                </label>
                <input
                  id="reminder-date"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="min-h-[48px] px-3 py-2 border rounded-xl border-stone-300 bg-white text-stone-900 text-lg"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="reminder-time" className="font-bold text-base text-stone-800">
                  Time
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="min-h-[48px] px-3 py-2 border rounded-xl border-stone-300 bg-white text-stone-900 text-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {formError && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-400 rounded-xl text-rose-900 text-base font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Quick Example Suggestions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
          <span className="text-sm font-bold text-stone-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            Quick reminder ideas:
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_REMINDERS.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(ex)}
                className="text-left text-sm sm:text-base bg-stone-100 hover:bg-amber-100 text-stone-800 font-medium px-3 py-1.5 rounded-xl border border-stone-300 transition-colors cursor-pointer min-h-[40px]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="large"
            isLoading={isLoading}
            disabled={isLoading || !input.trim()}
            leftIcon={<Bell className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Saving Reminder…' : 'Save Reminder'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
