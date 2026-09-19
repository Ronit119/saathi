import { SupportedLanguage } from '@/i18n/config';

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  explanation: string;
  tip?: string;
  completed: boolean;
}

export type GuideStatus = 'active' | 'completed' | 'paused';

export interface Guide {
  id: string;
  userId: string;
  title: string;
  goal: string;
  status: GuideStatus;
  currentStepIndex: number;
  steps: GuideStep[];
  language?: SupportedLanguage | string;
  createdAt: number;
  updatedAt: number;
}
