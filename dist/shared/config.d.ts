/**
 * Configuration loading from environment variables
 */
import type { AppConfig, EmailConfig, TelegramConfig, Result } from './types.js';
/**
 * Load Email configuration from environment variables
 */
export declare function loadEmailConfig(): Result<EmailConfig, string>;
/**
 * Load Telegram configuration from environment variables
 * Returns success: false if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing
 */
export declare function loadTelegramConfig(): Result<TelegramConfig, string>;
/**
 * Load full application configuration
 */
export declare function loadAppConfig(): Result<AppConfig, string>;
/**
 * Get the state directory path
 * @throws Error if neither HOME nor USERPROFILE environment variable is set
 */
export declare function getStateDir(): string;
/**
 * Get the state file path
 */
export declare function getStateFilePath(): string;
/**
 * Get the logs directory path (canonical location)
 */
export declare function getLogsDir(): string;
//# sourceMappingURL=config.d.ts.map