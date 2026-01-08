/**
 * ChannelManager - orchestrates multiple notification channels
 *
 * Sends notifications to all enabled channels in parallel.
 * Aggregates responses from any channel.
 */
import type { Channel, ChannelNotification, ChannelStatus, ResponseCallback } from '../shared/channel.js';
import type { Result } from '../shared/types.js';
/**
 * Result of sending to multiple channels
 */
export interface MultiChannelSendResult {
    /** Results by channel name */
    results: Map<string, Result<string, string>>;
    /** Number of successful sends */
    successCount: number;
    /** Number of failed sends */
    failureCount: number;
}
/**
 * ChannelManager - manages multiple notification channels
 */
export declare class ChannelManager {
    private readonly channels;
    /**
     * Register a channel with the manager
     */
    register(channel: Channel): void;
    /**
     * Get a channel by name
     */
    get(name: string): Channel | undefined;
    /**
     * Initialize all registered channels
     * Throws on first failure (fail-fast)
     */
    initializeAll(): Promise<void>;
    /**
     * Send a notification to all enabled channels in parallel
     */
    sendToAll(notification: ChannelNotification): Promise<MultiChannelSendResult>;
    /**
     * Start polling on all channels that support it
     */
    startAllPolling(callback: ResponseCallback): void;
    /**
     * Stop polling on all channels
     */
    stopAllPolling(): void;
    /**
     * Dispose all channels (cleanup resources)
     */
    disposeAll(): void;
    /**
     * Get all enabled channels
     */
    getEnabledChannels(): Channel[];
    /**
     * Get all registered channel names
     */
    getChannelNames(): string[];
    /**
     * Get status of all channels
     */
    getAllStatus(): ChannelStatus[];
    /**
     * Get the number of registered channels
     */
    get size(): number;
}
//# sourceMappingURL=channels.d.ts.map