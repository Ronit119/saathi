import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as transcribeHandler } from './route';

describe('Voice Transcription API Input Validation & Security', () => {
  it('rejects request when audio data is completely missing in JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await transcribeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('rejects empty or zero-byte audio payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64: 'AAAA', mimeType: 'audio/webm' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await transcribeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("couldn't hear enough audio");
  });

  it('rejects oversized audio payload exceeding size limit with 413', async () => {
    // Generate a simulated 16MB base64 string
    const oversizedBase64 = 'A'.repeat(16 * 1024 * 1024);
    const req = new NextRequest('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64: oversizedBase64, mimeType: 'audio/webm' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await transcribeHandler(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain('too long');
  });

  it('rejects multipart request missing audio file', async () => {
    const formData = new FormData();
    formData.append('preferredLanguage', 'en-IN');

    const req = new NextRequest('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    const res = await transcribeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('No audio recording found');
  });
});
