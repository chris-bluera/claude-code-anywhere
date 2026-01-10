/**
 * ChannelManager - orchestrates multiple notification channels
 *
 * Sends notifications to all enabled channels in parallel.
 * Aggregates responses from any channel.
 */
import { ChannelError } from '../shared/errors.js';
import { createLogger } from '../shared/logger.js';
const log = createLogger('channels');
/**
 * ChannelManager - manages multiple notification channels
 */
export class ChannelManager {
    channels = new Map();
    /**
     * Register a channel with the manager
     */
    register(channel) {
        if (this.channels.has(channel.name)) {
            throw new ChannelError('Channel already registered', channel.name);
        }
        this.channels.set(channel.name, channel);
        log.info(`Registered channel: ${channel.name}`);
    }
    /**
     * Get a channel by name
     */
    get(name) {
        return this.channels.get(name);
    }
    /**
     * Initialize all registered channels
     * Throws on first failure (fail-fast)
     */
    async initializeAll() {
        for (const [name, channel] of this.channels) {
            log.info(`Initializing channel: ${name}`);
            await channel.initialize();
        }
        log.info(`All ${String(this.channels.size)} channels initialized`);
    }
    /**
     * Send a notification to all enabled channels in parallel
     */
    async sendToAll(notification) {
        const results = new Map();
        let successCount = 0;
        let failureCount = 0;
        const enabledChannels = this.getEnabledChannels();
        if (enabledChannels.length === 0) {
            throw new ChannelError('No enabled channels to send to');
        }
        // Send to all channels in parallel
        const sendPromises = enabledChannels.map(async (channel) => {
            const result = await channel.send(notification);
            return { name: channel.name, result };
        });
        const sendResults = await Promise.all(sendPromises);
        for (const { name, result } of sendResults) {
            results.set(name, result);
            if (result.success) {
                successCount++;
                log.info(`Sent notification via ${name}`, {
                    sessionId: notification.sessionId,
                    messageId: result.data,
                });
            }
            else {
                failureCount++;
                log.error(`Failed to send via ${name}: ${result.error}`);
            }
        }
        return { results, successCount, failureCount };
    }
    /**
     * Start polling on all channels that support it
     */
    startAllPolling(callback) {
        for (const [name, channel] of this.channels) {
            if (channel.enabled) {
                log.info(`Starting polling on channel: ${name}`);
                channel.startPolling(callback);
            }
        }
    }
    /**
     * Stop polling on all channels
     */
    stopAllPolling() {
        for (const [name, channel] of this.channels) {
            log.info(`Stopping polling on channel: ${name}`);
            channel.stopPolling();
        }
    }
    /**
     * Dispose all channels (cleanup resources)
     */
    disposeAll() {
        for (const [name, channel] of this.channels) {
            log.info(`Disposing channel: ${name}`);
            channel.dispose();
        }
        this.channels.clear();
    }
    /**
     * Get all enabled channels
     */
    getEnabledChannels() {
        return Array.from(this.channels.values()).filter((c) => c.enabled);
    }
    /**
     * Get all registered channel names
     */
    getChannelNames() {
        return Array.from(this.channels.keys());
    }
    /**
     * Get status of all channels
     */
    getAllStatus() {
        return Array.from(this.channels.values()).map((c) => c.getStatus());
    }
    /**
     * Get the number of registered channels
     */
    get size() {
        return this.channels.size;
    }
    /**
     * Sync a user response to all other channels (except the one that received it)
     * This keeps all channels in sync when user flip-flops between them
     */
    async syncResponseToOtherChannels(sessionId, responseText, excludeChannel) {
        const enabledChannels = this.getEnabledChannels();
        const otherChannels = enabledChannels.filter((ch) => ch.name !== excludeChannel);
        if (otherChannels.length === 0) {
            log.debug('No other channels to sync response to');
            return;
        }
        const syncNotification = {
            sessionId,
            event: 'ResponseSync',
            title: 'Response Received',
            message: responseText,
        };
        const syncPromises = otherChannels.map(async (channel) => {
            const result = await channel.send(syncNotification);
            if (result.success) {
                log.info(`Synced response to ${channel.name}`, { sessionId });
            }
            else {
                log.warn(`Failed to sync response to ${channel.name}: ${result.error}`);
            }
        });
        await Promise.all(syncPromises);
    }
}
//# sourceMappingURL=channels.js.map