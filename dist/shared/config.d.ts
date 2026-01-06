/**
 * Configuration loading from environment variables
 */
import type { AppConfig, TelnyxConfig, Result } from './types.js';
/**
 * Load Telnyx configuration from environment variables
 */
export declare function loadTelnyxConfig(): Result<TelnyxConfig, string>;
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
//# sourceMappingURL=config.d.ts.map