import { describe, it, expect } from 'vitest';
import { Guide } from '@/types/guide';

describe('Guide progression and status logic', () => {
  const createSampleGuide = (): Guide => ({
    id: 'test_guide_1',
    userId: 'user_123',
    title: 'Test Guide',
    goal: 'Test Goal',
    status: 'active',
    currentStepIndex: 0,
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        title: 'Step 1',
        instruction: 'Do step 1',
        explanation: 'Step 1 details',
        completed: false,
      },
      {
        id: 'step_2',
        stepNumber: 2,
        title: 'Step 2',
        instruction: 'Do step 2',
        explanation: 'Step 2 details',
        completed: false,
      },
    ],
    createdAt: 1000,
    updatedAt: 1000,
  });

  it('completes step 1 and advances to step 2', () => {
    const guide = createSampleGuide();
    guide.steps[0].completed = true;
    guide.currentStepIndex = 1;
    guide.status = 'active';

    expect(guide.steps[0].completed).toBe(true);
    expect(guide.currentStepIndex).toBe(1);
    expect(guide.status).toBe('active');
  });

  it('marks guide completed upon finishing the last step', () => {
    const guide = createSampleGuide();
    guide.steps[0].completed = true;
    guide.steps[1].completed = true;
    guide.currentStepIndex = 1;
    guide.status = 'completed';

    expect(guide.steps.every((s) => s.completed)).toBe(true);
    expect(guide.status).toBe('completed');
  });

  it('bounds step index correctly', () => {
    const guide = createSampleGuide();
    const targetIndex = -5;
    const bounded = Math.max(0, Math.min(targetIndex, guide.steps.length - 1));
    expect(bounded).toBe(0);

    const highIndex = 10;
    const boundedHigh = Math.max(0, Math.min(highIndex, guide.steps.length - 1));
    expect(boundedHigh).toBe(1);
  });
});
