import { z } from 'zod';

// ==========================================
// 1. HELP ME UNDERSTAND (EXPLAIN)
// ==========================================
export const ExplainRequestSchema = z.object({
  query: z.string().min(1, 'Please enter something to explain').max(2000, 'Text is too long (maximum 2000 characters)'),
  explanationLevel: z.enum(['simple', 'standard', 'detailed']).default('simple'),
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

// ==========================================
// 2. DO IT WITH ME (GUIDE GENERATION)
// ==========================================
export const GuideRequestSchema = z.object({
  goal: z.string().min(2, 'Please describe what you would like to do').max(1000, 'Goal is too long'),
  context: z.string().max(1000).optional(),
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
