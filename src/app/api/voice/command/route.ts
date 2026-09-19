import { NextRequest, NextResponse } from 'next/server';
import {
  VoiceCommandRequestSchema,
  VoiceCommandResponseSchema,
  VoiceCommandResponse,
} from '@/lib/ai/schemas';
import { buildVoiceCommandPrompt } from '@/lib/ai/prompts';
import { generateStructuredContent } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/security/rateLimit';

/**
 * Deterministic command matcher for zero-latency execution of common actions.
 */
export function matchDeterministicCommand(transcript: string): VoiceCommandResponse | null {
  const lower = transcript.toLowerCase().trim();

  // 1. Accessibility commands
  if (
    /make text (bigger|larger)|increase (font|text)\s*size?|bigger (font|text)/i.test(lower) ||
    /बड़ा\s*(अक्षर|फॉन्ट|टेक्स्ट)|(अक्षर|फॉन्ट|टेक्स्ट)\s*बड़ा/.test(lower) ||
    /ਵੱਡੇ?\s*ਅੱਖਰ|ਅੱਖਰ\s*ਵੱਡੇ?/.test(lower) ||
    /பெரிய எழுத்து|எழுத்து பெரிய/.test(lower)
  ) {
    return {
      intent: 'accessibility',
      target: null,
      action: 'increase_text_size',
      text: null,
      feedbackMessage: 'Increasing text size for easier reading...',
    };
  }

  if (
    /make text smaller|decrease (font|text)\s*size?|smaller (font|text)/i.test(lower) ||
    /छोटा\s*(अक्षर|फॉन्ट|टेक्स्ट)|(अक्षर|फॉन्ट|टेक्स्ट)\s*छोटा/.test(lower) ||
    /ਛੋਟੇ?\s*ਅੱਖਰ|ਅੱਖਰ\s*ਛੋਟੇ?/.test(lower) ||
    /சிறிய எழுத்து|எழுத்து சிறிய/.test(lower)
  ) {
    return {
      intent: 'accessibility',
      target: null,
      action: 'decrease_text_size',
      text: null,
      feedbackMessage: 'Adjusting text size smaller...',
    };
  }

  if (
    /(turn on|enable|toggle)?\s*high contrast\b/i.test(lower) ||
    /हाई\s*कंट्रास्ट|कंट्रास्ट/.test(lower) ||
    /ਹਾਈ\s*ਕੰਟ੍ਰਾਸਟ/.test(lower)
  ) {
    return {
      intent: 'accessibility',
      target: null,
      action: 'toggle_contrast',
      text: null,
      feedbackMessage: 'Toggling high contrast mode...',
    };
  }

  if (
    /stop speaking|shut up|be quiet|stop talking|pause speech/i.test(lower) ||
    /चुप|शांत|बोलना बंद/.test(lower) ||
    /ਚੁੱਪ|ਬੋਲਣਾ ਬੰਦ/.test(lower) ||
    /பேசுவதை நிறுத்து/.test(lower)
  ) {
    return {
      intent: 'accessibility',
      target: null,
      action: 'stop_speaking',
      text: null,
      feedbackMessage: 'Stopped speaking.',
    };
  }

  // 2. Reminder creation intent (checks specific task context e.g. "दवाई लेने की याद दिलाना", "ਕੱਲ੍ਹ ਸ਼ਾਮ... ਯਾਦ ਦਿਵਾਉ", "remind me to...")
  if (
    /^(please\s+)?remind(\s+me)?\b/i.test(lower) ||
    /(की|का)\s*याद\s*दिला(ना|ओ)/.test(lower) ||
    /ਦੀ\s*ਯਾਦ\s*ਦਿਵਾ(ਉ|ਓ)/.test(lower) ||
    /ਨੂੰ\s*ਯਾਦ\s*ਦਿਵਾ(ਉ|ਓ)/.test(lower) ||
    /நினைவூட்டு/.test(lower)
  ) {
    return {
      intent: 'create_reminder',
      target: null,
      action: null,
      text: transcript,
      feedbackMessage: 'Preparing your reminder...',
    };
  }

  // 3. Navigation
  if (
    /(open|show|go to|view)?\s*(my\s*)?reminders?\b/i.test(lower) ||
    /(खोलो|दिखाओ)\s*याद|याद\s*दिलाना\s*(खोलो|दिखाओ)/.test(lower) ||
    /ਯਾਦ(-|\s*)ਪੱਤਰ/.test(lower) ||
    /நினைவூட்டல்/.test(lower)
  ) {
    return {
      intent: 'navigate',
      target: 'reminders',
      action: null,
      text: null,
      feedbackMessage: 'Opening your reminders...',
    };
  }

  if (
    /(open|show|go to|view)?\s*(my\s*)?(guides?|tasks?|step by step)\b/i.test(lower) ||
    /मार्गदर्शन|कदम-दर-कदम/.test(lower) ||
    /ਮਾਰਗਦਰਸ਼ਨ/.test(lower) ||
    /வழிகாட்டல்/.test(lower)
  ) {
    return {
      intent: 'navigate',
      target: 'guides',
      action: null,
      text: null,
      feedbackMessage: 'Opening your guided tasks...',
    };
  }

  if (
    /(go\s*)?home\b/i.test(lower) ||
    /main\s*(screen|page)\b/i.test(lower) ||
    /मुख्य\s*पृष्ठ|घर/.test(lower) ||
    /ਮੁੱਖ\s*(ਪੰਨਾ|ਪੰਨੇ)/.test(lower) ||
    /முகப்பு/.test(lower)
  ) {
    return {
      intent: 'navigate',
      target: 'home',
      action: null,
      text: null,
      feedbackMessage: 'Going to the main screen...',
    };
  }

  if (
    /(open|go to|view)?\s*settings?\b/i.test(lower) ||
    /सेटिंग्स?/.test(lower) ||
    /ਸੈਟਿੰਗਾਂ/.test(lower)
  ) {
    return {
      intent: 'navigate',
      target: 'settings',
      action: null,
      text: null,
      feedbackMessage: 'Opening display and settings...',
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`voice-cmd-${ip}`, 30, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Voice commands are occurring too rapidly.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = VoiceCommandRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid command input.' }, { status: 400 });
    }

    const { transcript, detectedLanguage } = parseResult.data;

    // 1. Fast deterministic check
    const deterministic = matchDeterministicCommand(transcript);
    if (deterministic) {
      return NextResponse.json({ data: deterministic }, { status: 200 });
    }

    // 2. Structured Gemini classification for natural phrasing
    const prompt = buildVoiceCommandPrompt(transcript, detectedLanguage || 'en-IN');
    const classified = await generateStructuredContent(
      prompt,
      VoiceCommandResponseSchema,
      15000
    );

    return NextResponse.json({ data: classified }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/voice/command:', error);
    // Fallback gracefully to general question/ask
    return NextResponse.json(
      {
        data: {
          intent: 'ask',
          target: null,
          action: null,
          text: '',
          feedbackMessage: 'Asking Saathi...',
        },
      },
      { status: 200 }
    );
  }
}
