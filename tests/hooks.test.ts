import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SessionStart hook (check-install.sh)', () => {
  const hookScript = join(process.cwd(), 'hooks', 'check-install.sh');

  // Helper to run hook with JSON input via stdin (like Claude Code does)
  function runHookWithInput(sessionId: string | null, xdgConfigHome: string): void {
    const hookInput = sessionId
      ? JSON.stringify({ session_id: sessionId, cwd: '/tmp' })
      : JSON.stringify({ cwd: '/tmp' });

    execSync(`echo '${hookInput}' | bash ${hookScript}`, {
      env: {
        ...process.env,
        XDG_CONFIG_HOME: xdgConfigHome,
        HOME: tmpdir(),
      },
      stdio: 'pipe',
    });
  }

  describe('session ID persistence', () => {
    it('creates session ID file when session_id is in hook input', () => {
      const testSessionId = 'test-session-' + Date.now();
      const xdgConfigHome = join(tmpdir(), 'cca-test-create-' + Date.now());

      runHookWithInput(testSessionId, xdgConfigHome);

      // Verify the session file was created
      const configDir = join(xdgConfigHome, 'claude-code-anywhere');
      const expectedSessionFile = join(configDir, 'current-session-id');

      expect(existsSync(expectedSessionFile)).toBe(true);

      // Verify the content matches
      const savedSessionId = readFileSync(expectedSessionFile, 'utf-8').trim();
      expect(savedSessionId).toBe(testSessionId);

      // Cleanup
      rmSync(xdgConfigHome, { recursive: true });
    });

    it('does NOT create session file when session_id is missing from input', () => {
      const xdgConfigHome = join(tmpdir(), 'cca-test-missing-' + Date.now());

      runHookWithInput(null, xdgConfigHome);

      const configDir = join(xdgConfigHome, 'claude-code-anywhere');
      const expectedSessionFile = join(configDir, 'current-session-id');
      expect(existsSync(expectedSessionFile)).toBe(false);

      // Cleanup if created
      if (existsSync(xdgConfigHome)) {
        rmSync(xdgConfigHome, { recursive: true });
      }
    });

    it('does NOT create session file when input is empty', () => {
      const xdgConfigHome = join(tmpdir(), 'cca-test-empty-' + Date.now());

      // Run with empty stdin
      execSync(`echo '' | bash ${hookScript}`, {
        env: {
          ...process.env,
          XDG_CONFIG_HOME: xdgConfigHome,
          HOME: tmpdir(),
        },
        stdio: 'pipe',
      });

      const configDir = join(xdgConfigHome, 'claude-code-anywhere');
      const expectedSessionFile = join(configDir, 'current-session-id');
      expect(existsSync(expectedSessionFile)).toBe(false);

      // Cleanup if created
      if (existsSync(xdgConfigHome)) {
        rmSync(xdgConfigHome, { recursive: true });
      }
    });

    it('overwrites existing session ID file with new session', () => {
      const xdgConfigHome = join(tmpdir(), 'cca-test-overwrite-' + Date.now());
      const configDir = join(xdgConfigHome, 'claude-code-anywhere');
      mkdirSync(configDir, { recursive: true });

      const sessionFile = join(configDir, 'current-session-id');
      const oldSessionId = 'old-session-123';
      const newSessionId = 'new-session-456';

      // Write old session ID
      writeFileSync(sessionFile, oldSessionId);

      // Run hook with new session ID
      runHookWithInput(newSessionId, xdgConfigHome);

      // Verify new session ID was written
      const savedSessionId = readFileSync(sessionFile, 'utf-8').trim();
      expect(savedSessionId).toBe(newSessionId);

      // Cleanup
      rmSync(xdgConfigHome, { recursive: true });
    });
  });

  describe('config directory creation', () => {
    it('creates config directory if it does not exist', () => {
      const xdgConfigHome = join(tmpdir(), 'cca-test-newdir-' + Date.now());

      // Ensure it doesn't exist
      if (existsSync(xdgConfigHome)) {
        rmSync(xdgConfigHome, { recursive: true });
      }

      runHookWithInput('test-session', xdgConfigHome);

      const configDir = join(xdgConfigHome, 'claude-code-anywhere');
      expect(existsSync(configDir)).toBe(true);

      // Cleanup
      rmSync(xdgConfigHome, { recursive: true });
    });
  });
});
