/**
 * SAATHI Multilingual Configuration (Single Source of Truth)
 * Supports 8 Indian Languages with authentic native scripts and speech metadata.
 */

export type SupportedLanguage =
  | 'en-IN'
  | 'hi-IN'
  | 'pa-IN'
  | 'bn-IN'
  | 'mr-IN'
  | 'gu-IN'
  | 'ta-IN'
  | 'te-IN';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr';
  speechLocale: string;
  greeting: string;
  shortGreeting: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  'en-IN': {
    code: 'en-IN',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'en-IN',
    greeting: 'Good day, friend',
    shortGreeting: 'Hello',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    direction: 'ltr',
    speechLocale: 'hi-IN',
    greeting: 'नमस्ते, आपका साथी यहाँ है',
    shortGreeting: 'नमस्ते',
  },
  'pa-IN': {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    direction: 'ltr',
    speechLocale: 'pa-IN',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ, ਤੁਹਾਡਾ ਸਾਥੀ ਹਾਜ਼ਰ ਹੈ',
    shortGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
  },
  'bn-IN': {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    direction: 'ltr',
    speechLocale: 'bn-IN',
    greeting: 'নমস্কার, আপনার সাথি আপনার পাশে আছে',
    shortGreeting: 'নমস্কার',
  },
  'mr-IN': {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    direction: 'ltr',
    speechLocale: 'mr-IN',
    greeting: 'नमस्कार, आपला साथी मदतीसाठी तयार आहे',
    shortGreeting: 'नमस्कार',
  },
  'gu-IN': {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    direction: 'ltr',
    speechLocale: 'gu-IN',
    greeting: 'નમસ્તે, તમારો સાથી તમારી સાથે છે',
    shortGreeting: 'નમસ્તે',
  },
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    direction: 'ltr',
    speechLocale: 'ta-IN',
    greeting: 'வணக்கம், உங்கள் சாதி உதவ தயாராக உள்ளது',
    shortGreeting: 'வணக்கம்',
  },
  'te-IN': {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    direction: 'ltr',
    speechLocale: 'te-IN',
    greeting: 'నమస్కారం, మీ సాథీ మీకు తోడుగా ఉంది',
    shortGreeting: 'నమస్కారం',
  },
};

export const DEFAULT_UI_LOCALE: SupportedLanguage = 'en-IN';
export const DEFAULT_RESPONSE_LOCALE = 'auto'; // Auto: reply in the same language user speaks/types
