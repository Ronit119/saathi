'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { useAccessibility } from '@/features/accessibility/context';
import { useVoiceRecorder } from '@/features/voice/useVoiceRecorder';
import { useMultilingualTTS } from '@/features/voice/useMultilingualTTS';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  X,
  Sparkles,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';

export interface VoiceCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

type StepState = 'idle' | 'recording' | 'transcribing' | 'reviewing' | 'answering' | 'answered';

export function VoiceCompanionModal({ isOpen, onClose }: VoiceCompanionModalProps) {
  const router = useRouter();
  const { t, uiLocale, resolveResponseLanguage } = useLanguage();
  const { updateTextSize, toggleHighContrast, preferences } = useAccessibility();

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    errorMessage: recorderError,
  } = useVoiceRecorder();

  const { speak, stop: stopTTS, pause: pauseTTS, resume: resumeTTS, isSpeaking, isPaused } = useMultilingualTTS();

  const [stepState, setStepState] = useState<StepState>('idle');
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>(uiLocale);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartMic = async () => {
    stopTTS();
    setErrorMessage(null);
    setAssistantReply(null);
    const ok = await startRecording();
    if (ok) {
      setStepState('recording');
    }
  };

  const handleStopMic = async () => {
    setStepState('transcribing');
    const audioData = await stopRecording();

    if (!audioData) {
      setStepState('idle');
      return;
    }

    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioData.audioBase64,
          mimeType: audioData.mimeType,
        }),
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

    try {
      // 1. Check voice command router first
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

      // Execute commands
      if (command && command.intent === 'navigate' && command.target) {
        setAssistantReply(command.feedbackMessage);
        speak(command.feedbackMessage, detectedLanguage);
        setTimeout(() => {
          onClose();
          router.push(command.target === 'home' ? '/' : `/${command.target}`);
        }, 1200);
        return;
      }

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

      // 2. If it's a general question or reminder, process via explain API
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
        setStepState('reviewing');
        return;
      }

      const explanation = json.data;
      const speechSummary = `${explanation.title}. ${explanation.meaning} ${explanation.whyItMatters}`;
      setAssistantReply(`${explanation.title}\n\n${explanation.meaning}\n\n${explanation.whyItMatters}`);
      setStepState('answered');

      // Speak response in the detected native language!
      speak(speechSummary, targetLang);
    } catch (err) {
      console.error('Error processing query:', err);
      setErrorMessage(t('common.errorConnection'));
      setStepState('reviewing');
    }
  };

  const handleCancel = () => {
    cancelRecording();
    stopTTS();
    setStepState('idle');
    setTranscript('');
    setAssistantReply(null);
    setErrorMessage(null);
    onClose();
  };

  const langMeta = SUPPORTED_LANGUAGES[detectedLanguage] || SUPPORTED_LANGUAGES['en-IN'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-companion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <Card className="max-w-xl w-full p-6 sm:p-8 flex flex-col gap-6 shadow-xl border-2 border-stone-300 relative bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
              <Volume2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="voice-companion-title" className="text-2xl font-black text-stone-900">
                {t('voice.companionTitle')}
              </h2>
              <span className="text-sm font-semibold text-stone-600">
                {t('voice.replyingIn', { lang: langMeta.nativeName })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Central State Display */}
        <div className="flex flex-col items-center justify-center text-center py-4 gap-4">
          {stepState === 'idle' && (
            <>
              <button
                type="button"
                onClick={handleStartMic}
                className="w-24 h-24 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none"
                aria-label={t('voice.tapToSpeak')}
              >
                <Mic className="w-12 h-12" />
              </button>
              <p className="text-xl font-bold text-stone-900">{t('voice.tapToSpeak')}</p>
              <p className="text-sm text-stone-500 max-w-sm">{t('voice.privacyNote')}</p>
            </>
          )}

          {stepState === 'recording' && (
            <>
              <button
                type="button"
                onClick={handleStopMic}
                className="w-24 h-24 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg cursor-pointer recording-pulse focus-visible:outline-none"
                aria-label="Tap to finish speaking"
              >
                <Square className="w-10 h-10 fill-current" />
              </button>
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-black text-rose-700">{t('voice.listening')}</p>
                <p className="text-base text-stone-600">Tap square when finished speaking</p>
              </div>
            </>
          )}

          {stepState === 'transcribing' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
              <p className="text-xl font-bold text-stone-800">{t('voice.processing')}</p>
            </div>
          )}

          {stepState === 'answering' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
              <p className="text-xl font-bold text-stone-800">{t('voice.responding')}</p>
            </div>
          )}

          {/* Review Transcript Stage */}
          {stepState === 'reviewing' && (
            <div className="w-full flex flex-col gap-4 text-left">
              <span className="text-sm font-bold text-stone-600 uppercase">
                {t('voice.youSaid')}
              </span>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-xl border-2 border-stone-300 bg-stone-50 text-xl text-stone-900 font-medium focus:border-amber-600 focus:outline-none"
                aria-label={t('voice.youSaid')}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleStartMic}
                  leftIcon={<RotateCcw className="w-5 h-5" />}
                >
                  {t('voice.tryAgain')}
                </Button>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => handleProcessTranscript()}
                  rightIcon={<Send className="w-5 h-5" />}
                >
                  {t('voice.send')}
                </Button>
              </div>
            </div>
          )}

          {/* Answered Stage */}
          {stepState === 'answered' && assistantReply && (
            <div className="w-full flex flex-col gap-4 text-left">
              <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    Saathi&apos;s Answer
                  </span>
                  <div className="flex items-center gap-2">
                    {isSpeaking ? (
                      <>
                        <button
                          type="button"
                          onClick={isPaused ? resumeTTS : pauseTTS}
                          className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-950 font-bold text-sm flex items-center gap-1 hover:bg-amber-300"
                        >
                          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          type="button"
                          onClick={stopTTS}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-sm flex items-center gap-1 hover:bg-rose-200"
                        >
                          <VolumeX className="w-4 h-4" />
                          Stop
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speak(assistantReply, detectedLanguage)}
                        className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-950 font-bold text-sm flex items-center gap-1 hover:bg-amber-300"
                      >
                        <Volume2 className="w-4 h-4" />
                        Listen Again
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xl text-stone-900 leading-relaxed font-medium whitespace-pre-line">
                  {assistantReply}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleStartMic}
                  leftIcon={<Mic className="w-5 h-5" />}
                >
                  Speak Another Question
                </Button>
                <Button variant="primary" size="default" onClick={handleCancel}>
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
  );
}
