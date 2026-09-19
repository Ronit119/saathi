'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { useLanguage } from '@/i18n/context';
import { formatRelativeLocaleDay } from '@/i18n/formatters';
import { getReminders } from '@/features/persistence/reminders';
import { getGuides } from '@/features/persistence/guides';
import { Reminder } from '@/types/reminder';
import { Guide } from '@/types/guide';
import { ProactiveSuggestionResponse } from '@/types/assistant';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VoiceCompanionModal } from '@/components/voice/VoiceCompanionModal';
import {
  HelpCircle,
  ListOrdered,
  Bell,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Play,
  Calendar,
  HeartHandshake,
  Sun,
  Moon,
  Sunset,
  Mic,
  Send,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { uid, isLoaded } = useAuth();
  const { t, uiLocale } = useLanguage();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Unified composer state
  const [composerText, setComposerText] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('home.greeting.morning'), icon: Sun };
    if (hour < 17) return { text: t('home.greeting.afternoon'), icon: Sunset };
    return { text: t('home.greeting.evening'), icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  useEffect(() => {
    const currentUid = uid;
    if (!isLoaded || !currentUid) return;

    let isMounted = true;

    async function loadDashboardState(userId: string) {
      try {
        const [loadedReminders, loadedGuides] = await Promise.all([
          getReminders(userId),
          getGuides(userId),
        ]);

        if (!isMounted) return;

        setReminders(loadedReminders);
        setGuides(loadedGuides);
        setIsLoadingData(false);

        const upcoming = loadedReminders
          .filter((r) => !r.completed)
          .map((r) => ({
            id: r.id,
            title: r.title,
            dueTimestamp: r.dueTimestamp,
            dueDateString: r.dueDateString,
          }));

        const active = loadedGuides
          .filter((g) => g.status === 'active')
          .map((g) => ({
            id: g.id,
            title: g.title,
            currentStepIndex: g.currentStepIndex,
            totalSteps: g.steps.length,
            currentStepTitle: g.steps[g.currentStepIndex]?.title || 'Active Step',
          }));

        // Fetch proactive advice only when real items exist
        if (upcoming.length > 0 || active.length > 0) {
          try {
            const res = await fetch('/api/assistant/proactive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                upcomingReminders: upcoming,
                activeGuides: active,
                responseLanguage: uiLocale,
              }),
            });
            const json = await res.json();
            if (json.data && json.data.hasSuggestion && isMounted) {
              setProactiveSuggestion(json.data);
            }
          } catch (aiErr) {
            console.warn('Proactive suggestion check failed:', aiErr);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadDashboardState(currentUid);

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded, uiLocale]);

  const handleComposerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = composerText.trim();
    if (!query) return;

    // Check if user is asking to do something / guide
    const lower = query.toLowerCase();
    if (/^(help me|how to|guide me|ਕਿਵੇਂ|ਸਿਖਾਓ|सिखाओ|ఎలా|எப்படி)/i.test(lower)) {
      router.push(`/guides?create=${encodeURIComponent(query)}`);
    } else {
      router.push(`/ask?query=${encodeURIComponent(query)}`);
    }
  };

  const activeGuides = guides.filter((g) => g.status === 'active');
  const upcomingReminders = reminders.filter((r) => !r.completed);
  const mostRecentActiveGuide = activeGuides[0];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Warm Greeting & Hero Question */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-stone-700 font-bold text-lg sm:text-xl">
          <GreetingIcon className="w-6 h-6 text-amber-700 shrink-0" />
          <span>{greeting.text}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          {t('home.heroTitle')}
        </h1>
        <p className="text-lg sm:text-xl text-stone-600 leading-relaxed max-w-2xl">
          {t('home.heroSubtitle')}
        </p>
      </div>

      {/* Primary Companion Input: Unified Composer with Prominent Microphone */}
      <div className="w-full bg-white rounded-3xl border-2 border-stone-300 p-2 sm:p-3 shadow-md focus-within:border-amber-600 transition-colors">
        <form onSubmit={handleComposerSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder={t('home.composerPlaceholder')}
            className="flex-1 text-lg sm:text-xl px-4 py-3 bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-none min-h-[52px]"
            aria-label={t('home.composerPlaceholder')}
          />

          {composerText.trim() ? (
            <button
              type="submit"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
              aria-label={t('ask.submit.explain')}
            >
              <Send className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              aria-label={t('home.micAriaLabel')}
              title={t('home.micAriaLabel')}
            >
              <Mic className="w-7 h-7" />
            </button>
          )}
        </form>
      </div>

      {/* Proactive Suggestion Banner (Real State Only) */}
      {proactiveSuggestion && proactiveSuggestion.hasSuggestion && (
        <Card
          variant="accent"
          className="border-2 border-amber-400 bg-amber-50 p-5 sm:p-6 animate-fadeIn"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-amber-900 uppercase">
                  {t('home.proactive.title')}
                </span>
                <p className="text-lg sm:text-xl font-bold text-stone-900">
                  {proactiveSuggestion.message}
                </p>
              </div>
            </div>

            {proactiveSuggestion.actionUrl && (
              <Button
                variant="primary"
                size="default"
                onClick={() => router.push(proactiveSuggestion.actionUrl!)}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="shrink-0 font-bold"
              >
                {proactiveSuggestion.actionText || 'Take Action'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Four Primary Human Intent Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Understand Something */}
        <Link
          href="/ask?mode=explain"
          className="p-5 sm:p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-amber-900">
                {t('home.actions.explainTitle')}
              </h2>
              <p className="text-base text-stone-600 leading-relaxed">
                {t('home.actions.explainDesc')}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-amber-800 flex items-center gap-1 self-end">
            {t('home.actions.explainCta')} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* 2. Do Something / Guides */}
        <Link
          href="/guides"
          className="p-5 sm:p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-teal-500 hover:bg-teal-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
              <ListOrdered className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-teal-900">
                {t('home.actions.guideTitle')}
              </h2>
              <p className="text-base text-stone-600 leading-relaxed">
                {t('home.actions.guideDesc')}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-teal-800 flex items-center gap-1 self-end">
            {t('home.actions.guideCta')} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* 3. Check If Something Is Safe (Scam Checker) */}
        <Link
          href="/ask?mode=safety"
          className="p-5 sm:p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-emerald-900">
                {t('home.actions.safetyTitle')}
              </h2>
              <p className="text-base text-stone-600 leading-relaxed">
                {t('home.actions.safetyDesc')}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-emerald-800 flex items-center gap-1 self-end">
            {t('home.actions.safetyCta')} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* 4. Remember Something / Reminders */}
        <Link
          href="/reminders"
          className="p-5 sm:p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Bell className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-amber-900">
                {t('home.actions.reminderTitle')}
              </h2>
              <p className="text-base text-stone-600 leading-relaxed">
                {t('home.actions.reminderDesc')}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-amber-800 flex items-center gap-1 self-end">
            {t('home.actions.reminderCta')} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      {/* MY DAY: Real Connected State */}
      <div className="flex flex-col gap-4 pt-4 border-t-2 border-stone-200">
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-amber-700" />
          <span>{t('home.myDay.title')}</span>
        </h2>

        {isLoadingData ? (
          <p className="text-lg text-stone-600">{t('common.loading')}</p>
        ) : activeGuides.length === 0 && upcomingReminders.length === 0 ? (
          /* Calm empty state */
          <Card variant="subtle" className="text-center p-7 sm:p-10 border-dashed border-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <HeartHandshake className="w-9 h-9" />
            </div>
            <p className="text-2xl font-bold text-stone-800 mb-2">
              {t('home.myDay.emptyTitle')}
            </p>
            <p className="text-lg text-stone-600 max-w-md mx-auto mb-6">
              {t('home.myDay.emptyDesc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="default" onClick={() => router.push('/ask')}>
                {t('home.myDay.askCta')}
              </Button>
              <Button variant="outline" size="default" onClick={() => router.push('/reminders')}>
                {t('home.myDay.reminderCta')}
              </Button>
            </div>
          </Card>
        ) : (
          /* Real Connected Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Guide Card */}
            {mostRecentActiveGuide ? (
              <Card className="border-2 border-amber-300 bg-amber-50/40 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="warning">{t('home.myDay.activeGuide')}</Badge>
                    <span className="text-sm font-bold text-stone-600">
                      {t('home.myDay.stepOf', {
                        current: mostRecentActiveGuide.currentStepIndex + 1,
                        total: mostRecentActiveGuide.steps.length,
                      })}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                    {mostRecentActiveGuide.title}
                  </h3>
                  <p className="text-base text-stone-700">
                    {t('home.myDay.nextStep', {
                      title: mostRecentActiveGuide.steps[mostRecentActiveGuide.currentStepIndex]?.title || '',
                    })}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="default"
                  onClick={() => router.push(`/guides/${mostRecentActiveGuide.id}`)}
                  rightIcon={<Play className="w-5 h-5" />}
                >
                  {t('home.myDay.continueGuide')}
                </Button>
              </Card>
            ) : null}

            {/* Upcoming Reminders Card */}
            {upcomingReminders.length > 0 ? (
              <Card className="border-2 border-emerald-300 bg-emerald-50/30 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="success">{t('home.myDay.upcomingReminders')}</Badge>
                    <span className="text-sm font-bold text-stone-600">
                      {upcomingReminders.length}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2 pt-1">
                    {upcomingReminders.slice(0, 3).map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-2 text-base text-stone-900 border-b border-emerald-200/60 pb-1.5 last:border-none">
                        <span className="font-semibold truncate">{r.title}</span>
                        <span className="text-sm text-stone-600 shrink-0 font-medium">
                          {formatRelativeLocaleDay(r.dueTimestamp, uiLocale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => router.push('/reminders')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t('home.myDay.viewAllReminders')}
                </Button>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      {/* Voice Companion Modal */}
      <VoiceCompanionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
