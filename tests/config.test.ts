import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStateDir, getStateFilePath } from '../src/shared/config.js';

describe('config', () => {
  describe('getStateDir', () => {
    let originalHome: string | undefined;
    let originalUserProfile: string | undefined;

    beforeEach(() => {
      originalHome = process.env['HOME'];
      originalUserProfile = process.env['USERPROFILE'];
    });

    afterEach(() => {
      if (originalHome !== undefined) {
        process.env['HOME'] = originalHome;
      } else {
        delete process.env['HOME'];
      }
      if (originalUserProfile !== undefined) {
        process.env['USERPROFILE'] = originalUserProfile;
      } else {
        delete process.env['USERPROFILE'];
      }
    });

    it('uses HOME when available', () => {
      process.env['HOME'] = '/Users/test';
      delete process.env['USERPROFILE'];

      expect(getStateDir()).toBe('/Users/test/.claude/claude-sms');
    });

    it('uses USERPROFILE when HOME is not available', () => {
      delete process.env['HOME'];
      process.env['USERPROFILE'] = 'C:\\Users\\test';

      expect(getStateDir()).toBe('C:\\Users\\test/.claude/claude-sms');
    });

    it('throws when neither HOME nor USERPROFILE is available', () => {
      delete process.env['HOME'];
      delete process.env['USERPROFILE'];

      expect(() => getStateDir()).toThrow(
        'Cannot determine home directory: neither HOME nor USERPROFILE environment variable is set'
      );
    });
  });

  describe('getStateFilePath', () => {
    let originalHome: string | undefined;

    beforeEach(() => {
      originalHome = process.env['HOME'];
    });

    afterEach(() => {
      if (originalHome !== undefined) {
        process.env['HOME'] = originalHome;
      } else {
        delete process.env['HOME'];
      }
    });

    it('returns state.json path under state directory', () => {
      process.env['HOME'] = '/Users/test';

      expect(getStateFilePath()).toBe('/Users/test/.claude/claude-sms/state.json');
    });
  });
});
