import { NextRequest, NextResponse } from 'next/server';
import { ProactiveRequestSchema, ProactiveResponseSchema } from '@/lib/ai/schemas';
import { buildProactivePrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`proactive-${ip}`, 20, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json({ data: { hasSuggestion: false, message: '', relatedType: 'none' } }, { status: 200 });
    }

    const rawBody = await req.json();
    const parseResult = ProactiveRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid state provided' }, { status: 400 });
    }

    const { upcomingReminders, activeGuides } = parseResult.data;

    // Deterministic optimization: If no reminders and no active guides exist, do NOT waste an AI call!
    if (upcomingReminders.length === 0 && activeGuides.length === 0) {
      return NextResponse.json({
        data: {
          hasSuggestion: false,
          message: '',
          relatedType: 'none',
        },
      });
    }

    const prompt = buildProactivePrompt(upcomingReminders, activeGuides);
    const suggestion = await generateStructuredContent(prompt, ProactiveResponseSchema);

    return NextResponse.json({ data: suggestion }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/assistant/proactive:', error);
    // Proactive assistance should fail silently without disrupting the dashboard
    return NextResponse.json({
      data: {
        hasSuggestion: false,
        message: '',
        relatedType: 'none',
      },
    });
  }
}
