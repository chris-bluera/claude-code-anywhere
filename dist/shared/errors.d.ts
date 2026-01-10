/**
 * Custom error classes for configuration and validation errors
 */
/**
 * Base class for configuration errors
 */
export declare class ConfigError extends Error {
    readonly field: string;
    constructor(message: string, field: string);
}
/**
 * Error thrown when Telegram configuration is missing or invalid
 */
export declare class TelegramConfigError extends ConfigError {
    constructor(field: string);
}
/**
 * Error thrown when Email configuration is missing or invalid
 */
export declare class EmailConfigError extends ConfigError {
    constructor(field: string);
}
/**
 * Error thrown when a required configuration field is missing
 */
export declare class MissingConfigError extends ConfigError {
    constructor(field: string);
}
/**
 * Error thrown when state file is invalid or corrupted
 */
export declare class StateError extends Error {
    readonly path: string;
    constructor(message: string, path: string);
}
/**
 * Error thrown when a session does not exist
 */
export declare class SessionError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string);
}
/**
 * Error thrown for channel-related issues
 */
export declare class ChannelError extends Error {
    readonly channel?: string | undefined;
    constructor(message: string, channel?: string | undefined);
}
/**
 * Base class for API errors
 */
export declare class ApiError extends Error {
    readonly service: string;
    constructor(message: string, service: string);
}
/**
 * Error thrown for Telegram API failures
 */
export declare class TelegramApiError extends ApiError {
    constructor(message: string);
}
/**
 * Error thrown for Email API failures
 */
export declare class EmailApiError extends ApiError {
    constructor(message: string);
}
/**
 * Error thrown for server-related issues
 */
export declare class ServerError extends Error {
    constructor(message: string);
}
/**
 * Error thrown for invalid data or validation failures
 */
export declare class ValidationError extends Error {
    readonly field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
//# sourceMappingURL=errors.d.ts.map