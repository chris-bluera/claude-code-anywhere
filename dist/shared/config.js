/**
 * Configuration loading from environment variables
 */
const DEFAULT_PORT = 3847;
const DEFAULT_BRIDGE_URL = 'http://localhost:3847';
/**
 * Load Telnyx configuration from environment variables
 */
export function loadTelnyxConfig() {
    const apiKey = process.env['TELNYX_API_KEY'];
    const fromNumber = process.env['TELNYX_FROM_NUMBER'];
    const userPhone = process.env['SMS_USER_PHONE'];
    const missing = [];
    if (apiKey === undefined || apiKey === '') {
        missing.push('TELNYX_API_KEY');
    }
    if (fromNumber === undefined || fromNumber === '') {
        missing.push('TELNYX_FROM_NUMBER');
    }
    if (userPhone === undefined || userPhone === '') {
        missing.push('SMS_USER_PHONE');
    }
    if (apiKey === undefined ||
        apiKey === '' ||
        fromNumber === undefined ||
        fromNumber === '' ||
        userPhone === undefined ||
        userPhone === '') {
        return {
            success: false,
            error: `Missing required environment variables: ${missing.join(', ')}`,
        };
    }
    return {
        success: true,
        data: {
            apiKey,
            fromNumber,
            userPhone,
        },
    };
}
/**
 * Load full application configuration
 */
export function loadAppConfig() {
    const telnyxResult = loadTelnyxConfig();
    if (!telnyxResult.success) {
        return telnyxResult;
    }
    const portEnv = process.env['SMS_BRIDGE_PORT'];
    const port = portEnv !== undefined && portEnv !== '' ? parseInt(portEnv, 10) : DEFAULT_PORT;
    if (isNaN(port) || port < 1 || port > 65535) {
        return {
            success: false,
            error: `Invalid SMS_BRIDGE_PORT: ${portEnv ?? 'undefined'}`,
        };
    }
    const bridgeUrl = process.env['SMS_BRIDGE_URL'] ?? DEFAULT_BRIDGE_URL;
    return {
        success: true,
        data: {
            telnyx: telnyxResult.data,
            bridgeUrl,
            port,
        },
    };
}
/**
 * Get the state directory path
 * @throws Error if neither HOME nor USERPROFILE environment variable is set
 */
export function getStateDir() {
    const home = process.env['HOME'] ?? process.env['USERPROFILE'];
    if (home === undefined) {
        throw new Error('Cannot determine home directory: neither HOME nor USERPROFILE environment variable is set');
    }
    return `${home}/.claude/claude-sms`;
}
/**
 * Get the state file path
 */
export function getStateFilePath() {
    return `${getStateDir()}/state.json`;
}
//# sourceMappingURL=config.js.map