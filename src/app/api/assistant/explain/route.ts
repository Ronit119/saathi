import { NextRequest, NextResponse } from 'next/server';
import {
  ExplainRequestSchema,
  ExplainResponseSchema,
  SafetyAssessmentResponseSchema,
} from '@/lib/ai/schemas';
import { buildExplainPrompt, buildSafetyPrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`explain-${ip}`, 30, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'You are asking questions quite quickly. Please pause for a moment and try again.' },
        { status: 429 }
      );
    }

    // 2. Body parsing and validation
    const rawBody = await req.json();
    const parseResult = ExplainRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Please check your question and try again.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { query, explanationLevel, responseLanguage, mode } = parseResult.data;
    const targetLang = responseLanguage || 'en-IN';

    // 3. Build prompt and invoke Gemini based on mode
    if (mode === 'safety') {
      const prompt = buildSafetyPrompt(query, targetLang);
      const safetyAssessment = await generateStructuredContent(prompt, SafetyAssessmentResponseSchema);
      return NextResponse.json({ data: safetyAssessment, mode: 'safety' }, { status: 200 });
    } else {
      const prompt = buildExplainPrompt(query, explanationLevel, targetLang);
      const explanation = await generateStructuredContent(prompt, ExplainResponseSchema);
      return NextResponse.json({ data: explanation, mode: 'explain' }, { status: 200 });
    }
  } catch (error: unknown) {
    console.error('Error in /api/assistant/explain:', error);
    const message = (error as Error).message || 'Something went wrong while asking Saathi.';

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Saathi requires a Gemini API Key to answer questions. Please configure GEMINI_API_KEY in .env.local.',
          code: 'MISSING_API_KEY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'I could not reach Saathi right now. Please check your connection and try again.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
