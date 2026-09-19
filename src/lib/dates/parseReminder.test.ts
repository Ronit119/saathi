import { describe, it, expect } from 'vitest';
import { parseReminderInput } from './parseReminder';

describe('parseReminderInput deterministic parser', () => {
  const mockNow = new Date('2026-09-19T10:00:00.000Z');

  it('parses natural language input: "Remind me tomorrow at 7 PM to pay the electricity bill"', () => {
    const result = parseReminderInput(
      'Remind me tomorrow at 7 PM to pay the electricity bill',
      mockNow
    );

    expect(result.success).toBe(true);
    expect(result.title.toLowerCase()).toContain('pay the electricity bill');
    expect(result.dueTimestamp).toBeGreaterThan(mockNow.getTime());
    expect(result.dueDateFormatted).toContain('7:00 PM');
  });

  it('handles input without specific date as ambiguous', () => {
    const result = parseReminderInput('Buy medicine', mockNow);
    expect(result.success).toBe(false);
    expect(result.title).toBe('Buy medicine');
    expect(result.isAmbiguous).toBe(true);
  });

  it('handles empty input gracefully', () => {
    const result = parseReminderInput('   ', mockNow);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
