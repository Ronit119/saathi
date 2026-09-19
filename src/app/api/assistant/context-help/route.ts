import { NextRequest, NextResponse } from 'next/server';
import { ContextHelpRequestSchema, ContextHelpResponseSchema } from '@/lib/ai/schemas';
import { buildContextHelpPrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`context-help-${ip}`, 25, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Please pause a moment before asking another question.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = ContextHelpRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Please provide your question.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { guideTitle, stepNumber, stepTitle, stepInstruction, userQuestion, responseLanguage } = parseResult.data;
    const targetLang = responseLanguage || 'en-IN';

    const prompt = buildContextHelpPrompt(
      guideTitle,
      stepNumber,
      stepTitle,
      stepInstruction,
      userQuestion,
      targetLang
    );

    const helpResponse = await generateStructuredContent(prompt, ContextHelpResponseSchema);

    return NextResponse.json({ data: helpResponse }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/assistant/context-help:', error);
    const message = (error as Error).message || 'Failed to answer contextual question.';

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Saathi requires a Gemini API Key to provide guidance. Please configure GEMINI_API_KEY in .env.local.',
          code: 'MISSING_API_KEY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'I could not answer your question right now. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
