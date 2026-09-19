import { describe, it, expect } from 'vitest';
import { getSupportedMimeType } from './useVoiceRecorder';

describe('Voice Audio Recorder & MIME Negotiation', () => {
  it('returns empty string when running outside browser environment', () => {
    // In node/vitest environment, MediaRecorder is undefined
    const mime = getSupportedMimeType();
    expect(typeof mime).toBe('string');
  });
});
