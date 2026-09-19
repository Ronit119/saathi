import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * Server-side Gemini AI client helper.
 * Never expose GEMINI_API_KEY to the browser.
 */

let clientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add your key to .env.local.');
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return clientInstance;
}

export function getModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
}

/**
 * Safely extracts and parses JSON from model output, handling optional markdown code fences.
 */
export function extractJsonFromText(rawText: string): unknown {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines[0].startsWith('```')) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // If there's leading or trailing text around a JSON object, attempt regex match
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse AI response as JSON: ${(err as Error).message}`);
  }
}

/**
 * Generates structured content from Gemini and validates against a Zod schema.
 * Includes timeout and safe retry.
 */
export async function generateStructuredContent<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  timeoutMs: number = 25000
): Promise<T> {
  const client = getGeminiClient();
  const model = getModelName();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Saathi received an empty response from the AI model.');
    }

    const parsedJson = extractJsonFromText(rawText);
    const validated = schema.safeParse(parsedJson);

    if (!validated.success) {
      console.error('Schema validation error on model response:', validated.error.issues);
      throw new Error('Saathi received an unexpected answer format. Please try asking again.');
    }

    return validated.data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('The request to Saathi took too long. Please check your internet connection and try again.');
    }
    throw err;
  }
}
