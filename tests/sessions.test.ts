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

  describe('enableSession', () => {
    it('throws when enabling non-existent session', () => {
      // CLAUDE.md: fail early and fast - throw on unexpected state
      expect(() => sessionManager.enableSession('nonexistent')).toThrow(
        'Session nonexistent does not exist'
      );
    });

    it('enables existing session', () => {
      sessionManager.registerSession('test-session', 'Notification', 'test prompt');
      sessionManager.disableSession('test-session');
      sessionManager.enableSession('test-session');
      expect(sessionManager.isSessionEnabled('test-session')).toBe(true);
    });
  });

  describe('disableSession', () => {
    it('throws when disabling non-existent session', () => {
      // CLAUDE.md: fail early and fast - throw on unexpected state
      expect(() => sessionManager.disableSession('nonexistent')).toThrow(
        'Session nonexistent does not exist'
      );
    });

    it('disables existing session', () => {
      sessionManager.registerSession('test-session', 'Notification', 'test prompt');
      sessionManager.disableSession('test-session');
      expect(sessionManager.isSessionEnabled('test-session')).toBe(false);
    });
  });
});
