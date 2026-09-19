import { describe, it, expect } from 'vitest';
import enIN from './locales/en-IN.json';
import hiIN from './locales/hi-IN.json';
import paIN from './locales/pa-IN.json';
import bnIN from './locales/bn-IN.json';
import mrIN from './locales/mr-IN.json';
import guIN from './locales/gu-IN.json';
import taIN from './locales/ta-IN.json';
import teIN from './locales/te-IN.json';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './config';

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

describe('Multilingual i18n Dictionaries', () => {
  const masterKeys = Object.keys(enIN);

  it('contains all 8 supported languages in config', () => {
    const supportedCodes = Object.keys(SUPPORTED_LANGUAGES);
    expect(supportedCodes).toEqual([
      'en-IN',
      'hi-IN',
      'pa-IN',
      'bn-IN',
      'mr-IN',
      'gu-IN',
      'ta-IN',
      'te-IN',
    ]);
  });

  it('has comprehensive key coverage in master en-IN dictionary', () => {
    expect(masterKeys.length).toBeGreaterThanOrEqual(100);
  });

  (Object.keys(DICTIONARIES) as SupportedLanguage[]).forEach((lang) => {
    describe(`Language Dictionary: ${lang}`, () => {
      const dict = DICTIONARIES[lang];

      it(`has all required keys matching en-IN`, () => {
        masterKeys.forEach((key) => {
          expect(dict[key], `Missing key "${key}" in ${lang}`).toBeDefined();
        });
      });

      it(`has non-empty translations for all keys`, () => {
        masterKeys.forEach((key) => {
          const val = dict[key];
          expect(val && val.trim().length > 0, `Empty string for key "${key}" in ${lang}`).toBe(true);
        });
      });
    });
  });
});
