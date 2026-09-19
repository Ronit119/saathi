'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { getGuides, saveGuide } from '@/features/persistence/guides';
import { Guide, GuideStep } from '@/types/guide';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  ListOrdered,
  Plus,
  Play,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const SUGGESTED_GUIDES = [
  'How to change my Gmail password',
  'How to connect my phone to Wi-Fi',
  'How to make text bigger on my phone',
  'How to delete unused apps',
];

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid, isLoaded } = useAuth();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [goal, setGoal] = useState('');
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load existing guides
  useEffect(() => {
    if (!isLoaded || !uid) return;

    let isMounted = true;
    getGuides(uid).then((list) => {
      if (isMounted) {
        setGuides(list);
        setIsLoadingGuides(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded]);

  // Handle auto-population from query param (e.g. redirected from Ask page)
  useEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam) {
      setGoal(createParam);
    }
  }, [searchParams]);

  const handleCreateGuide = async (goalText?: string) => {
    const targetGoal = (goalText !== undefined ? goalText : goal).trim();
    if (!targetGoal) {
      setCreateError('Please enter what you would like to do.');
      return;
    }

    if (!uid) {
      setCreateError('Your session is initializing. Please wait a moment and try again.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/assistant/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: targetGoal }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setCreateError(
          json.error || 'I could not generate this guide right now. Please check your connection and try again.'
        );
        return;
      }

      const rawGuide = json.data;
      const guideId = 'guide_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

      const steps: GuideStep[] = rawGuide.steps.map((st: { id: string; stepNumber: number; title: string; instruction: string; explanation: string; tip?: string }, idx: number) => ({
        id: st.id || `step_${idx + 1}`,
        stepNumber: idx + 1,
        title: st.title,
        instruction: st.instruction,
        explanation: st.explanation,
        tip: st.tip,
        completed: false,
      }));

      const newGuide: Guide = {
        id: guideId,
        userId: uid,
        title: rawGuide.title,
        goal: rawGuide.goal,
        status: 'active',
        currentStepIndex: 0,
        steps,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Real persistence write
      await saveGuide(uid, newGuide);

      // Navigate to active guide viewer
      router.push(`/guides/${guideId}`);
    } catch (err: unknown) {
      console.error('Error creating guide:', err);
      setCreateError('Could not reach Saathi. Please check your connection.');
    } finally {
      setIsCreating(false);
    }
  };

  const activeGuides = guides.filter((g) => g.status !== 'completed');
  const completedGuides = guides.filter((g) => g.status === 'completed');

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Page Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <ListOrdered className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Guided Tasks
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              Saathi guides you step-by-step through any online task at your own pace.
            </p>
          </div>
        </div>
      </div>

      {/* Start New Guide Input Card */}
      <Card className="border-2 border-stone-300 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-stone-900">
            Start a New Step-by-Step Guide
          </h2>
          <p className="text-base text-stone-600">
            Tell Saathi what you want to achieve, and Saathi will break it down into easy steps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="e.g. Help me change my Gmail password"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isCreating}
              aria-label="What would you like to accomplish?"
            />
          </div>
          <Button
            variant="primary"
            size="large"
            onClick={() => handleCreateGuide()}
            isLoading={isCreating}
            disabled={isCreating || !goal.trim()}
            leftIcon={<Plus className="w-6 h-6" />}
          >
            {isCreating ? 'Creating Guide…' : 'Create Guide'}
          </Button>
        </div>

        {createError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-400 rounded-xl text-rose-900"
          >
            <AlertCircle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg">Unable to create guide</p>
              <p className="text-base">{createError}</p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => handleCreateGuide()}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
          <span className="text-sm sm:text-base font-bold text-stone-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            Common tasks to try:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_GUIDES.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setGoal(sug);
                  handleCreateGuide(sug);
                }}
                className="text-left text-base bg-stone-100 hover:bg-amber-100 text-stone-800 font-medium px-3.5 py-2 rounded-xl border border-stone-300 transition-colors cursor-pointer min-h-[44px]"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Active Guides */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-700" />
          <span>Active Guides</span>
          {activeGuides.length > 0 && (
            <Badge variant="warning">{activeGuides.length}</Badge>
          )}
        </h2>

        {isLoadingGuides ? (
          <p className="text-lg text-stone-600">Loading your guides…</p>
        ) : activeGuides.length === 0 ? (
          <Card variant="subtle" className="text-center p-8 border-dashed border-2">
            <p className="text-xl font-bold text-stone-700 mb-2">
              No active tasks right now
            </p>
            <p className="text-base text-stone-500 max-w-md mx-auto">
              When you need help doing something online, Saathi can guide you one step at a time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeGuides.map((guide) => {
              const currentStep = guide.currentStepIndex + 1;
              const total = guide.steps.length;
              return (
                <Card
                  key={guide.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-amber-300 hover:border-amber-500 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">
                        Step {currentStep} of {total}
                      </Badge>
                      <span className="text-sm text-stone-500">
                        {Math.round((currentStep / total) * 100)}% done
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                      {guide.title}
                    </h3>
                    <p className="text-base text-stone-600">
                      Current: {guide.steps[guide.currentStepIndex]?.title}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => router.push(`/guides/${guide.id}`)}
                    rightIcon={<Play className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    Continue Step {currentStep}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Guides */}
      {completedGuides.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-stone-200">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            <span>Completed Tasks</span>
            <Badge variant="success">{completedGuides.length}</Badge>
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {completedGuides.map((guide) => (
              <Card
                key={guide.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50 border-stone-300"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg sm:text-xl font-bold text-stone-800">
                    {guide.title}
                  </h3>
                  <span className="text-sm text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> All {guide.steps.length} steps completed
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="small"
                  onClick={() => router.push(`/guides/${guide.id}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Review Guide
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuidesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xl text-stone-600">Loading guides…</div>}>
      <GuidesContent />
    </Suspense>
  );
}
