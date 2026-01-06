/**
 * Telnyx API client for sending SMS
 */
import type { TelnyxConfig, Result, HookEvent } from '../shared/types.js';
/**
 * Format a message for SMS with session ID prefix
 */
export declare function formatSMSMessage(sessionId: string, event: HookEvent, message: string): string;
/**
 * Telnyx client for sending and receiving SMS
 */
export declare class TelnyxClient {
    private readonly config;
    constructor(config: TelnyxConfig);
    /**
     * Send an SMS message
     */
    sendSMS(message: string): Promise<Result<string, string>>;
    /**
     * Send a formatted message for a hook event
     */
    sendHookMessage(sessionId: string, event: HookEvent, message: string): Promise<Result<string, string>>;
    /**
     * Send an error response SMS
     */
    sendErrorResponse(message: string): Promise<Result<string, string>>;
    /**
     * Send a confirmation SMS
     */
    sendConfirmation(sessionId: string): Promise<Result<string, string>>;
    /**
     * Verify the from phone number matches configured user
     */
    verifyFromNumber(from: string): boolean;
}
//# sourceMappingURL=telnyx.d.ts.map