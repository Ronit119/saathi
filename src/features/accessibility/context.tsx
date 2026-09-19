'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEFAULT_PREFERENCES, ExplanationLevel, TextSizePreference, UserPreferences } from '@/types/user';
import { useAuth } from '@/features/auth/context';
import { getUserPreferences, saveUserPreferences } from '@/features/persistence/preferences';

interface AccessibilityContextValue {
  preferences: UserPreferences;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  updateTextSize: (size: TextSizePreference) => Promise<void>;
  toggleHighContrast: () => Promise<void>;
  toggleReducedMotion: () => Promise<void>;
  updateExplanationLevel: (level: ExplanationLevel) => Promise<void>;
  toggleVoiceEnabled: () => Promise<void>;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  preferences: DEFAULT_PREFERENCES,
  isSpeechSupported: false,
  isSpeaking: false,
  updateTextSize: async () => {},
  toggleHighContrast: async () => {},
  toggleReducedMotion: async () => {},
  updateExplanationLevel: async () => {},
  toggleVoiceEnabled: async () => {},
  speakText: () => {},
  stopSpeaking: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { uid, isLoaded } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSpeechSupported(true);
    }
  }, []);

  // Load preferences once user ID is ready
  useEffect(() => {
    if (!isLoaded || !uid) return;

    let isMounted = true;
    getUserPreferences(uid).then((prefs) => {
      if (isMounted) {
        setPreferences(prefs);
        applyDOMPreferences(prefs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded]);

  const applyDOMPreferences = (prefs: UserPreferences) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Text size classes
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    root.classList.add(`text-size-${prefs.textSize}`);

    // High contrast class
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion class
    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  };

  const updatePreferences = useCallback(
    async (newPrefs: UserPreferences) => {
      setPreferences(newPrefs);
      applyDOMPreferences(newPrefs);
      if (uid) {
        await saveUserPreferences(uid, newPrefs);
      }
    },
    [uid]
  );

  const updateTextSize = useCallback(
    async (size: TextSizePreference) => {
      await updatePreferences({ ...preferences, textSize: size });
    },
    [preferences, updatePreferences]
  );

  const toggleHighContrast = useCallback(async () => {
    await updatePreferences({ ...preferences, highContrast: !preferences.highContrast });
  }, [preferences, updatePreferences]);

  const toggleReducedMotion = useCallback(async () => {
    await updatePreferences({ ...preferences, reducedMotion: !preferences.reducedMotion });
  }, [preferences, updatePreferences]);

  const updateExplanationLevel = useCallback(
    async (level: ExplanationLevel) => {
      await updatePreferences({ ...preferences, explanationLevel: level });
    },
    [preferences, updatePreferences]
  );

  const toggleVoiceEnabled = useCallback(async () => {
    await updatePreferences({ ...preferences, voiceEnabled: !preferences.voiceEnabled });
  }, [preferences, updatePreferences]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      // Clean plain text without markdown or symbols
      const clean = text.replace(/[*_#`~[\]]/g, ' ').trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.9; // Slightly slower, clearer pacing for senior citizens
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        isSpeechSupported,
        isSpeaking,
        updateTextSize,
        toggleHighContrast,
        toggleReducedMotion,
        updateExplanationLevel,
        toggleVoiceEnabled,
        speakText,
        stopSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  return useContext(AccessibilityContext);
}
