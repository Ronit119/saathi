export type TextSizePreference = 'normal' | 'large' | 'xlarge';
export type ExplanationLevel = 'simple' | 'standard' | 'detailed';

export interface UserPreferences {
  textSize: TextSizePreference;
  highContrast: boolean;
  reducedMotion: boolean;
  explanationLevel: ExplanationLevel;
  voiceEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  explanationLevel: 'simple',
  voiceEnabled: false,
};
