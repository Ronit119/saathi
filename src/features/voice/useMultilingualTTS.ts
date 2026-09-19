'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SupportedLanguage } from '@/i18n/config';

export interface UseMultilingualTTSResult {
  speak: (text: string, language?: SupportedLanguage | string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export function useMultilingualTTS(): UseMultilingualTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (isSupported) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    currentUtteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  const findBestVoice = useCallback(
    (langCode: string): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const normalized = langCode.toLowerCase().replace('_', '-');
      const primaryLang = normalized.split('-')[0];

      // 1. Exact match e.g. "pa-in"
      const exact = voices.find((v) => v.lang.toLowerCase() === normalized);
      if (exact) return exact;

      // 2. Starts with primary e.g. "pa"
      const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(primaryLang));
      if (prefix) return prefix;

      // 3. Match voice name if it mentions the language name
      const nameMatch = voices.find((v) =>
        v.name.toLowerCase().includes(primaryLang)
      );
      if (nameMatch) return nameMatch;

      return null;
    },
    [voices]
  );

  const speak = useCallback(
    (text: string, language: SupportedLanguage | string = 'en-IN') => {
      if (!isSupported) return;

      stop();

      // Clean markdown, brackets, and symbols
      const clean = text
        .replace(/[*_#`~[\]{}()]/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = language;
      utterance.rate = 0.9; // Clear, comfortable pacing for seniors
      utterance.pitch = 1.0;

      const matchedVoice = findBestVoice(language);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop, findBestVoice]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
