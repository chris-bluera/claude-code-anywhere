import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock child_process before importing tunnel
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Mock fs functions
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  createWriteStream: vi.fn(),
  chmodSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
}));

describe('CloudflaredTunnel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env['CLOUDFLARE_TUNNEL_ID'];
    delete process.env['CLOUDFLARE_TUNNEL_URL'];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startPersistentTunnel timeout behavior', () => {
    it('should fail on timeout even when tunnel URL is configured', async () => {
      vi.useFakeTimers();

      // Set up environment for named tunnel
      process.env['CLOUDFLARE_TUNNEL_ID'] = 'my-tunnel';
      process.env['CLOUDFLARE_TUNNEL_URL'] = 'https://my-tunnel.example.com';

      const { existsSync } = await import('fs');
      const { spawn } = await import('child_process');
      const { EventEmitter } = await import('events');

      // Mock cloudflared binary exists
      vi.mocked(existsSync).mockReturnValue(true);

      // Create mock process
      const mockProcess = new EventEmitter() as ReturnType<typeof spawn>;
      Object.assign(mockProcess, {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        kill: vi.fn(),
      });
      vi.mocked(spawn).mockReturnValue(mockProcess);

      // Import after mocks are set up
      const { createTunnel } = await import('../src/server/tunnel.js');

      const tunnel = createTunnel(3847);
      const startPromise = tunnel.start();

      // Advance past the 15 second timeout
      await vi.advanceTimersByTimeAsync(16000);

      const result = await startPromise;

      // CLAUDE.md: fail early and fast - timeout should be a failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
});
