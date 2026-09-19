'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n/config';

export interface UseMultilingualTTSResult {
  speak: (text: string, language?: SupportedLanguage | string) => { success: boolean; reason?: string };
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  hasVoiceForLanguage: (language: string) => boolean;
  activeVoiceName: string | null;
  voiceUnavailableNotice: string | null;
}

export function useMultilingualTTS(): UseMultilingualTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoiceName, setActiveVoiceName] = useState<string | null>(null);
  const [voiceUnavailableNotice, setVoiceUnavailableNotice] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices asynchronously
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setVoices(v);
        }
      } catch (err) {
        console.warn('Error loading speech voices:', err);
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
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('Error canceling speech synthesis:', err);
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveVoiceName(null);
    currentUtteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (err) {
      console.warn('Error pausing speech:', err);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (err) {
      console.warn('Error resuming speech:', err);
    }
  }, [isSupported, isPaused]);

  const findBestVoice = useCallback(
    (langCode: string): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const normalized = langCode.toLowerCase().replace('_', '-');
      const primaryLang = normalized.split('-')[0];

      // 1. Exact match e.g. "pa-in", "hi-in", "en-in"
      const exact = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === normalized);
      if (exact) return exact;

      // 2. Starts with primary e.g. "pa", "hi", "en"
      const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(primaryLang));
      if (prefix) return prefix;

      // 3. Match voice name if it explicitly mentions language
      const langConfig = SUPPORTED_LANGUAGES[langCode as SupportedLanguage];
      const langName = langConfig?.name.toLowerCase() || primaryLang;
      const nameMatch = voices.find((v) => v.name.toLowerCase().includes(langName));
      if (nameMatch) return nameMatch;

      // If language is English, fallback to any English voice
      if (primaryLang === 'en') {
        const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (anyEnglish) return anyEnglish;
      }

      // STRICT RULE: Never use an English voice to read non-English (Indic) text
      return null;
    },
    [voices]
  );

  const hasVoiceForLanguage = useCallback(
    (langCode: string): boolean => {
      return findBestVoice(langCode) !== null;
    },
    [findBestVoice]
  );

  const speak = useCallback(
    (text: string, language: SupportedLanguage | string = 'en-IN'): { success: boolean; reason?: string } => {
      if (!isSupported) {
        return { success: false, reason: 'Speech synthesis is not supported on this device.' };
      }

      // Stop any existing speech before starting new speech
      stop();
      setVoiceUnavailableNotice(null);

      // Clean markdown, symbols, and links
      const clean = text
        .replace(/[*_#`~[\]{}()]/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) {
        return { success: false, reason: 'No text to speak.' };
      }

      const matchedVoice = findBestVoice(language);
      const isEnglish = language.toLowerCase().startsWith('en');

      // If no valid voice exists for an Indic language, do NOT mangle it with an English voice
      if (!matchedVoice && !isEnglish) {
        const langConfig = SUPPORTED_LANGUAGES[language as SupportedLanguage];
        const langName = langConfig ? `${langConfig.nativeName} (${langConfig.name})` : language;
        const notice = `Voice reading is not installed on this browser for ${langName}. You can read the text response below.`;
        setVoiceUnavailableNotice(notice);
        return { success: false, reason: notice };
      }

      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = matchedVoice ? matchedVoice.lang : language;
        utterance.rate = 0.9; // Calm, comfortable pacing for seniors
        utterance.pitch = 1.0;

        if (matchedVoice) {
          utterance.voice = matchedVoice;
          setActiveVoiceName(matchedVoice.name);
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveVoiceName(null);
          currentUtteranceRef.current = null;
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveVoiceName(null);
          currentUtteranceRef.current = null;
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return { success: true };
      } catch (err) {
        console.error('Failed to initiate speech:', err);
        return { success: false, reason: 'Failed to start speech playback.' };
      }
    },
    [isSupported, stop, findBestVoice]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
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
    hasVoiceForLanguage,
    activeVoiceName,
    voiceUnavailableNotice,
  };
}
