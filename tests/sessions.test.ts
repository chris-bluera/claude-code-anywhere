import { describe, it, expect, beforeEach } from 'vitest';
import { sessionManager } from '../src/server/sessions.js';

describe('SessionManager', () => {
  beforeEach(() => {
    sessionManager.clear();
  });

  describe('isSessionEnabled', () => {
    it('throws when checking non-existent session', () => {
      expect(() => sessionManager.isSessionEnabled('nonexistent')).toThrow();
    });

    it('returns true for enabled session', () => {
      sessionManager.registerSession('test-session', 'Notification', 'test prompt');
      expect(sessionManager.isSessionEnabled('test-session')).toBe(true);
    });

    it('returns false for disabled session', () => {
      sessionManager.registerSession('test-session', 'Notification', 'test prompt');
      sessionManager.disableSession('test-session');
      expect(sessionManager.isSessionEnabled('test-session')).toBe(false);
    });
  });
});
