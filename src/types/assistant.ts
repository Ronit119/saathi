export interface ExplanationResponse {
  title: string;
  meaning: string;
  whyItMatters: string;
  nextSteps: string[];
  cautions?: string[];
  followUps: string[];
}

export interface ContextualHelpResponse {
  answer: string;
  suggestedAction?: string | null;
  reassurance: string;
}

export type ContextHelpResponse = ContextualHelpResponse;

export interface ProactiveSuggestionResponse {
  hasSuggestion: boolean;
  message: string;
  actionText?: string | null;
  actionUrl?: string | null;
  relatedType: 'reminder' | 'guide' | 'none';
  relatedId?: string | null;
}
