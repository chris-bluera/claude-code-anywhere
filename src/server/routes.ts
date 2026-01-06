/**
 * HTTP API routes for the SMS bridge server
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { ServerStatus, HookEvent } from '../shared/types.js';
import { sessionManager } from './sessions.js';
import { stateManager } from './state.js';
import { TwilioClient, generateTwiML } from './twilio.js';

const VALID_HOOK_EVENTS = new Set<string>(['Notification', 'Stop', 'PreToolUse', 'UserPromptSubmit']);

/**
 * Type guard for HookEvent
 */
function isHookEvent(value: unknown): value is HookEvent {
  return typeof value === 'string' && VALID_HOOK_EVENTS.has(value);
}

/**
 * Route handler context
 */
export interface RouteContext {
  twilioClient: TwilioClient;
  tunnelUrl: string | null;
  startTime: number;
}

/**
 * Parse URL-encoded body (for Twilio webhooks)
 */
function parseUrlEncoded(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Parse JSON body
 */
function parseJSON(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Read request body
 */
async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Send TwiML response
 */
function sendTwiML(res: ServerResponse, message?: string): void {
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(generateTwiML(message));
}

/**
 * Send error response
 */
function sendError(res: ServerResponse, statusCode: number, error: string): void {
  sendJSON(res, statusCode, { error });
}

/**
 * Handle POST /webhook/twilio - Incoming SMS from Twilio
 */
export async function handleTwilioWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext
): Promise<void> {
  const body = await readBody(req);
  const rawData = parseUrlEncoded(body);

  const from = rawData['From'] ?? '';
  const messageBody = rawData['Body'] ?? '';

  console.log(`[webhook] SMS received from ${from}: ${messageBody}`);

  // Verify sender (optional but recommended)
  if (!ctx.twilioClient.verifyFromNumber(from)) {
    console.warn(`[webhook] Unauthorized sender: ${from}`);
    sendTwiML(res);
    return;
  }

  // Parse session ID from message
  const { sessionId, response } = sessionManager.parseSessionFromSMS(messageBody);

  if (sessionId === null) {
    // Can't determine which session
    const activeIds = sessionManager.getActiveSessionIds();
    if (activeIds.length === 0) {
      sendTwiML(res, 'No active Claude Code sessions.');
    } else {
      const idList = activeIds.map((id) => `CC-${id}`).join(', ');
      sendTwiML(res, `Multiple sessions active. Reply with [CC-ID] prefix. Active: ${idList}`);
    }
    return;
  }

  if (!sessionManager.hasSession(sessionId)) {
    const activeIds = sessionManager.getActiveSessionIds();
    if (activeIds.length === 0) {
      sendTwiML(res, `Session CC-${sessionId} expired. No active sessions.`);
    } else {
      const idList = activeIds.map((id) => `CC-${id}`).join(', ');
      sendTwiML(res, `❌ Session CC-${sessionId} expired or not found. Active: ${idList}`);
    }
    return;
  }

  // Store the response
  sessionManager.storeResponse(sessionId, response, from);
  console.log(`[webhook] Response stored for session ${sessionId}`);

  sendTwiML(res, `✓ Response received for CC-${sessionId}`);
}

/**
 * Handle POST /api/send - Send SMS for a hook event
 */
export async function handleSendSMS(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext
): Promise<void> {
  const body = await readBody(req);
  const rawData = parseJSON(body);

  if (rawData === null || typeof rawData !== 'object') {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  if (
    !('sessionId' in rawData) ||
    typeof rawData.sessionId !== 'string' ||
    rawData.sessionId === ''
  ) {
    sendError(res, 400, 'Missing or invalid sessionId');
    return;
  }

  if (!('event' in rawData) || !isHookEvent(rawData.event)) {
    sendError(res, 400, 'Missing or invalid event');
    return;
  }

  if (!('message' in rawData) || typeof rawData.message !== 'string' || rawData.message === '') {
    sendError(res, 400, 'Missing or invalid message');
    return;
  }

  const sessionId = rawData.sessionId;
  const event = rawData.event;
  const message = rawData.message;

  // Check if enabled
  if (!stateManager.isHookEnabled(event)) {
    sendJSON(res, 200, { sent: false, reason: 'Hook disabled' });
    return;
  }

  if (!sessionManager.isSessionEnabled(sessionId)) {
    sendJSON(res, 200, { sent: false, reason: 'Session disabled' });
    return;
  }

  // Send the SMS
  const result = await ctx.twilioClient.sendHookMessage(sessionId, event, message);

  if (result.success) {
    sendJSON(res, 200, { sent: true, messageSid: result.data });
  } else {
    sendError(res, 500, result.error);
  }
}

/**
 * Handle POST /api/session - Register session waiting for response
 */
export async function handleRegisterSession(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext
): Promise<void> {
  const body = await readBody(req);
  const rawData = parseJSON(body);

  if (rawData === null || typeof rawData !== 'object') {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  if (
    !('sessionId' in rawData) ||
    typeof rawData.sessionId !== 'string' ||
    rawData.sessionId === ''
  ) {
    sendError(res, 400, 'Missing or invalid sessionId');
    return;
  }

  if (!('event' in rawData) || !isHookEvent(rawData.event)) {
    sendError(res, 400, 'Missing or invalid event');
    return;
  }

  if (!('prompt' in rawData) || typeof rawData.prompt !== 'string' || rawData.prompt === '') {
    sendError(res, 400, 'Missing or invalid prompt');
    return;
  }

  const sessionId = rawData.sessionId;
  const event = rawData.event;
  const prompt = rawData.prompt;

  // Check if enabled
  if (!stateManager.isHookEnabled(event)) {
    sendJSON(res, 200, { registered: false, reason: 'Hook disabled' });
    return;
  }

  // Register the session
  sessionManager.registerSession(sessionId, event, prompt);

  // Send the SMS
  const result = await ctx.twilioClient.sendHookMessage(sessionId, event, prompt);

  if (result.success) {
    sendJSON(res, 200, { registered: true, messageSid: result.data });
  } else {
    sendError(res, 500, result.error);
  }
}

/**
 * Handle GET /api/response/:sessionId - Poll for response
 */
export function handleGetResponse(
  _req: IncomingMessage,
  res: ServerResponse,
  sessionId: string
): void {
  const response = sessionManager.consumeResponse(sessionId);

  if (response !== null) {
    console.log(`[api] Response delivered for session ${sessionId}`);
    sendJSON(res, 200, response);
  } else {
    sendJSON(res, 200, { response: null });
  }
}

/**
 * Handle POST /api/session/:id/enable - Enable session
 */
export function handleEnableSession(
  _req: IncomingMessage,
  res: ServerResponse,
  sessionId: string
): void {
  const success = sessionManager.enableSession(sessionId);
  sendJSON(res, 200, { success });
}

/**
 * Handle POST /api/session/:id/disable - Disable session
 */
export function handleDisableSession(
  _req: IncomingMessage,
  res: ServerResponse,
  sessionId: string
): void {
  const success = sessionManager.disableSession(sessionId);
  sendJSON(res, 200, { success });
}

/**
 * Handle GET /api/session/:id/enabled - Check if session is enabled
 */
export function handleCheckSessionEnabled(
  _req: IncomingMessage,
  res: ServerResponse,
  sessionId: string
): void {
  const enabled = sessionManager.isSessionEnabled(sessionId);
  const globalEnabled = stateManager.isEnabled();
  sendJSON(res, 200, { enabled: enabled && globalEnabled });
}

/**
 * Handle POST /api/enable - Enable globally
 */
export function handleEnableGlobal(_req: IncomingMessage, res: ServerResponse): void {
  const success = stateManager.enable();
  sendJSON(res, 200, { success });
}

/**
 * Handle POST /api/disable - Disable globally
 */
export function handleDisableGlobal(_req: IncomingMessage, res: ServerResponse): void {
  const success = stateManager.disable();
  sendJSON(res, 200, { success });
}

/**
 * Handle GET /api/status - Server status
 */
export function handleStatus(_req: IncomingMessage, res: ServerResponse, ctx: RouteContext): void {
  const status: ServerStatus = {
    status: 'running',
    activeSessions: sessionManager.getSessionCount(),
    pendingResponses: sessionManager.getPendingResponseCount(),
    uptime: Math.floor((Date.now() - ctx.startTime) / 1000),
    tunnelUrl: ctx.tunnelUrl,
  };
  sendJSON(res, 200, status);
}

/**
 * Handle GET / - Server info
 */
export function handleRoot(_req: IncomingMessage, res: ServerResponse): void {
  sendJSON(res, 200, {
    name: 'Claude Code SMS Bridge',
    version: '0.1.0',
    endpoints: [
      'POST /webhook/twilio - Twilio webhook for incoming SMS',
      'POST /api/send - Send SMS for hook event',
      'POST /api/session - Register session waiting for response',
      'GET /api/response/:sessionId - Poll for SMS response',
      'POST /api/session/:id/enable - Enable session',
      'POST /api/session/:id/disable - Disable session',
      'GET /api/session/:id/enabled - Check if session enabled',
      'POST /api/enable - Enable globally',
      'POST /api/disable - Disable globally',
      'GET /api/status - Server status',
    ],
  });
}
