import { describe, it, expect } from 'vitest';
import { extractJsonFromText } from './gemini';
import { ExplainResponseSchema, GuideResponseSchema, ProactiveResponseSchema } from './schemas';

describe('AI JSON Extraction & Schema Validation', () => {
  it('extracts pure JSON string', () => {
    const jsonStr = '{"title":"OTP Explained","meaning":"A one-time code","whyItMatters":"Keeps you safe","nextSteps":["Check SMS"],"cautions":["Do not share"],"followUps":["Help me do this"]}';
    const parsed = extractJsonFromText(jsonStr);
    const result = ExplainResponseSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it('extracts JSON surrounded by markdown code fences', () => {
    const wrapped = '```json\n{"title":"Two-Factor Auth","meaning":"Two layers of protection","whyItMatters":"Protects your account","nextSteps":["Enable in settings"],"followUps":["Help me set it up"]}\n```';
    const parsed = extractJsonFromText(wrapped);
    const result = ExplainResponseSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it('validates GuideResponseSchema structure', () => {
    const guideData = {
      title: 'How to change Gmail password',
      goal: 'Change Gmail password',
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          title: 'Open Gmail',
          instruction: 'Open the Gmail app on your tablet or phone.',
          explanation: 'This brings up your inbox.',
          tip: 'Look for the red and white envelope icon.',
        },
        {
          id: 'step_2',
          stepNumber: 2,
          title: 'Tap your Profile Picture',
          instruction: 'Tap your profile circle at the top right of your screen.',
          explanation: 'This opens your Google account menu.',
        },
      ],
    };

    const result = GuideResponseSchema.safeParse(guideData);
    expect(result.success).toBe(true);
  });

  it('validates ProactiveResponseSchema with real state', () => {
    const proactiveData = {
      hasSuggestion: true,
      message: 'You have an electricity bill reminder due tomorrow. Would you like help opening the payment portal?',
      actionText: 'Pay Bill Help',
      actionUrl: '/guides/bill_pay',
      relatedType: 'reminder',
      relatedId: 'rem_123',
    };

    const result = ProactiveResponseSchema.safeParse(proactiveData);
    expect(result.success).toBe(true);
  });
});
