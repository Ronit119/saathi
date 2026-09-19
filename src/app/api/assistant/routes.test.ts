import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as explainHandler } from './explain/route';
import { POST as guideHandler } from './guide/route';
import { POST as proactiveHandler } from './proactive/route';

describe('Assistant API Route Handlers Input Validation', () => {
  it('rejects explain request when query is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/explain', {
      method: 'POST',
      body: JSON.stringify({ query: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('rejects guide request when goal is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/guide', {
      method: 'POST',
      body: JSON.stringify({ goal: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await guideHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('proactive endpoint deterministically returns no suggestion when state is empty without calling AI', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/proactive', {
      method: 'POST',
      body: JSON.stringify({
        upcomingReminders: [],
        activeGuides: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await proactiveHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.hasSuggestion).toBe(false);
    expect(json.data.relatedType).toBe('none');
  });
});
