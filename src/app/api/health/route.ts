import { NextResponse } from 'next/server';

export async function GET() {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  return NextResponse.json({
    status: 'ok',
    app: 'SAATHI — Intelligent Digital Companion for Senior Citizens',
    version: '1.0.0',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiConfigured,
    timestamp: Date.now(),
  });
}
