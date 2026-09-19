'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { getReminders } from '@/features/persistence/reminders';
import { getGuides } from '@/features/persistence/guides';
import { Reminder } from '@/types/reminder';
import { Guide } from '@/types/guide';
import { ProactiveSuggestionResponse } from '@/types/assistant';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeDay } from '@/lib/utils';
import {
  HelpCircle,
  ListOrdered,
  Bell,
  Sparkles,
  ArrowRight,
  Play,
  Calendar,
  HeartHandshake,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { uid, isLoaded } = useAuth();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun };
    if (hour < 17) return { text: 'Good afternoon', icon: Sunset };
    return { text: 'Good evening', icon: Moon };
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

        // Filter active items for proactive AI evaluation
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

        // If there is genuine stored state, ask Gemini for a proactive suggestion
        if (upcoming.length > 0 || active.length > 0) {
          try {
            const res = await fetch('/api/assistant/proactive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                upcomingReminders: upcoming,
                activeGuides: active,
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
  }, [uid, isLoaded]);

  const activeGuides = guides.filter((g) => g.status === 'active');
  const upcomingReminders = reminders.filter((r) => !r.completed);
  const mostRecentActiveGuide = activeGuides[0];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Warm Greeting & Hero Question */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-stone-600 font-bold text-xl">
          <GreetingIcon className="w-6 h-6 text-amber-700" />
          <span>{greeting.text}, friend.</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          What can I help you with today?
        </h1>
        <p className="text-lg sm:text-xl text-stone-600">
          I am Saathi. I can simplify confusing messages, guide you through tasks step-by-step, or remember things for you.
        </p>
      </div>

      {/* Proactive Suggestion Banner (Based ONLY on Real Stored State) */}
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
                  Saathi&apos;s Suggestion for Today
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
                className="shrink-0"
              >
                {proactiveSuggestion.actionText || 'Take Action'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Primary 3 Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: Help Me Understand */}
        <Link
          href="/ask"
          className="p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 group-hover:text-amber-900">
              Explain Something
            </h2>
            <p className="text-base text-stone-600">
              Understand OTP, 2FA, bill messages, or confusing notifications in plain language.
            </p>
          </div>
          <span className="text-base font-bold text-amber-800 flex items-center gap-1">
            Ask Saathi <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* Action 2: Guided Tasks */}
        <Link
          href="/guides"
          className="p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <ListOrdered className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 group-hover:text-sky-900">
              Help Me Do Something
            </h2>
            <p className="text-base text-stone-600">
              Get an interactive, patient step-by-step guide for any digital task.
            </p>
          </div>
          <span className="text-base font-bold text-sky-800 flex items-center gap-1">
            Start a guide <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* Action 3: Reminders */}
        <Link
          href="/reminders"
          className="p-6 rounded-2xl border-2 border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50/40 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none shadow-xs"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Bell className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 group-hover:text-emerald-900">
              Set a Reminder
            </h2>
            <p className="text-base text-stone-600">
              Tell Saathi in normal words when to remind you about bills or medicine.
            </p>
          </div>
          <span className="text-base font-bold text-emerald-800 flex items-center gap-1">
            View reminders <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      {/* MY DAY: Real Connected State */}
      <div className="flex flex-col gap-4 pt-4 border-t-2 border-stone-200">
        <h2 className="text-3xl font-black text-stone-900 flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-amber-700" />
          <span>My Day</span>
        </h2>

        {isLoadingData ? (
          <p className="text-lg text-stone-600">Checking your day…</p>
        ) : activeGuides.length === 0 && upcomingReminders.length === 0 ? (
          /* Intentionally designed warm EMPTY STATE */
          <Card variant="subtle" className="text-center p-8 sm:p-10 border-dashed border-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <HeartHandshake className="w-9 h-9" />
            </div>
            <p className="text-2xl font-bold text-stone-800 mb-2">
              Nothing you need to remember today.
            </p>
            <p className="text-lg text-stone-600 max-w-md mx-auto mb-6">
              You are all caught up! You can ask Saathi to explain a confusing concept, or start a guided task above.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="default" onClick={() => router.push('/ask')}>
                Ask Saathi something
              </Button>
              <Button variant="outline" size="default" onClick={() => router.push('/reminders')}>
                Add a reminder
              </Button>
            </div>
          </Card>
        ) : (
          /* REAL Stored State Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Guide Card */}
            {mostRecentActiveGuide ? (
              <Card className="border-2 border-amber-300 bg-amber-50/40 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="warning">Active Guide</Badge>
                    <span className="text-sm font-bold text-stone-600">
                      Step {mostRecentActiveGuide.currentStepIndex + 1} of{' '}
                      {mostRecentActiveGuide.steps.length}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                    {mostRecentActiveGuide.title}
                  </h3>
                  <p className="text-base text-stone-700">
                    Next step:{' '}
                    <strong>
                      {mostRecentActiveGuide.steps[mostRecentActiveGuide.currentStepIndex]?.title}
                    </strong>
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="default"
                  onClick={() => router.push(`/guides/${mostRecentActiveGuide.id}`)}
                  rightIcon={<Play className="w-5 h-5" />}
                >
                  Continue Guide
                </Button>
              </Card>
            ) : (
              <Card variant="subtle" className="border-stone-200 flex flex-col justify-center p-6 text-center">
                <p className="text-lg font-bold text-stone-700">No unfinished tasks</p>
                <p className="text-base text-stone-500 mb-3">All guided tasks are completed.</p>
                <Button variant="outline" size="small" onClick={() => router.push('/guides')}>
                  Start a new guide
                </Button>
              </Card>
            )}

            {/* Upcoming Reminders Card */}
            {upcomingReminders.length > 0 ? (
              <Card className="border-2 border-emerald-300 bg-emerald-50/30 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="success">Upcoming Reminders</Badge>
                    <span className="text-sm font-bold text-stone-600">
                      {upcomingReminders.length} reminder{upcomingReminders.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2 pt-1">
                    {upcomingReminders.slice(0, 3).map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-2 text-base text-stone-900 border-b border-emerald-200/60 pb-1.5 last:border-none">
                        <span className="font-semibold truncate">{r.title}</span>
                        <span className="text-sm text-stone-600 shrink-0 font-medium">
                          {formatRelativeDay(r.dueTimestamp)}
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
                  View All Reminders
                </Button>
              </Card>
            ) : (
              <Card variant="subtle" className="border-stone-200 flex flex-col justify-center p-6 text-center">
                <p className="text-lg font-bold text-stone-700">No upcoming reminders</p>
                <p className="text-base text-stone-500 mb-3">You have no scheduled reminders.</p>
                <Button variant="outline" size="small" onClick={() => router.push('/reminders')}>
                  Create a reminder
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
