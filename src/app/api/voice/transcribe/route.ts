import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiClient, getModelName, extractJsonFromText } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

const TranscribeRequestSchema = z.object({
  audioBase64: z.string().min(1, 'Audio data is missing'),
  mimeType: z.string().default('audio/webm'),
});

const TranscribeResponseSchema = z.object({
  transcript: z.string().min(1),
  detectedLanguage: z.string().default('en-IN'),
  confidence: z.number().min(0).max(1).default(0.9),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`transcribe-${ip}`, 20, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Voice requests are being made too quickly. Please pause a moment.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = TranscribeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid audio recording format. Please try speaking again.' },
        { status: 400 }
      );
    }

    const { audioBase64, mimeType } = parseResult.data;

    // Safety check on audio size (max ~10MB)
    if (audioBase64.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'The recording was too long. Please keep voice questions under 1 minute.' },
        { status: 413 }
      );
    }

    // Clean base64 string if client sent data URI prefix
    let cleanBase64 = audioBase64;
    let cleanMime = mimeType;
    if (audioBase64.startsWith('data:')) {
      const parts = audioBase64.split(';base64,');
      if (parts.length === 2) {
        cleanMime = parts[0].replace('data:', '');
        cleanBase64 = parts[1];
      }
    }

    const client = getGeminiClient();
    const model = process.env.GEMINI_TRANSCRIBE_MODEL || getModelName();

    const prompt = `You are a speech transcription expert for Indian languages.
Listen carefully to the audio and provide the exact verbatim transcription.
Determine the spoken language among the following locales:
- en-IN (English)
- hi-IN (Hindi)
- pa-IN (Punjabi)
- bn-IN (Bengali)
- mr-IN (Marathi)
- gu-IN (Gujarati)
- ta-IN (Tamil)
- te-IN (Telugu)

CRITICAL RULES:
1. Preserve the authentic native script for Indic languages (Devanagari for Hindi/Marathi, Gurmukhi for Punjabi, Bengali for Bengali, Gujarati for Gujarati, Tamil for Tamil, Telugu for Telugu).
2. If English or Hinglish is spoken, transcribe accurately in English / Latin.
3. If no clear speech is heard, return {"transcript": "", "detectedLanguage": "en-IN", "confidence": 0.0}.

Format strictly as JSON:
{
  "transcript": "Verbatim transcript of speech",
  "detectedLanguage": "en-IN" | "hi-IN" | "pa-IN" | "bn-IN" | "mr-IN" | "gu-IN" | "ta-IN" | "te-IN",
  "confidence": 0.0 to 1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json(
        { error: "I couldn't hear clearly. Please try speaking again." },
        { status: 422 }
      );
    }

    const parsedJson = extractJsonFromText(rawText);
    const validated = TranscribeResponseSchema.safeParse(parsedJson);

    if (!validated.success || !validated.data.transcript.trim()) {
      return NextResponse.json(
        { error: "I couldn't hear any speech. Please tap the microphone and speak again." },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: validated.data }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/voice/transcribe:', error);
    const message = (error as Error).message || 'Failed to transcribe audio.';

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Saathi requires a Gemini API Key to transcribe voice. Please configure GEMINI_API_KEY in .env.local.',
          code: 'MISSING_API_KEY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Saathi couldn't process the audio right now. You can also type your question.",
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
