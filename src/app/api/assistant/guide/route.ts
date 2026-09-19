import { NextRequest, NextResponse } from 'next/server';
import { GuideRequestSchema, GuideResponseSchema } from '@/lib/ai/schemas';
import { buildGuidePrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`guide-${ip}`, 15, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'You are creating guides quickly. Please take a moment and try again.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = GuideRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Please provide a task goal for your guide.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { goal, context } = parseResult.data;
    const prompt = buildGuidePrompt(goal, context);
    const guide = await generateStructuredContent(prompt, GuideResponseSchema);

    return NextResponse.json({ data: guide }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/assistant/guide:', error);
    const message = (error as Error).message || 'Failed to create guide.';

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Saathi requires a Gemini API Key to create guided tasks. Please configure GEMINI_API_KEY in .env.local.',
          code: 'MISSING_API_KEY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'I could not generate this guide right now. Please check your connection and try again.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
