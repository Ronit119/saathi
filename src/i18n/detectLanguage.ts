import { SupportedLanguage } from './config';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  script: string;
  confidence: number;
  isAmbiguous: boolean;
}

// Unicode script regex ranges
const GURMUKHI_REGEX = /[\u0A00-\u0A7F]/g;
const GUJARATI_REGEX = /[\u0A80-\u0AFF]/g;
const TAMIL_REGEX = /[\u0B80-\u0BFF]/g;
const TELUGU_REGEX = /[\u0C00-\u0C7F]/g;
const BENGALI_REGEX = /[\u0980-\u09FF]/g;
const DEVANAGARI_REGEX = /[\u0900-\u097F]/g;

// Distinct Marathi vs Hindi keyword patterns in Devanagari (using Unicode space/punctuation boundaries)
const MARATHI_MARKERS = /(?:^|\s|[.,?!:;])(आहे|नाही|काय|कसे|सांगा|करावे|मला|माझे|त्यांना|होते|केले|कधी|द्या)(?:$|\s|[.,?!:;])/;
const HINDI_MARKERS = /(?:^|\s|[.,?!:;])(है|नहीं|क्या|कैसे|बताओ|करना|मुझे|मेरा|उनको|था|किया|कब|दो)(?:$|\s|[.,?!:;])/;

// Latin Hinglish common patterns
const HINGLISH_MARKERS = /\b(karna|karein|yaad|dilana|kaha|kaise|kya|mujhe|mera|hai|batao|chahiye|paisa|bill)\b/i;

/**
 * Deterministic layered script and language detector.
 */
export function detectLanguageFromText(
  text: string,
  preferredResponseLanguage?: string
): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      language: 'en-IN',
      script: 'Latin',
      confidence: 1.0,
      isAmbiguous: false,
    };
  }

  // 1. Unambiguous scripts
  const gurmukhiMatches = (trimmed.match(GURMUKHI_REGEX) || []).length;
  const gujaratiMatches = (trimmed.match(GUJARATI_REGEX) || []).length;
  const tamilMatches = (trimmed.match(TAMIL_REGEX) || []).length;
  const teluguMatches = (trimmed.match(TELUGU_REGEX) || []).length;
  const bengaliMatches = (trimmed.match(BENGALI_REGEX) || []).length;
  const devanagariMatches = (trimmed.match(DEVANAGARI_REGEX) || []).length;

  const totalChars = trimmed.replace(/\s+/g, '').length || 1;

  if (gurmukhiMatches > 0 && gurmukhiMatches >= devanagariMatches) {
    return {
      language: 'pa-IN',
      script: 'Gurmukhi',
      confidence: Math.min(1.0, gurmukhiMatches / (totalChars * 0.5)),
      isAmbiguous: false,
    };
  }

  if (gujaratiMatches > 0) {
    return {
      language: 'gu-IN',
      script: 'Gujarati',
      confidence: Math.min(1.0, gujaratiMatches / (totalChars * 0.5)),
      isAmbiguous: false,
    };
  }

  if (tamilMatches > 0) {
    return {
      language: 'ta-IN',
      script: 'Tamil',
      confidence: Math.min(1.0, tamilMatches / (totalChars * 0.5)),
      isAmbiguous: false,
    };
  }

  if (teluguMatches > 0) {
    return {
      language: 'te-IN',
      script: 'Telugu',
      confidence: Math.min(1.0, teluguMatches / (totalChars * 0.5)),
      isAmbiguous: false,
    };
  }

  if (bengaliMatches > 0) {
    return {
      language: 'bn-IN',
      script: 'Bengali',
      confidence: Math.min(1.0, bengaliMatches / (totalChars * 0.5)),
      isAmbiguous: false,
    };
  }

  // 2. Devanagari: differentiate between Hindi and Marathi
  if (devanagariMatches > 0) {
    if (preferredResponseLanguage === 'mr-IN') {
      return {
        language: 'mr-IN',
        script: 'Devanagari',
        confidence: 0.95,
        isAmbiguous: false,
      };
    }
    if (preferredResponseLanguage === 'hi-IN') {
      return {
        language: 'hi-IN',
        script: 'Devanagari',
        confidence: 0.95,
        isAmbiguous: false,
      };
    }

    if (MARATHI_MARKERS.test(trimmed)) {
      return {
        language: 'mr-IN',
        script: 'Devanagari',
        confidence: 0.9,
        isAmbiguous: false,
      };
    }

    if (HINDI_MARKERS.test(trimmed)) {
      return {
        language: 'hi-IN',
        script: 'Devanagari',
        confidence: 0.9,
        isAmbiguous: false,
      };
    }

    // Default Devanagari to Hindi
    return {
      language: 'hi-IN',
      script: 'Devanagari',
      confidence: 0.8,
      isAmbiguous: true,
    };
  }

  // 3. Latin Script (English or Code-switched Indic / Hinglish)
  if (HINGLISH_MARKERS.test(trimmed)) {
    return {
      language: 'hi-IN',
      script: 'Latin',
      confidence: 0.85,
      isAmbiguous: true,
    };
  }

  // Default Latin to English
  return {
    language: 'en-IN',
    script: 'Latin',
    confidence: 0.95,
    isAmbiguous: false,
  };
}
