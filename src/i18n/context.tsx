'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_RESPONSE_LOCALE,
  DEFAULT_UI_LOCALE,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from './config';
import { detectLanguageFromText } from './detectLanguage';
import { useAuth } from '@/features/auth/context';
import { getUserPreferences, saveUserPreferences } from '@/features/persistence/preferences';

// Import all 8 JSON dictionaries statically
import enIN from './locales/en-IN.json';
import hiIN from './locales/hi-IN.json';
import paIN from './locales/pa-IN.json';
import bnIN from './locales/bn-IN.json';
import mrIN from './locales/mr-IN.json';
import guIN from './locales/gu-IN.json';
import taIN from './locales/ta-IN.json';
import teIN from './locales/te-IN.json';

export type TranslationKey = keyof typeof enIN;

const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  'en-IN': enIN,
  'hi-IN': hiIN,
  'pa-IN': paIN,
  'bn-IN': bnIN,
  'mr-IN': mrIN,
  'gu-IN': guIN,
  'ta-IN': taIN,
  'te-IN': teIN,
};

interface LanguageContextValue {
  uiLocale: SupportedLanguage;
  responseLocale: 'auto' | SupportedLanguage;
  setUiLocale: (locale: SupportedLanguage) => Promise<void>;
  setResponseLocale: (locale: 'auto' | SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  resolveResponseLanguage: (query?: string) => SupportedLanguage;
}

const LanguageContext = createContext<LanguageContextValue>({
  uiLocale: DEFAULT_UI_LOCALE,
  responseLocale: DEFAULT_RESPONSE_LOCALE,
  setUiLocale: async () => {},
  setResponseLocale: async () => {},
  t: (key: string) => key,
  resolveResponseLanguage: () => DEFAULT_UI_LOCALE,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { uid, isLoaded } = useAuth();
  const [uiLocale, setUiLocaleState] = useState<SupportedLanguage>(DEFAULT_UI_LOCALE);
  const [responseLocale, setResponseLocaleState] = useState<'auto' | SupportedLanguage>(DEFAULT_RESPONSE_LOCALE);

  // Sync with stored preferences on load
  useEffect(() => {
    if (!isLoaded || !uid) return;

    let isMounted = true;
    getUserPreferences(uid).then((prefs) => {
      if (isMounted) {
        if (prefs.uiLocale && SUPPORTED_LANGUAGES[prefs.uiLocale]) {
          setUiLocaleState(prefs.uiLocale);
          if (typeof document !== 'undefined') {
            document.documentElement.lang = prefs.uiLocale.split('-')[0];
          }
        }
        if (prefs.responseLocale) {
          setResponseLocaleState(prefs.responseLocale as 'auto' | SupportedLanguage);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded]);

  const setUiLocale = useCallback(
    async (newLocale: SupportedLanguage) => {
      setUiLocaleState(newLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale.split('-')[0];
      }
      if (uid) {
        const current = await getUserPreferences(uid);
        await saveUserPreferences(uid, { ...current, uiLocale: newLocale });
      }
    },
    [uid]
  );

  const setResponseLocale = useCallback(
    async (newRespLocale: 'auto' | SupportedLanguage) => {
      setResponseLocaleState(newRespLocale);
      if (uid) {
        const current = await getUserPreferences(uid);
        await saveUserPreferences(uid, { ...current, responseLocale: newRespLocale });
      }
    },
    [uid]
  );

  // Translation function with English fallback and parameter interpolation
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[uiLocale] || DICTIONARIES['en-IN'];
      let translation = dict[key] || DICTIONARIES['en-IN'][key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
        });
      }

      return translation;
    },
    [uiLocale]
  );

  // Resolves the language in which Saathi should answer
  const resolveResponseLanguage = useCallback(
    (query?: string): SupportedLanguage => {
      if (responseLocale !== 'auto') {
        return responseLocale;
      }
      if (query && query.trim().length > 0) {
        const detected = detectLanguageFromText(query, uiLocale);
        return detected.language;
      }
      return uiLocale;
    },
    [responseLocale, uiLocale]
  );

  const value = useMemo(
    () => ({
      uiLocale,
      responseLocale,
      setUiLocale,
      setResponseLocale,
      t,
      resolveResponseLanguage,
    }),
    [uiLocale, responseLocale, setUiLocale, setResponseLocale, t, resolveResponseLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
