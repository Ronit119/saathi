import { z } from 'zod';

// ==========================================
// 1. HELP ME UNDERSTAND & SAFETY CHECK
// ==========================================
export const ExplainRequestSchema = z.object({
  query: z.string().min(1, 'Please enter something to explain').max(2000, 'Text is too long (maximum 2000 characters)'),
  explanationLevel: z.enum(['simple', 'standard', 'detailed']).default('simple'),
  responseLanguage: z.string().optional(),
  mode: z.enum(['explain', 'safety']).default('explain'),
});

export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export const ExplainResponseSchema = z.object({
  title: z.string().min(1),
  meaning: z.string().min(1),
  whyItMatters: z.string().min(1),
  nextSteps: z.array(z.string()).min(1),
  cautions: z.array(z.string()).optional(),
  followUps: z.array(z.string()).min(1),
});

export type ExplainResponse = z.infer<typeof ExplainResponseSchema>;

export const SafetyAssessmentResponseSchema = z.object({
  title: z.string().min(1),
  isSuspicious: z.boolean(),
  verdictLabel: z.string().min(1), // e.g. "Be Careful with this message"
  summary: z.string().min(1),
  riskReasons: z.array(z.string()),
  recommendedAction: z.string().min(1),
  howToVerify: z.string().min(1),
  cautions: z.array(z.string()).optional(),
});

export type SafetyAssessmentResponse = z.infer<typeof SafetyAssessmentResponseSchema>;

// ==========================================
// 2. DO IT WITH ME (GUIDE GENERATION)
// ==========================================
export const GuideRequestSchema = z.object({
  goal: z.string().min(2, 'Please describe what you would like to do').max(1000, 'Goal is too long'),
  context: z.string().max(1000).optional(),
  responseLanguage: z.string().optional(),
});

export type GuideRequest = z.infer<typeof GuideRequestSchema>;

export const GuideStepSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  instruction: z.string().min(1),
  explanation: z.string().min(1),
  tip: z.string().optional(),
});

export const GuideResponseSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  steps: z.array(GuideStepSchema).min(2).max(10),
  language: z.string().optional(),
});

export type GuideResponse = z.infer<typeof GuideResponseSchema>;

// ==========================================
// 3. CONTEXTUAL GUIDE ASSISTANCE
// ==========================================
export const ContextHelpRequestSchema = z.object({
  guideTitle: z.string().min(1),
  stepNumber: z.number().int().min(1),
  stepTitle: z.string().min(1),
  stepInstruction: z.string().min(1),
  userQuestion: z.string().min(1, 'Please ask your question').max(500),
  responseLanguage: z.string().optional(),
});

export type ContextHelpRequest = z.infer<typeof ContextHelpRequestSchema>;

export const ContextHelpResponseSchema = z.object({
  answer: z.string().min(1),
  suggestedAction: z.string().nullable().optional(),
  reassurance: z.string().min(1),
});

export type ContextHelpResponse = z.infer<typeof ContextHelpResponseSchema>;

// ==========================================
// 4. PROACTIVE ASSISTANCE
// ==========================================
export const ProactiveRequestSchema = z.object({
  upcomingReminders: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueTimestamp: z.number(),
      dueDateString: z.string(),
    })
  ).max(10),
  activeGuides: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      currentStepIndex: z.number(),
      totalSteps: z.number(),
      currentStepTitle: z.string(),
    })
  ).max(5),
  responseLanguage: z.string().optional(),
});

export type ProactiveRequest = z.infer<typeof ProactiveRequestSchema>;

export const ProactiveResponseSchema = z.object({
  hasSuggestion: z.boolean(),
  message: z.string(),
  actionText: z.string().nullable().optional(),
  actionUrl: z.string().nullable().optional(),
  relatedType: z.enum(['reminder', 'guide', 'none']),
  relatedId: z.string().nullable().optional(),
});

export type ProactiveResponse = z.infer<typeof ProactiveResponseSchema>;

// ==========================================
// 5. MULTILINGUAL REMINDER EXTRACTION
// ==========================================
export const ReminderExtractionRequestSchema = z.object({
  text: z.string().min(1).max(500),
  referenceDateIso: z.string(),
  userLanguage: z.string().optional(),
});

export type ReminderExtractionRequest = z.infer<typeof ReminderExtractionRequestSchema>;

export const ReminderExtractionResponseSchema = z.object({
  title: z.string().min(1),
  scheduledAt: z.string().min(1), // ISO 8601 string e.g. 2026-09-20T19:00:00.000Z
  timezone: z.string().default('Asia/Kolkata'),
  confidence: z.number().min(0).max(1),
  needsConfirmation: z.boolean(),
  formattedUnderstanding: z.string().min(1), // Clear human-readable confirmation text in the user's language
});

export type ReminderExtractionResponse = z.infer<typeof ReminderExtractionResponseSchema>;

// ==========================================
// 6. VOICE COMMAND ROUTING
// ==========================================
export const VoiceCommandRequestSchema = z.object({
  transcript: z.string().min(1).max(1000),
  detectedLanguage: z.string().optional(),
});

export type VoiceCommandRequest = z.infer<typeof VoiceCommandRequestSchema>;

export const VoiceCommandResponseSchema = z.object({
  intent: z.enum(['navigate', 'accessibility', 'create_reminder', 'ask', 'unknown']),
  target: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  feedbackMessage: z.string().min(1),
});

export type VoiceCommandResponse = z.infer<typeof VoiceCommandResponseSchema>;
