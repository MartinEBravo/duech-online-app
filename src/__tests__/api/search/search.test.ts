/**
 * Unit tests for the search API route.
 *
 * @module __tests__/api/search/search.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/search/route';
import { createMockRequest, expectResponse } from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/rate-limiting', () => ({
  applyRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/queries', () => ({
  searchWords: vi.fn(),
}));

vi.mock('@/lib/db', () => {
  const createChainableMock = () => {
    const chainable: Record<string, unknown> = {};
    chainable.from = vi.fn().mockImplementation(() => {
      // Return an object that is both thenable (for direct await) and has where method
      const fromResult = Promise.resolve([]) as Promise<unknown[]> & {
        where: ReturnType<typeof vi.fn>;
      };
      fromResult.where = vi.fn().mockResolvedValue([]);
      return fromResult;
    });
    return chainable;
  };
  return {
    db: {
      selectDistinct: vi.fn().mockImplementation(() => createChainableMock()),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

vi.mock('@/lib/editor-mode-server', () => ({
  isEditorModeFromHeaders: vi.fn().mockReturnValue(false),
}));

import * as rateLimit from '@/lib/rate-limiting';
import * as queries from '@/lib/queries';
import * as editorMode from '@/lib/editor-mode-server';

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: true });
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: false });

    const request = createMockRequest('http://localhost:3000/api/search');
    const response = await GET(request);

    expect(response.status).toBe(429);
  });

  it('should return 400 if query is too long', async () => {
    const longQuery = 'a'.repeat(101);
    const request = createMockRequest(`http://localhost:3000/api/search?q=${longQuery}`);
    const response = await GET(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Query too long');
  });

  it('should return empty results for empty query', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search');
    const response = await GET(request);
    const data = await expectResponse<{
      success: boolean;
      data: { results: unknown[]; pagination: { total: number } };
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(0);
    expect(data.data.pagination.total).toBe(0);
  });

  it('should search with query parameter', async () => {
    const mockResults = [
      { lemma: 'ejemplo', meanings: [], firstMeaningPreview: '' },
      { lemma: 'ejemplar', meanings: [], firstMeaningPreview: '' },
    ];
    vi.mocked(queries.searchWords).mockResolvedValue({
      results: mockResults as never,
      total: 2,
    });

    const request = createMockRequest('http://localhost:3000/api/search?q=ejemplo');
    const response = await GET(request);
    const data = await expectResponse<{
      success: boolean;
      data: { results: typeof mockResults; pagination: { total: number } };
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(2);
    expect(queries.searchWords).toHaveBeenCalledWith(expect.objectContaining({ query: 'ejemplo' }));
  });

  it('should parse comma-separated category filters', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest(
      'http://localhost:3000/api/search?categories=noun,verb,adjective'
    );
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ['noun', 'verb', 'adjective'],
      })
    );
  });

  it('should parse comma-separated origin filters', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest(
      'http://localhost:3000/api/search?origins=indigenous,spanish'
    );
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        origins: ['indigenous', 'spanish'],
      })
    );
  });

  it('should parse letter filters', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?letters=a,b,c');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        letters: ['a', 'b', 'c'],
      })
    );
  });

  it('should handle pagination parameters', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 100 });

    const request = createMockRequest('http://localhost:3000/api/search?page=3&limit=25');
    const response = await GET(request);
    const data = await expectResponse<{
      success: boolean;
      data: { pagination: { page: number; limit: number; totalPages: number } };
    }>(response, 200);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 3,
        pageSize: 25,
      })
    );
    expect(data.data.pagination.page).toBe(3);
    expect(data.data.pagination.limit).toBe(25);
    expect(data.data.pagination.totalPages).toBe(4);
  });

  it('should enforce maximum limit', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?limit=5000');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 1000,
      })
    );
  });

  it('should enforce minimum page number', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?page=-5');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
      })
    );
  });

  it('should return metadata only when meta=true', async () => {
    const request = createMockRequest('http://localhost:3000/api/search?meta=true');
    const response = await GET(request);
    const data = await expectResponse<{
      success: boolean;
      data: { results: unknown[]; metadata: object };
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(0);
    expect(data.data.metadata).toBeDefined();
    expect(queries.searchWords).not.toHaveBeenCalled();
  });

  it('should include editor mode drafts when editorMode=true', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?editorMode=true');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        editorMode: true,
      })
    );
  });

  it('should detect editor mode from headers', async () => {
    vi.mocked(editorMode.isEditorModeFromHeaders).mockReturnValue(true);
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        editorMode: true,
      })
    );
  });

  it('should calculate pagination correctly', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 55 });

    const request = createMockRequest('http://localhost:3000/api/search?page=2&limit=20');
    const response = await GET(request);
    const data = await expectResponse<{
      success: boolean;
      data: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      };
    }>(response, 200);

    expect(data.data.pagination.page).toBe(2);
    expect(data.data.pagination.total).toBe(55);
    expect(data.data.pagination.totalPages).toBe(3);
    expect(data.data.pagination.hasNext).toBe(true);
    expect(data.data.pagination.hasPrev).toBe(true);
  });

  it('should set hasPrev=false on first page', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 50 });

    const request = createMockRequest('http://localhost:3000/api/search?page=1');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.hasPrev).toBe(false);
  });

  it('should set hasNext=false on last page', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 20 });

    const request = createMockRequest('http://localhost:3000/api/search?page=1&limit=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.hasNext).toBe(false);
  });

  it('should handle status filter for editor mode', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?status=imported');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'imported',
      })
    );
  });

  it('should handle assignedTo filter', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?assignedTo=1,2,3');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedTo: ['1', '2', '3'],
      })
    );
  });

  it('should trim query whitespace', async () => {
    vi.mocked(queries.searchWords).mockResolvedValue({ results: [], total: 0 });

    const request = createMockRequest('http://localhost:3000/api/search?q=  ejemplo  ');
    await GET(request);

    expect(queries.searchWords).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'ejemplo',
      })
    );
  });

  it('should return 500 on unexpected error', async () => {
    vi.mocked(queries.searchWords).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('http://localhost:3000/api/search?q=test');
    const response = await GET(request);
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Internal server error');
  });
});
