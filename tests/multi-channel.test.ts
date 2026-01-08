import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChannelManager } from '../src/server/channels.js';
import type {
  Channel,
  ChannelNotification,
  ChannelResponse,
  ChannelStatus,
} from '../src/shared/channel.js';
import type { Result } from '../src/shared/types.js';

/**
 * Multi-channel response handling tests
 *
 * Tests that verify:
 * 1. Responses can come from any channel regardless of which sent the notification
 * 2. Response sync sends to other channels when a response arrives
 * 3. Channel switching works correctly
 */

/**
 * Create a mock channel for testing
 */
function createMockChannel(
  name: string,
  enabled = true
): Channel & {
  sendMock: ReturnType<typeof vi.fn>;
  pollingCallback: ((response: ChannelResponse) => void) | null;
} {
  let pollingCallback: ((response: ChannelResponse) => void) | null = null;
  const sendMock = vi
    .fn<[ChannelNotification], Promise<Result<string, string>>>()
    .mockResolvedValue({
      success: true,
      data: `${name}-msg-id`,
    });

  return {
    name,
    enabled,
    sendMock,
    pollingCallback,
    initialize: vi.fn().mockResolvedValue(undefined),
    send: sendMock,
    startPolling: vi.fn((callback) => {
      pollingCallback = callback;
    }),
    stopPolling: vi.fn(),
    dispose: vi.fn(),
    validateConfig: vi.fn(),
    getStatus: vi.fn<[], ChannelStatus>().mockReturnValue({
      name,
      enabled,
      connected: true,
      lastActivity: Date.now(),
      error: null,
    }),
    get pollingCallback() {
      return pollingCallback;
    },
  };
}

describe('Multi-channel response handling', () => {
  let channelManager: ChannelManager;
  let emailChannel: ReturnType<typeof createMockChannel>;
  let telegramChannel: ReturnType<typeof createMockChannel>;

  beforeEach(() => {
    channelManager = new ChannelManager();
    emailChannel = createMockChannel('email');
    telegramChannel = createMockChannel('telegram');
    channelManager.register(emailChannel);
    channelManager.register(telegramChannel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('cross-channel responses', () => {
    it('accepts response from any channel via unified callback', async () => {
      let receivedResponse: ChannelResponse | null = null;
      const callback = (response: ChannelResponse): void => {
        receivedResponse = response;
      };

      channelManager.startAllPolling(callback);

      // Simulate Telegram response
      const telegramResponse: ChannelResponse = {
        sessionId: 'abc123',
        response: 'User reply via Telegram',
        from: 'telegram_user',
        timestamp: Date.now(),
        channel: 'telegram',
      };

      telegramChannel.pollingCallback?.(telegramResponse);

      expect(receivedResponse).toEqual(telegramResponse);
    });

    it('accepts responses from different channels for same session', async () => {
      const responses: ChannelResponse[] = [];
      const callback = (response: ChannelResponse): void => {
        responses.push(response);
      };

      channelManager.startAllPolling(callback);

      // First response via Email
      emailChannel.pollingCallback?.({
        sessionId: 'session1',
        response: 'Reply from email',
        from: 'user@example.com',
        timestamp: Date.now(),
        channel: 'email',
      });

      // Second response via Telegram for same session
      telegramChannel.pollingCallback?.({
        sessionId: 'session1',
        response: 'Reply from telegram',
        from: 'telegram_user',
        timestamp: Date.now(),
        channel: 'telegram',
      });

      expect(responses).toHaveLength(2);
      expect(responses[0]?.channel).toBe('email');
      expect(responses[1]?.channel).toBe('telegram');
    });

    it('handles rapid channel switching between sessions', async () => {
      const responses: ChannelResponse[] = [];
      const callback = (response: ChannelResponse): void => {
        responses.push(response);
      };

      channelManager.startAllPolling(callback);

      // Session 1 via Email
      emailChannel.pollingCallback?.({
        sessionId: 'session1',
        response: 'Reply 1',
        from: 'user@example.com',
        timestamp: Date.now(),
        channel: 'email',
      });

      // Session 2 via Telegram
      telegramChannel.pollingCallback?.({
        sessionId: 'session2',
        response: 'Reply 2',
        from: 'telegram_user',
        timestamp: Date.now(),
        channel: 'telegram',
      });

      // Session 1 again via Telegram
      telegramChannel.pollingCallback?.({
        sessionId: 'session1',
        response: 'Reply 3',
        from: 'telegram_user',
        timestamp: Date.now(),
        channel: 'telegram',
      });

      expect(responses).toHaveLength(3);
      expect(responses[0]?.sessionId).toBe('session1');
      expect(responses[1]?.sessionId).toBe('session2');
      expect(responses[2]?.sessionId).toBe('session1');
    });
  });

  describe('response sync', () => {
    it('syncs response to other channels when received via Email', async () => {
      await channelManager.syncResponseToOtherChannels('session1', 'User reply', 'email');

      // Should send to Telegram (the other channel), not Email
      expect(telegramChannel.sendMock).toHaveBeenCalledTimes(1);
      expect(emailChannel.sendMock).not.toHaveBeenCalled();

      const sentNotification = telegramChannel.sendMock.mock.calls[0]?.[0];
      expect(sentNotification?.sessionId).toBe('session1');
      expect(sentNotification?.event).toBe('ResponseSync');
      expect(sentNotification?.message).toBe('User reply');
    });

    it('syncs response to other channels when received via Telegram', async () => {
      await channelManager.syncResponseToOtherChannels('session1', 'User reply', 'telegram');

      // Should send to Email (the other channel), not Telegram
      expect(emailChannel.sendMock).toHaveBeenCalledTimes(1);
      expect(telegramChannel.sendMock).not.toHaveBeenCalled();

      const sentNotification = emailChannel.sendMock.mock.calls[0]?.[0];
      expect(sentNotification?.sessionId).toBe('session1');
      expect(sentNotification?.event).toBe('ResponseSync');
      expect(sentNotification?.message).toBe('User reply');
    });

    it('does not sync back to originating channel', async () => {
      await channelManager.syncResponseToOtherChannels('session1', 'Reply', 'email');

      // Email should NOT receive sync (it originated the response)
      expect(emailChannel.sendMock).not.toHaveBeenCalled();
    });

    it('skips disabled channels during sync', async () => {
      // Create a new manager with one disabled channel
      const manager = new ChannelManager();
      const enabledEmail = createMockChannel('email', true);
      const disabledTelegram = createMockChannel('telegram', false);
      manager.register(enabledEmail);
      manager.register(disabledTelegram);

      await manager.syncResponseToOtherChannels('session1', 'Reply', 'email');

      // Disabled telegram should not receive sync
      expect(disabledTelegram.sendMock).not.toHaveBeenCalled();
    });

    it('handles sync when only one channel enabled', async () => {
      // Create manager with only email
      const manager = new ChannelManager();
      const onlyEmail = createMockChannel('email', true);
      manager.register(onlyEmail);

      // Should not throw, just do nothing
      await expect(
        manager.syncResponseToOtherChannels('session1', 'Reply', 'email')
      ).resolves.not.toThrow();

      expect(onlyEmail.sendMock).not.toHaveBeenCalled();
    });

    it('syncs to multiple channels when more than two exist', async () => {
      // Create manager with 3 channels
      const manager = new ChannelManager();
      const email = createMockChannel('email', true);
      const telegram = createMockChannel('telegram', true);
      const sms = createMockChannel('sms', true);
      manager.register(email);
      manager.register(telegram);
      manager.register(sms);

      await manager.syncResponseToOtherChannels('session1', 'Reply', 'email');

      // Both telegram and sms should receive sync
      expect(telegram.sendMock).toHaveBeenCalledTimes(1);
      expect(sms.sendMock).toHaveBeenCalledTimes(1);
      expect(email.sendMock).not.toHaveBeenCalled();
    });
  });

  describe('session matching consistency', () => {
    it('response includes channel identifier for tracking', async () => {
      let lastResponse: ChannelResponse | null = null;
      const callback = (response: ChannelResponse): void => {
        lastResponse = response;
      };

      channelManager.startAllPolling(callback);

      emailChannel.pollingCallback?.({
        sessionId: 'abc123',
        response: 'test',
        from: 'user@example.com',
        timestamp: Date.now(),
        channel: 'email',
      });

      expect(lastResponse?.channel).toBe('email');

      telegramChannel.pollingCallback?.({
        sessionId: 'abc123',
        response: 'test',
        from: 'telegram_user',
        timestamp: Date.now(),
        channel: 'telegram',
      });

      expect(lastResponse?.channel).toBe('telegram');
    });
  });
});
