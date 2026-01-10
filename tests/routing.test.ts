import { describe, it, expect } from 'vitest';

/**
 * Tests for URL routing patterns in src/server/index.ts
 * These patterns must match UUID session IDs which contain dashes
 *
 * IMPORTANT: These patterns are copied from src/server/index.ts
 * If tests fail, update the patterns in index.ts to match
 */
describe('Session ID URL patterns', () => {
  // ACTUAL patterns from src/server/index.ts - keep in sync!
  const RESPONSE_PATTERN = /^\/api\/response\/([a-f0-9-]+)$/i;
  const ENABLE_PATTERN = /^\/api\/session\/([a-f0-9-]+)\/enable$/i;
  const DISABLE_PATTERN = /^\/api\/session\/([a-f0-9-]+)\/disable$/i;

  describe('UUID session IDs with dashes', () => {
    const uuidSessionId = 'f2aaac2b-2479-4d59-bc75-bf6044c64d54';

    it('matches /api/response/:id with UUID', () => {
      const path = `/api/response/${uuidSessionId}`;
      const match = path.match(RESPONSE_PATTERN);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe(uuidSessionId);
    });

    it('matches /api/session/:id/enable with UUID', () => {
      const path = `/api/session/${uuidSessionId}/enable`;
      const match = path.match(ENABLE_PATTERN);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe(uuidSessionId);
    });

    it('matches /api/session/:id/disable with UUID', () => {
      const path = `/api/session/${uuidSessionId}/disable`;
      const match = path.match(DISABLE_PATTERN);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe(uuidSessionId);
    });
  });

  describe('hex-only session IDs (no dashes)', () => {
    const hexSessionId = 'abc123def456';

    it('matches all endpoints with hex-only session ID', () => {
      expect(`/api/response/${hexSessionId}`.match(RESPONSE_PATTERN)?.[1]).toBe(hexSessionId);
      expect(`/api/session/${hexSessionId}/enable`.match(ENABLE_PATTERN)?.[1]).toBe(hexSessionId);
      expect(`/api/session/${hexSessionId}/disable`.match(DISABLE_PATTERN)?.[1]).toBe(hexSessionId);
    });
  });

  describe('invalid session IDs', () => {
    it('rejects session IDs with invalid characters', () => {
      expect('/api/session/invalid_id!/enable'.match(ENABLE_PATTERN)).toBeNull();
      expect('/api/session/has spaces/enable'.match(ENABLE_PATTERN)).toBeNull();
    });

    it('rejects empty session IDs', () => {
      expect('/api/session//enable'.match(ENABLE_PATTERN)).toBeNull();
    });
  });
});
