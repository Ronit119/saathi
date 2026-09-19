'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { useVoiceRecorder } from '@/features/voice/useVoiceRecorder';
import { useMultilingualTTS } from '@/features/voice/useMultilingualTTS';
import { saveReminder } from '@/features/persistence/reminders';
import { Reminder } from '@/types/reminder';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Portal } from '@/components/ui/Portal';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import {
  Mic,
  Square,
  Volume2,
  RotateCcw,
  Send,
  X,
  Sparkles,
  AlertCircle,
  Play,
  Pause,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Edit3,
} from 'lucide-react';

export interface VoiceCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

type StepState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'reviewing'
  | 'answering'
  | 'answered';

interface ExtractedReminderState {
  title: string;
  scheduledAt: string;
  formattedUnderstanding: string;
}

export function VoiceCompanionModal({ isOpen, onClose }: VoiceCompanionModalProps) {
  const router = useRouter();
  const { uid } = useAuth();
  const { t, uiLocale, resolveResponseLanguage } = useLanguage();
  const { updateTextSize, toggleHighContrast, preferences } = useAccessibility();

  const {
    errorMessage: recorderError,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: isMicSupported,
  } = useVoiceRecorder();

  const {
    speak,
    stop: stopTTS,
    pause: pauseTTS,
    resume: resumeTTS,
    isSpeaking,
    isPaused,
    hasVoiceForLanguage,
    voiceUnavailableNotice,
  } = useMultilingualTTS();

  const [stepState, setStepState] = useState<StepState>('idle');
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>(uiLocale);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [extractedReminder, setExtractedReminder] = useState<ExtractedReminderState | null>(null);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  const transcriptInputRef = useRef<HTMLTextAreaElement>(null);

  useBodyScrollLock(isOpen);


  const handleCancel = useCallback(() => {
    cancelRecording();
    stopTTS();
    setStepState('idle');
    setTranscript('');
    setAssistantReply(null);
    setExtractedReminder(null);
    setReminderSaved(false);
    setErrorMessage(null);
    setIsEditingTranscript(false);
    onClose();
  }, [cancelRecording, stopTTS, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  // Clean up speech on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopTTS();
    }
  }, [isOpen, stopTTS]);

  if (!isOpen) return null;

  const handleStartMic = async () => {
    stopTTS();
    setErrorMessage(null);
    setAssistantReply(null);
    setExtractedReminder(null);
    setReminderSaved(false);
    setIsEditingTranscript(false);

    const ok = await startRecording();
    if (ok) {
      setStepState('recording');
    }
  };

  const handleStopMic = async () => {
    setStepState('transcribing');
    const audioResult = await stopRecording();

    if (!audioResult) {
      setStepState('idle');
      return;
    }

    try {
      // Send raw Blob via FormData
      const formData = new FormData();
      const ext = audioResult.mimeType.includes('mp4')
        ? 'mp4'
        : audioResult.mimeType.includes('ogg')
        ? 'ogg'
        : 'webm';
      formData.append('audio', audioResult.blob, `voice_recording.${ext}`);
      formData.append('mimeType', audioResult.mimeType);
      formData.append('preferredLanguage', detectedLanguage || uiLocale);

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMessage(json.error || t('voice.error'));
        setStepState('idle');
        return;
      }

      const receivedText = json.data.transcript;
      const detectedLang = (json.data.detectedLanguage as SupportedLanguage) || uiLocale;

      setTranscript(receivedText);
      setDetectedLanguage(detectedLang);
      setStepState('reviewing');
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMessage(t('common.errorConnection'));
      setStepState('idle');
    }
  };

  const handleProcessTranscript = async (textToProcess?: string) => {
    const text = (textToProcess !== undefined ? textToProcess : transcript).trim();
    if (!text) return;

    setStepState('answering');
    setErrorMessage(null);
    setExtractedReminder(null);
    setReminderSaved(false);

    try {
      // 1. Check voice command router
      const cmdRes = await fetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          detectedLanguage,
        }),
      });

      const cmdJson = await cmdRes.json();
      const command = cmdJson.data;

      // Handle navigation command
      if (command && command.intent === 'navigate' && command.target) {
        setAssistantReply(command.feedbackMessage);
        speak(command.feedbackMessage, detectedLanguage);
        setTimeout(() => {
          handleCancel();
          router.push(command.target === 'home' ? '/' : `/${command.target}`);
        }, 1200);
        return;
      }

      // Handle accessibility command
      if (command && command.intent === 'accessibility') {
        if (command.action === 'increase_text_size') {
          await updateTextSize(preferences.textSize === 'normal' ? 'large' : 'xlarge');
        } else if (command.action === 'decrease_text_size') {
          await updateTextSize(preferences.textSize === 'xlarge' ? 'large' : 'normal');
        } else if (command.action === 'toggle_contrast') {
          await toggleHighContrast();
        } else if (command.action === 'stop_speaking') {
          stopTTS();
        }
        setAssistantReply(command.feedbackMessage);
        speak(command.feedbackMessage, detectedLanguage);
        setStepState('answered');
        return;
      }

      // Handle reminder creation command
      if (command && command.intent === 'create_reminder') {
        const extractRes = await fetch('/api/assistant/extract-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            referenceDateIso: new Date().toISOString(),
            userLanguage: detectedLanguage,
          }),
        });

        const extractJson = await extractRes.json();
        if (extractRes.ok && extractJson.data) {
          const parsed = extractJson.data;
          setExtractedReminder({
            title: parsed.title,
            scheduledAt: parsed.scheduledAt,
            formattedUnderstanding: parsed.formattedUnderstanding,
          });
          setAssistantReply(parsed.formattedUnderstanding);
          setStepState('answered');
          speak(parsed.formattedUnderstanding, detectedLanguage);
          return;
        }
      }

      // 2. Default: General question or explanation
      const targetLang = resolveResponseLanguage(text);
      const res = await fetch('/api/assistant/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          explanationLevel: 'simple',
          responseLanguage: targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMessage(json.error || t('common.errorConnection'));
        setStepState('reviewing'); // Keep transcript on error
        return;
      }

      const explanation = json.data;
      const fullReply = `${explanation.title}\n\n${explanation.meaning}\n\n${explanation.whyItMatters}`;
      const speechSummary = `${explanation.title}. ${explanation.meaning} ${explanation.whyItMatters}`;

      setAssistantReply(fullReply);
      setStepState('answered');

      // Read aloud in matching language
      speak(speechSummary, targetLang);
    } catch (err) {
      console.error('Error processing query:', err);
      setErrorMessage(t('common.errorConnection'));
      setStepState('reviewing'); // Keep transcript on error
    }
  };

  const handleSaveExtractedReminder = async () => {
    if (!extractedReminder || !uid) return;

    try {
      const scheduledDate = new Date(extractedReminder.scheduledAt);
      const newReminder: Reminder = {
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: uid,
        title: extractedReminder.title,
        originalInput: transcript,
        dueTimestamp: scheduledDate.getTime(),
        dueDateString: extractedReminder.formattedUnderstanding,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveReminder(uid, newReminder);
      setReminderSaved(true);
      speak('Reminder saved successfully.', detectedLanguage);
    } catch (err) {
      console.error('Failed to save reminder:', err);
      setErrorMessage('Could not save reminder. Please try again.');
    }
  };

  const langMeta = SUPPORTED_LANGUAGES[detectedLanguage] || SUPPORTED_LANGUAGES['en-IN'];
  const hasVoice = hasVoiceForLanguage(detectedLanguage);

  return (
    <Portal>
      {/* Backdrop: covers entire viewport, z-[9998] */}
      <div
        className="fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog: centered, z-[9999], max-h-[85dvh], overflow-hidden */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-companion-title"
        className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xl max-h-[85dvh] overflow-hidden outline-none animate-fadeIn"
      >
        <Card className="max-h-[85dvh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border-2 border-stone-300 relative bg-white overscroll-contain">
          {/* Header - shrink-0 */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Volume2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 id="voice-companion-title" className="text-2xl font-black text-stone-900 leading-tight">
                  {t('voice.companionTitle')}
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-stone-600">
                  {t('voice.replyingIn', { lang: langMeta.nativeName })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              aria-label={t('common.close')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer border-2 border-transparent focus-visible:border-amber-600 focus-visible:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central State Display */}
          <div className="flex flex-col items-center justify-center text-center py-2 gap-4">
            {/* 1. IDLE STATE */}
            {stepState === 'idle' && (
              <>
                <button
                  type="button"
                  onClick={handleStartMic}
                  disabled={!isMicSupported}
                  aria-label={t('voice.tapToSpeak')}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all cursor-pointer border-4 border-amber-200 outline-none focus-visible:ring-4 focus-visible:ring-amber-500 disabled:opacity-50"
                >
                  <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
                </button>
                <div className="flex flex-col gap-1 max-w-sm">
                  <span className="text-xl sm:text-2xl font-bold text-stone-900">
                    {t('voice.tapToSpeak')}
                  </span>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                    Ask anything, set a reminder, or give commands in English, हिन्दी, ਪੰਜਾਬੀ, and 5 more Indian languages.
                  </p>
                </div>
              </>
            )}

            {/* 2. RECORDING STATE */}
            {stepState === 'recording' && (
              <>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-500/20 animate-ping" />
                  <button
                    type="button"
                    onClick={handleStopMic}
                    aria-label={t('voice.tapToStop')}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer border-4 border-rose-200 outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                  >
                    <Square className="w-8 h-8 fill-white mb-1" />
                    <span className="text-xs font-black tracking-wider uppercase">STOP</span>
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-black text-rose-700 animate-pulse">
                    {t('voice.listening')}
                  </span>
                  <span className="text-sm font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                    ⏱ 00:{recordingDuration.toString().padStart(2, '0')} / 01:00
                  </span>
                  <p className="text-xs text-stone-500 mt-1">
                    Tap the red button when finished speaking
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleCancel}
                  className="text-stone-500 hover:text-stone-800"
                >
                  {t('common.cancel')}
                </Button>
              </>
            )}

            {/* 3. TRANSCRIBING STATE */}
            {stepState === 'transcribing' && (
              <div className="py-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold text-stone-900">
                    Understanding your speech...
                  </span>
                  <p className="text-sm text-stone-600">
                    Transcribing clearly in {langMeta.nativeName}...
                  </p>
                </div>
              </div>
            )}

            {/* 4. REVIEWING / TRANSCRIBED STATE */}
            {stepState === 'reviewing' && (
              <div className="w-full flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    {t('voice.youSaid')} ({langMeta.nativeName}):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingTranscript(!isEditingTranscript);
                      if (!isEditingTranscript) {
                        setTimeout(() => transcriptInputRef.current?.focus(), 50);
                      }
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-amber-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditingTranscript ? 'Done Editing' : 'Edit Text'}
                  </button>
                </div>

                {isEditingTranscript ? (
                  <textarea
                    ref={transcriptInputRef}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={3}
                    className="w-full p-4 text-lg sm:text-xl font-bold rounded-2xl border-2 border-amber-600 bg-amber-50/40 text-stone-950 focus:outline-none"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setIsEditingTranscript(true);
                      setTimeout(() => transcriptInputRef.current?.focus(), 50);
                    }}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-stone-900 text-lg sm:text-xl font-bold leading-relaxed cursor-pointer hover:border-amber-400 transition-colors"
                  >
                    &ldquo;{transcript}&rdquo;
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="large"
                    onClick={handleStartMic}
                    leftIcon={<RotateCcw className="w-5 h-5" />}
                    className="w-full sm:flex-1"
                  >
                    {t('voice.tryAgain')}
                  </Button>

                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => handleProcessTranscript()}
                    rightIcon={<Send className="w-5 h-5" />}
                    className="w-full sm:flex-1"
                  >
                    {t('voice.sendToSaathi')}
                  </Button>
                </div>
              </div>
            )}

            {/* 5. ANSWERING STATE */}
            {stepState === 'answering' && (
              <div className="py-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center animate-bounce">
                  <Sparkles className="w-8 h-8 text-amber-700" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold text-stone-900">
                    Saathi is thinking...
                  </span>
                  <p className="text-sm text-stone-600">
                    Formulating a clear, senior-friendly answer in {langMeta.nativeName}...
                  </p>
                </div>
              </div>
            )}

            {/* 6. ANSWERED / RESULT STATE */}
            {stepState === 'answered' && (
              <div className="w-full flex flex-col gap-5 text-left">
                {/* Extracted Reminder Preview */}
                {extractedReminder ? (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/80 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                      <Calendar className="w-5 h-5" />
                      <span>{t('reminders.title')}</span>
                    </div>

                    <p className="text-lg sm:text-xl font-black text-stone-950">
                      {extractedReminder.title}
                    </p>

                    <div className="flex items-center gap-2 text-stone-700 text-sm font-medium">
                      <Clock className="w-4 h-4 text-stone-500" />
                      <span>{extractedReminder.formattedUnderstanding}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                      {reminderSaved ? (
                        <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-100 px-4 py-2.5 rounded-xl">
                          <Check className="w-5 h-5 text-emerald-700 stroke-[3]" />
                          <span>Reminder Saved to Your Day!</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="default"
                          onClick={handleSaveExtractedReminder}
                          leftIcon={<Check className="w-5 h-5" />}
                          className="bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
                        >
                          Save Reminder
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          handleCancel();
                          router.push('/reminders');
                        }}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        View All
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Standard Assistant Explanation Answer */
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-stone-900 flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
                    <p className="text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line">
                      {assistantReply}
                    </p>
                  </div>
                )}

                {/* Multilingual Voice Playback Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-stone-100 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-800">
                        {isSpeaking ? 'Speaking aloud...' : isPaused ? 'Speech paused' : 'Voice Audio'}
                      </span>
                      <span className="text-xs text-stone-500">
                        Language: {langMeta.nativeName} ({langMeta.name})
                      </span>
                    </div>
                  </div>

                  {hasVoice ? (
                    <div className="flex items-center gap-2">
                      {isSpeaking ? (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={isPaused ? resumeTTS : pauseTTS}
                          leftIcon={isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => speak(assistantReply || '', detectedLanguage)}
                          leftIcon={<Play className="w-4 h-4" />}
                        >
                          Listen
                        </Button>
                      )}

                      {(isSpeaking || isPaused) && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={stopTTS}
                          leftIcon={<Square className="w-4 h-4" />}
                        >
                          Stop
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-stone-500 italic max-w-xs text-right">
                      {voiceUnavailableNotice || `Browser voice not installed for ${langMeta.nativeName}`}
                    </span>
                  )}
                </div>

                {/* Bottom Action Controls */}
                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleStartMic}
                    leftIcon={<Mic className="w-5 h-5 text-amber-700" />}
                  >
                    Ask Another
                  </Button>

                  <Button
                    variant="primary"
                    size="default"
                    onClick={handleCancel}
                  >
                    {t('common.done')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {(errorMessage || recorderError) && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-400 rounded-xl text-rose-900 text-base font-medium"
            >
              <AlertCircle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{errorMessage || recorderError}</p>
              </div>
              <Button variant="outline" size="small" onClick={handleStartMic}>
                {t('common.retry')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Portal>
  );
}
