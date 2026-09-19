import { describe, it, expect } from 'vitest';
import { matchDeterministicCommand } from '@/app/api/voice/command/route';

describe('Voice Command Router Logic', () => {
  it('routes navigation commands in English, Hindi, Punjabi, and Tamil', () => {
    expect(matchDeterministicCommand('Open my reminders')?.target).toBe('reminders');
    expect(matchDeterministicCommand('Show reminders')?.target).toBe('reminders');
    expect(matchDeterministicCommand('ਮੇਰੇ ਯਾਦ-ਪੱਤਰ ਦਿਖਾਓ')?.target).toBe('reminders');
    expect(matchDeterministicCommand('मार्गदर्शन खोलो')?.target).toBe('guides');
    expect(matchDeterministicCommand('Go home')?.target).toBe('home');
    expect(matchDeterministicCommand("ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਜਾਓ")?.target).toBe('home');
    expect(matchDeterministicCommand('முகப்புக்கு செல்')?.target).toBe('home');
  });

  it('routes accessibility commands in multiple languages', () => {
    expect(matchDeterministicCommand('Make text bigger')?.action).toBe('increase_text_size');
    expect(matchDeterministicCommand('ਅੱਖਰ ਵੱਡੇ ਕਰੋ')?.action).toBe('increase_text_size');
    expect(matchDeterministicCommand('Make text smaller')?.action).toBe('decrease_text_size');
    expect(matchDeterministicCommand('Turn on high contrast')?.action).toBe('toggle_contrast');
    expect(matchDeterministicCommand('Stop speaking')?.action).toBe('stop_speaking');
    expect(matchDeterministicCommand('ਚੁੱਪ ਕਰੋ')?.action).toBe('stop_speaking');
  });

  it('routes reminder creation commands in multiple languages', () => {
    expect(matchDeterministicCommand('Remind me tomorrow at 7 PM to pay bill')?.intent).toBe('create_reminder');
    expect(matchDeterministicCommand('ਕੱਲ੍ਹ ਸ਼ਾਮ 7 ਵਜੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਭਰਨ ਦੀ ਯਾਦ ਦਿਵਾਉ')?.intent).toBe('create_reminder');
    expect(matchDeterministicCommand('कल मुझे दवाई लेने की याद दिलाना')?.intent).toBe('create_reminder');
  });
});
