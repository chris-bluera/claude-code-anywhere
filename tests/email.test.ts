import { describe, it, expect } from 'vitest';
import { formatSubject, formatBody } from '../src/server/email.js';

describe('formatSubject', () => {
  it('formats notification subject with session ID and emoji', () => {
    const result = formatSubject('abc123', 'Notification');
    expect(result).toContain('[CC-abc123]');
    expect(result).toContain('Notification');
  });

  it('formats Stop event subject', () => {
    const result = formatSubject('abc123', 'Stop');
    expect(result).toContain('[CC-abc123]');
    expect(result).toContain('Session ended');
  });

  it('formats PreToolUse event subject', () => {
    const result = formatSubject('abc123', 'PreToolUse');
    expect(result).toContain('[CC-abc123]');
    expect(result).toContain('Approve tool use?');
  });

  it('formats UserPromptSubmit event subject', () => {
    const result = formatSubject('abc123', 'UserPromptSubmit');
    expect(result).toContain('[CC-abc123]');
    expect(result).toContain('Claude needs input');
  });
});

describe('formatBody', () => {
  it('appends reply instruction to message', () => {
    const result = formatBody('Test message');
    expect(result).toBe('Test message\n\nReply to this email with your response.');
  });

  it('truncates long messages', () => {
    const longMessage = 'x'.repeat(2500);
    const result = formatBody(longMessage);

    expect(result.length).toBeLessThan(2500);
    expect(result).toContain('...');
    expect(result).toContain('Reply to this email');
  });

  it('preserves short messages without truncation', () => {
    const shortMessage = 'Short message';
    const result = formatBody(shortMessage);

    expect(result).toContain(shortMessage);
    expect(result).not.toContain('...');
  });
});
