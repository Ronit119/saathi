'use client';

import React, { useState } from 'react';
import { Guide, GuideStep } from '@/types/guide';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SpeechButton } from '@/components/ui/SpeechButton';
import { ContextHelpDialog } from '@/components/assistant/ContextHelpDialog';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Search,
  Sparkles,
  Award,
} from 'lucide-react';

export interface StepViewerProps {
  guide: Guide;
  onStepComplete: (stepIndex: number) => Promise<void>;
  onStepChange: (newIndex: number) => Promise<void>;
  onGuideStatusChange: (status: 'active' | 'completed' | 'paused') => Promise<void>;
}

export function StepViewer({
  guide,
  onStepComplete,
  onStepChange,
  onGuideStatusChange,
}: StepViewerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [initialHelpQuestion, setInitialHelpQuestion] = useState('');
  const [writeError, setWriteError] = useState<string | null>(null);

  const currentStep: GuideStep | undefined = guide.steps[guide.currentStepIndex];
  const isCompleted = guide.status === 'completed';
  const totalSteps = guide.steps.length;
  const currentStepNumber = guide.currentStepIndex + 1;

  const handleDone = async () => {
    setWriteError(null);
    setIsUpdating(true);
    try {
      await onStepComplete(guide.currentStepIndex);
    } catch (err: unknown) {
      console.error('Failed to complete step:', err);
      setWriteError('Could not save progress. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrevious = async () => {
    if (guide.currentStepIndex > 0) {
      setWriteError(null);
      setIsUpdating(true);
      try {
        await onStepChange(guide.currentStepIndex - 1);
      } catch (err: unknown) {
        console.error('Failed to change step:', err);
        setWriteError('Could not change step. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };


  const openHelp = (defaultPrompt: string) => {
    setInitialHelpQuestion(defaultPrompt);
    setHelpDialogOpen(true);
  };

  if (isCompleted) {
    return (
      <Card variant="accent" className="flex flex-col items-center text-center p-8 sm:p-12 border-2 border-emerald-500 bg-emerald-50/50">
        <div className="w-20 h-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm">
          <Award className="w-12 h-12" aria-hidden="true" />
        </div>
        <Badge variant="success" className="mb-3 text-lg px-4 py-1.5">
          Task Completed!
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mb-3">
          Well Done! You finished this task!
        </h2>
        <p className="text-xl text-stone-700 max-w-xl mb-8">
          You have successfully completed all steps for <strong>&ldquo;{guide.title}&rdquo;</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="outline"
            size="large"
            onClick={() => onStepChange(0)}
          >
            Review Steps from Beginning
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => onGuideStatusChange('active')}
          >
            Restart Task
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentStep) {
    return <div>Step not found</div>;
  }

  const stepTextToRead = `
    Step ${currentStepNumber} of ${totalSteps}.
    ${currentStep.title}.
    Instruction: ${currentStep.instruction}.
    Explanation: ${currentStep.explanation}.
    ${currentStep.tip ? `Tip: ${currentStep.tip}` : ''}
  `;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto" aria-live="polite">
      {/* Header card with progress */}
      <Card className="border-2 border-amber-300 bg-amber-50/40">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm sm:text-base font-bold text-amber-900 tracking-wide uppercase">
                Step by step guide
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {guide.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <SpeechButton textToRead={stepTextToRead} label="Read step aloud" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-base font-bold text-stone-700">
              <span>Step {currentStepNumber} of {totalSteps}</span>
              <span>{Math.round((currentStepNumber / totalSteps) * 100)}% Completed</span>
            </div>
            <div
              className="w-full h-4 bg-stone-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={currentStepNumber}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Step ${currentStepNumber} of ${totalSteps}`}
            >
              <div
                className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main active step card */}
      <Card className="border-2 border-stone-400 p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-amber-700 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
            {currentStepNumber}
          </span>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
              {currentStep.title}
            </h2>
          </div>
        </div>

        {/* Physical action instruction */}
        <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-300">
          <div className="text-sm font-bold text-stone-600 uppercase mb-1">
            What to do:
          </div>
          <p className="text-xl sm:text-2xl text-stone-900 font-semibold leading-relaxed">
            {currentStep.instruction}
          </p>
        </div>

        {/* Explanation of what they see */}
        <div className="flex flex-col gap-1.5">
          <div className="text-base font-bold text-stone-700 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-700" />
            <span>What you will see on your screen:</span>
          </div>
          <p className="text-lg sm:text-xl text-stone-800 leading-relaxed font-normal pl-7">
            {currentStep.explanation}
          </p>
        </div>

        {/* Tip (if present) */}
        {currentStep.tip && (
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-300 flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-950 text-base">Helpful Tip: </span>
              <span className="text-sky-950 text-lg">{currentStep.tip}</span>
            </div>
          </div>
        )}

        {/* Error message on failed write */}
        {writeError && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-900 text-lg font-bold flex items-center justify-between"
          >
            <span>{writeError}</span>
            <Button variant="outline" size="small" onClick={handleDone}>
              Retry
            </Button>
          </div>
        )}

        {/* Contextual Assistance Triggers */}
        <div className="pt-4 border-t border-stone-200 flex flex-col gap-3">
          <span className="text-base font-bold text-stone-700">
            Need help with this step?
          </span>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => openHelp('What does this step mean?')}
              leftIcon={<HelpCircle className="w-5 h-5 text-amber-700" />}
            >
              Explain this step
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => openHelp("I can't find this option on my screen.")}
              leftIcon={<Search className="w-5 h-5 text-amber-700" />}
            >
              I can&apos;t find it
            </Button>
          </div>
        </div>

        {/* Step Navigation Controls */}
        <div className="pt-6 border-t-2 border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            size="large"
            onClick={handlePrevious}
            disabled={guide.currentStepIndex === 0 || isUpdating}
            leftIcon={<ArrowLeft className="w-6 h-6" />}
            className="w-full sm:w-auto"
          >
            Previous Step
          </Button>

          <Button
            variant="primary"
            size="large"
            onClick={handleDone}
            isLoading={isUpdating}
            rightIcon={
              currentStepNumber === totalSteps ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <ArrowRight className="w-6 h-6" />
              )
            }
            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 border-emerald-800 text-xl font-bold px-8 py-4"
          >
            {currentStepNumber === totalSteps
              ? 'Complete Task'
              : 'Done, Next Step'}
          </Button>
        </div>
      </Card>

      {/* Contextual Help Modal */}
      <ContextHelpDialog
        isOpen={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        guideTitle={guide.title}
        stepNumber={currentStepNumber}
        stepTitle={currentStep.title}
        stepInstruction={currentStep.instruction}
        initialQuestion={initialHelpQuestion}
      />
    </div>
  );
}
