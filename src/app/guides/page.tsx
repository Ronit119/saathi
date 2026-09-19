'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { useLanguage } from '@/i18n/context';
import { getGuides, saveGuide } from '@/features/persistence/guides';
import { Guide, GuideStep } from '@/types/guide';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { VoiceCompanionModal } from '@/components/voice/VoiceCompanionModal';
import {
  ListOrdered,
  Plus,
  Play,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Mic,
} from 'lucide-react';

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid, isLoaded } = useAuth();
  const { t, resolveResponseLanguage } = useLanguage();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [goal, setGoal] = useState(() => searchParams.get('create') || '');
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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

  const commonTasks = [
    'How to change my Gmail password',
    'How to connect phone to Wi-Fi',
    'How to make text bigger on phone',
    'How to delete an unused app',
  ];

  const handleCreateGuide = async (goalText?: string) => {
    const targetGoal = (goalText !== undefined ? goalText : goal).trim();
    if (!targetGoal) {
      setCreateError(t('guides.placeholder'));
      return;
    }

    if (!uid) {
      setCreateError('Your session is initializing. Please wait a moment and try again.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    const targetLang = resolveResponseLanguage(targetGoal);

    try {
      const res = await fetch('/api/assistant/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: targetGoal,
          responseLanguage: targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setCreateError(
          json.error || t('common.errorConnection')
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
        language: targetLang,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveGuide(uid, newGuide);
      router.push(`/guides/${guideId}`);
    } catch (err: unknown) {
      console.error('Error creating guide:', err);
      setCreateError(t('common.errorConnection'));
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
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 border border-teal-300 flex items-center justify-center shrink-0">
            <ListOrdered className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {t('guides.title')}
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              {t('guides.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Start New Guide Input Card */}
      <Card className="border-2 border-stone-300 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-stone-900">
            {t('guides.newTitle')}
          </h2>
          <p className="text-base text-stone-600">
            {t('guides.newDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('guides.placeholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isCreating}
              aria-label={t('guides.newTitle')}
            />
          </div>

          <Button
            variant="outline"
            size="large"
            onClick={() => setIsVoiceModalOpen(true)}
            leftIcon={<Mic className="w-5 h-5 text-amber-700" />}
            title={t('voice.tapToSpeak')}
          >
            Voice
          </Button>

          <Button
            variant="primary"
            size="large"
            onClick={() => handleCreateGuide()}
            isLoading={isCreating}
            disabled={isCreating || !goal.trim()}
            leftIcon={<Plus className="w-6 h-6" />}
          >
            {isCreating ? t('guides.creatingCta') : t('guides.createCta')}
          </Button>
        </div>

        {createError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-400 rounded-xl text-rose-900"
          >
            <AlertCircle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-bold">{createError}</p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => handleCreateGuide()}
            >
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
          <span className="text-sm sm:text-base font-bold text-stone-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            {t('guides.commonTasks')}
          </span>
          <div className="flex flex-wrap gap-2">
            {commonTasks.map((sug, idx) => (
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
          <span>{t('guides.activeTitle')}</span>
          {activeGuides.length > 0 && (
            <Badge variant="warning">{activeGuides.length}</Badge>
          )}
        </h2>

        {isLoadingGuides ? (
          <p className="text-lg text-stone-600">{t('common.loading')}</p>
        ) : activeGuides.length === 0 ? (
          <Card variant="subtle" className="text-center p-8 border-dashed border-2">
            <p className="text-xl font-bold text-stone-700 mb-2">
              {t('guides.noActiveTitle')}
            </p>
            <p className="text-base text-stone-500 max-w-md mx-auto">
              {t('guides.noActiveDesc')}
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
                        {t('guides.stepOf', { current: currentStep, total })}
                      </Badge>
                      <span className="text-sm text-stone-500 font-medium">
                        {t('guides.percentDone', { percent: Math.round((currentStep / total) * 100) })}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                      {guide.title}
                    </h3>
                    <p className="text-base text-stone-600">
                      {guide.steps[guide.currentStepIndex]?.title}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => router.push(`/guides/${guide.id}`)}
                    rightIcon={<Play className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    {t('guides.continueStep', { step: currentStep })}
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
            <span>{t('guides.completedTitle')}</span>
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
                    <CheckCircle2 className="w-4 h-4" /> {t('guides.allCompleted', { count: guide.steps.length })}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="small"
                  onClick={() => router.push(`/guides/${guide.id}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {t('guides.reviewGuide')}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Voice Companion Modal */}
      <VoiceCompanionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default function GuidesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xl text-stone-600">Loading…</div>}>
      <GuidesContent />
    </Suspense>
  );
}
