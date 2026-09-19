import { NextRequest, NextResponse } from 'next/server';
import {
  ReminderExtractionRequestSchema,
  ReminderExtractionResponseSchema,
} from '@/lib/ai/schemas';
import { buildReminderExtractionPrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { parseReminderInput } from '@/lib/dates/parseReminder';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { detectLanguageFromText } from '@/i18n/detectLanguage';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`extract-rem-${ip}`, 20, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Please pause a moment before creating another reminder.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = ReminderExtractionRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Please provide reminder details.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { text, referenceDateIso, userLanguage } = parseResult.data;
    const detected = detectLanguageFromText(text, userLanguage);
    const targetLang = userLanguage || detected.language || 'en-IN';

    // 1. If English and chrono-node successfully extracts it deterministically:
    if (detected.language === 'en-IN') {
      const refDate = new Date(referenceDateIso);
      const chronoResult = parseReminderInput(text, refDate);

      if (chronoResult.success && chronoResult.dueDate && !chronoResult.isAmbiguous) {
        return NextResponse.json(
          {
            data: {
              title: chronoResult.title,
              scheduledAt: chronoResult.dueDate.toISOString(),
              timezone: 'Asia/Kolkata',
              confidence: 0.95,
              needsConfirmation: false,
              formattedUnderstanding: `${chronoResult.dueDateFormatted}: ${chronoResult.title}`,
            },
          },
          { status: 200 }
        );
      }
    }

    // 2. For non-English languages (Hindi, Punjabi, Tamil, etc.) or ambiguous phrasing:
    // Use Gemini structured date/time extraction
    const prompt = buildReminderExtractionPrompt(text, referenceDateIso, targetLang);
    const extracted = await generateStructuredContent(
      prompt,
      ReminderExtractionResponseSchema,
      20000
    );

    return NextResponse.json({ data: extracted }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/assistant/extract-reminder:', error);
    const message = (error as Error).message || 'Failed to extract reminder.';

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Saathi requires a Gemini API Key to parse reminders. Please configure GEMINI_API_KEY in .env.local.',
          code: 'MISSING_API_KEY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'I could not interpret the reminder time. Please choose the date and time manually.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
