import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiClient, extractJsonFromText } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

const TranscribeResponseSchema = z.object({
  transcript: z.string(),
  detectedLanguage: z.string().default('en-IN'),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

const SUPPORTED_AUDIO_MIMES = [
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/mpeg',
  'audio/mp3',
  'audio/m4a',
  'audio/x-m4a',
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`transcribe-${ip}`, 30, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Voice requests are being made too quickly. Please pause a moment.' },
        { status: 429 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let rawAudioBuffer: Buffer | null = null;
    let mimeType = 'audio/webm';
    let preferredLanguage = 'en-IN';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File | Blob | null;
      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio recording found in request.' },
          { status: 400 }
        );
      }

      mimeType = (formData.get('mimeType') as string) || audioFile.type || 'audio/webm';
      preferredLanguage = (formData.get('preferredLanguage') as string) || 'en-IN';
      const arrayBuffer = await audioFile.arrayBuffer();
      rawAudioBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON payload support for backwards compatibility and tests
      const body = await req.json();
      if (!body.audioBase64) {
        return NextResponse.json(
          { error: 'Audio data is missing from request.' },
          { status: 400 }
        );
      }
      mimeType = body.mimeType || 'audio/webm';
      preferredLanguage = body.preferredLanguage || 'en-IN';
      rawAudioBuffer = Buffer.from(body.audioBase64, 'base64');
    }

    // Size validation
    if (!rawAudioBuffer || rawAudioBuffer.length < 400) {
      return NextResponse.json(
        { error: "I couldn't hear enough audio. Please tap the microphone and try speaking again." },
        { status: 400 }
      );
    }

    if (rawAudioBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'The recording was too long. Please keep voice questions under 1 minute.' },
        { status: 413 }
      );
    }

    // Clean MIME type to remove parameters like ;codecs=opus for Gemini inlineData
    let cleanMime = mimeType.split(';')[0].trim().toLowerCase();
    if (!cleanMime.startsWith('audio/')) {
      cleanMime = 'audio/webm';
    }

    // Validate against supported audio types
    const isSupportedAudio = SUPPORTED_AUDIO_MIMES.some((m) => cleanMime.includes(m.replace('audio/', '')));
    if (!isSupportedAudio) {
      cleanMime = 'audio/webm';
    }

    const base64Data = rawAudioBuffer.toString('base64');
    const client = getGeminiClient();
    const modelName = process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-3.5-flash-lite';

    const prompt = `You are a speech transcription expert specializing in Indian languages and senior-citizen speech.
Listen carefully to the provided audio and transcribe the exact words spoken.

DETERMINE THE SPOKEN LANGUAGE AMONG:
- en-IN (English / Hinglish / mixed)
- hi-IN (Hindi - हिन्दी)
- pa-IN (Punjabi - ਪੰਜਾਬੀ)
- bn-IN (Bengali - বাংলা)
- mr-IN (Marathi - मराठी)
- gu-IN (Gujarati - ગુજરાતી)
- ta-IN (Tamil - தமிழ்)
- te-IN (Telugu - తెలుగు)

CRITICAL RULES:
1. Preserve authentic native scripts for Indic speech:
   - Punjabi MUST be written in Gurmukhi script (e.g. "ਕੱਲ੍ਹ ਸ਼ਾਮ ਸੱਤ ਵਜੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਭਰਨ ਦੀ ਯਾਦ ਦਿਵਾਉ"). NEVER convert Punjabi into Hindi or English.
   - Hindi and Marathi MUST be written in Devanagari script.
   - Bengali in Bengali script, Gujarati in Gujarati, Tamil in Tamil, Telugu in Telugu.
2. If English or code-switched Indian English/Hinglish is spoken (e.g. "OTP kaha milega?", "Remind me to take blood pressure medicine"), transcribe clearly in Latin script.
3. If background noise or silence is heard with no discernible human speech, return:
   {"transcript": "", "detectedLanguage": "${preferredLanguage}", "confidence": null}
4. Provide a numerical confidence (0.0 to 1.0) ONLY if you have an objective estimation. Otherwise return null for confidence. DO NOT invent false confidence.

Return strictly valid JSON:
{
  "transcript": "Verbatim transcript of speech",
  "detectedLanguage": "en-IN" | "hi-IN" | "pa-IN" | "bn-IN" | "mr-IN" | "gu-IN" | "ta-IN" | "te-IN",
  "confidence": null
}`;

    // 20-second timeout race
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Transcription request timed out.')), 20000)
    );

    const generatePromise = client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Data,
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

    const response = await Promise.race([generatePromise, timeoutPromise]);
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

    if (process.env.NODE_ENV === 'development') {
      console.log('[Transcribe API] Result:', {
        transcript: validated.data.transcript,
        detectedLanguage: validated.data.detectedLanguage,
        audioBytes: rawAudioBuffer.length,
      });
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

    if (message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Transcription took too long. Please try a shorter question.' },
        { status: 504 }
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
