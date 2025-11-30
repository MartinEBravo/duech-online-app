/**
 * Unit tests for the redacted words API route.
 *
 * @module __tests__/api/words/redacted.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/words/redacted/route';
import { expectResponse } from '@/__tests__/utils/test-helpers';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/redacted-words-utils', () => ({
  authenticateAndFetchRedactedWords: vi.fn(),
}));

import * as redactedUtils from '@/lib/redacted-words-utils';

describe('GET /api/words/redacted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if authentication fails', async () => {
    vi.mocked(redactedUtils.authenticateAndFetchRedactedWords).mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      words: [],
    });

    const response = await GET();
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(redactedUtils.authenticateAndFetchRedactedWords).mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      words: [],
    });

    const response = await GET();
    const data = await expectResponse<{ error: string }>(response, 403);

    expect(data.error).toBe('Forbidden');
  });

  it('should return redacted words successfully', async () => {
    const mockWords = [
      { lemma: 'word1', status: 'redacted', createdAt: new Date() },
      { lemma: 'word2', status: 'redacted', createdAt: new Date() },
    ];
    vi.mocked(redactedUtils.authenticateAndFetchRedactedWords).mockResolvedValue({
      success: true,
      response: NextResponse.json({}),
      words: mockWords as never,
    });

    const response = await GET();
    const data = await expectResponse<{
      success: boolean;
      words: typeof mockWords;
      count: number;
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.words).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it('should return empty array when no redacted words exist', async () => {
    vi.mocked(redactedUtils.authenticateAndFetchRedactedWords).mockResolvedValue({
      success: true,
      response: NextResponse.json({}),
      words: [],
    });

    const response = await GET();
    const data = await expectResponse<{
      success: boolean;
      words: unknown[];
      count: number;
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.words).toHaveLength(0);
    expect(data.count).toBe(0);
  });

  it('should return 500 on unexpected error', async () => {
    vi.mocked(redactedUtils.authenticateAndFetchRedactedWords).mockRejectedValue(
      new Error('Database error')
    );

    const response = await GET();
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Failed to fetch redacted words');
  });
});
