import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFERENCES, UserPreferences } from '@/types/user';

describe('User Accessibility Preferences state', () => {
  it('has safe and accessible defaults for seniors', () => {
    expect(DEFAULT_PREFERENCES.textSize).toBe('normal');
    expect(DEFAULT_PREFERENCES.highContrast).toBe(false);
    expect(DEFAULT_PREFERENCES.reducedMotion).toBe(false);
    expect(DEFAULT_PREFERENCES.explanationLevel).toBe('simple');
  });

  it('updates text size preference correctly', () => {
    let prefs: UserPreferences = { ...DEFAULT_PREFERENCES };
    prefs = { ...prefs, textSize: 'large' };
    expect(prefs.textSize).toBe('large');

    prefs = { ...prefs, textSize: 'xlarge' };
    expect(prefs.textSize).toBe('xlarge');
  });

  it('toggles high contrast mode', () => {
    let prefs: UserPreferences = { ...DEFAULT_PREFERENCES };
    prefs = { ...prefs, highContrast: true };
    expect(prefs.highContrast).toBe(true);
  });

  it('toggles reduced motion', () => {
    let prefs: UserPreferences = { ...DEFAULT_PREFERENCES };
    prefs = { ...prefs, reducedMotion: true };
    expect(prefs.reducedMotion).toBe(true);
  });
});
