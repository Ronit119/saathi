import { describe, it, expect } from 'vitest';
import { detectLanguageFromText } from './detectLanguage';

describe('Layered Script & Language Detection', () => {
  it('detects Gurmukhi script as Punjabi', () => {
    const res = detectLanguageFromText('ਇਹ ਮੈਸੇਜ ਕੀ ਕਹਿ ਰਿਹਾ ਹੈ?');
    expect(res.language).toBe('pa-IN');
    expect(res.script).toBe('Gurmukhi');
  });

  it('detects Gujarati script as Gujarati', () => {
    const res = detectLanguageFromText('મને આ મેસેજ સમજાવો');
    expect(res.language).toBe('gu-IN');
    expect(res.script).toBe('Gujarati');
  });

  it('detects Tamil script as Tamil', () => {
    const res = detectLanguageFromText('இந்த செய்திக்கு என்ன அர்த்தம்?');
    expect(res.language).toBe('ta-IN');
    expect(res.script).toBe('Tamil');
  });

  it('detects Telugu script as Telugu', () => {
    const res = detectLanguageFromText('ఈ సందేశం అర్థం ఏమిటి?');
    expect(res.language).toBe('te-IN');
    expect(res.script).toBe('Telugu');
  });

  it('detects Bengali script as Bengali', () => {
    const res = detectLanguageFromText('এই বার্তাটির মানে কী?');
    expect(res.language).toBe('bn-IN');
    expect(res.script).toBe('Bengali');
  });

  it('detects Devanagari Hindi vs Marathi appropriately', () => {
    // Hindi phrase with Hindi marker
    const hindiRes = detectLanguageFromText('मुझे बताओ यह क्या है?');
    expect(hindiRes.language).toBe('hi-IN');
    expect(hindiRes.script).toBe('Devanagari');

    // Marathi phrase with Marathi marker
    const marathiRes = detectLanguageFromText('मला सांगा हे काय आहे?');
    expect(marathiRes.language).toBe('mr-IN');
    expect(marathiRes.script).toBe('Devanagari');
  });

  it('detects Latin English and Hinglish', () => {
    const engRes = detectLanguageFromText('What does Two Factor Authentication mean?');
    expect(engRes.language).toBe('en-IN');

    const hinglishRes = detectLanguageFromText('kal mujhe bill pay karna yaad dilana');
    expect(hinglishRes.language).toBe('hi-IN');
  });
});
