/**
 * Unit tests for the words API routes (CRUD operations).
 *
 * @module __tests__/api/words/words.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/words/[lemma]/route';
import {
  createMockRequest,
  createMockWord,
  createMockSessionUser,
  expectResponse,
} from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/queries', () => ({
  getWordByLemma: vi.fn(),
}));

vi.mock('@/lib/editor-mutations', () => ({
  createWord: vi.fn(),
  updateWordByLemma: vi.fn(),
  deleteWordByLemma: vi.fn(),
  addNoteToWord: vi.fn(),
}));

vi.mock('@/lib/rate-limiting', () => ({
  applyRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/editor-mode-server', () => ({
  isEditorModeFromHeaders: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

import * as queries from '@/lib/queries';
import * as mutations from '@/lib/editor-mutations';
import * as rateLimit from '@/lib/rate-limiting';
import * as editorMode from '@/lib/editor-mode-server';
import * as auth from '@/lib/auth';

const createParams = (lemma: string): Promise<{ lemma: string }> => Promise.resolve({ lemma });

describe('GET /api/words/[lemma]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: true });
    vi.mocked(editorMode.isEditorModeFromHeaders).mockReturnValue(false);
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: false });

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo');
    const response = await GET(request, { params: createParams('ejemplo') });

    expect(response.status).toBe(429);
  });

  it('should return 400 for empty lemma', async () => {
    const request = createMockRequest('http://localhost:3000/api/words/');
    const response = await GET(request, { params: createParams('   ') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Invalid lemma parameter');
  });

  it('should return 400 for lemma exceeding max length', async () => {
    const longLemma = 'a'.repeat(101);
    const request = createMockRequest(`http://localhost:3000/api/words/${longLemma}`);
    const response = await GET(request, { params: createParams(longLemma) });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Lemma too long');
  });

  it('should return 404 when word not found', async () => {
    vi.mocked(queries.getWordByLemma).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/words/nonexistent');
    const response = await GET(request, { params: createParams('nonexistent') });
    const data = await expectResponse<{ error: string }>(response, 404);

    expect(data.error).toBe('Word not found');
  });

  it('should return word data successfully', async () => {
    const mockWord = createMockWord();
    vi.mocked(queries.getWordByLemma).mockResolvedValue(mockWord as never);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo');
    const response = await GET(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ success: boolean; data: typeof mockWord }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.lemma).toBe('ejemplo');
    expect(queries.getWordByLemma).toHaveBeenCalledWith('ejemplo', undefined);
  });

  it('should include drafts in editor mode', async () => {
    const mockWord = createMockWord();
    vi.mocked(editorMode.isEditorModeFromHeaders).mockReturnValue(true);
    vi.mocked(queries.getWordByLemma).mockResolvedValue(mockWord as never);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo');
    const response = await GET(request, { params: createParams('ejemplo') });

    expect(response.status).toBe(200);
    expect(queries.getWordByLemma).toHaveBeenCalledWith('ejemplo', { includeDrafts: true });
  });

  it('should decode URL-encoded lemma', async () => {
    const mockWord = createMockWord({ lemma: 'niño' });
    vi.mocked(queries.getWordByLemma).mockResolvedValue(mockWord as never);

    const request = createMockRequest('http://localhost:3000/api/words/ni%C3%B1o');
    const response = await GET(request, { params: createParams('ni%C3%B1o') });

    expect(response.status).toBe(200);
    expect(queries.getWordByLemma).toHaveBeenCalledWith('niño', undefined);
  });
});

describe('POST /api/words/[lemma]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: true });
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit.applyRateLimit).mockResolvedValue({ success: false });

    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: { lemma: 'new' },
    });
    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it('should return 400 if lemma is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: {},
    });
    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('El lema es obligatorio');
  });

  it('should return 400 if lemma is empty string', async () => {
    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: { lemma: '   ' },
    });
    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('El lema es obligatorio');
  });

  it('should create word successfully with minimal data', async () => {
    vi.mocked(mutations.createWord).mockResolvedValue({
      wordId: 1,
      lemma: 'nuevo',
      letter: 'n',
    });

    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: { lemma: 'nuevo' },
    });
    const response = await POST(request);
    const data = await expectResponse<{
      success: boolean;
      data: { wordId: number; lemma: string; letter: string };
    }>(response, 201);

    expect(data.success).toBe(true);
    expect(data.data.wordId).toBe(1);
    expect(data.data.lemma).toBe('nuevo');
  });

  it('should create word with full data', async () => {
    vi.mocked(mutations.createWord).mockResolvedValue({
      wordId: 1,
      lemma: 'ejemplo',
      letter: 'e',
    });

    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: {
        lemma: 'ejemplo',
        root: 'ejemplo',
        letter: 'e',
        status: 'imported',
        assignedTo: 1,
        createdBy: 2,
        values: [
          {
            number: 1,
            meaning: 'Una definición',
            origin: 'indigenous',
            grammarCategory: 'noun',
          },
        ],
      },
    });
    const response = await POST(request);
    const data = await expectResponse<{ success: boolean }>(response, 201);

    expect(data.success).toBe(true);
    expect(mutations.createWord).toHaveBeenCalledWith(
      expect.objectContaining({
        lemma: 'ejemplo',
        root: 'ejemplo',
        values: expect.arrayContaining([
          expect.objectContaining({
            meaning: 'Una definición',
          }),
        ]),
      }),
      expect.objectContaining({
        letter: 'e',
        status: 'imported',
        assignedTo: 1,
        createdBy: 2,
      })
    );
  });

  it('should handle array assignedTo values', async () => {
    vi.mocked(mutations.createWord).mockResolvedValue({
      wordId: 1,
      lemma: 'test',
      letter: 't',
    });

    const request = createMockRequest('http://localhost:3000/api/words/new', {
      method: 'POST',
      body: {
        lemma: 'test',
        assignedTo: [5],
      },
    });
    await POST(request);

    expect(mutations.createWord).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ assignedTo: 5 })
    );
  });
});

describe('PUT /api/words/[lemma]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid request body', async () => {
    // Sending a primitive value instead of an object should return 400
    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'PUT',
      body: 'not an object',
    });
    const response = await PUT(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Solicitud inválida: se esperaba un objeto JSON');
  });

  it('should return 400 when no changes provided', async () => {
    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'PUT',
      body: {},
    });
    const response = await PUT(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('No se proporcionaron cambios para actualizar');
  });

  it('should update word successfully', async () => {
    const mockWord = createMockWord({ lemma: 'updated' });
    vi.mocked(mutations.updateWordByLemma).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'PUT',
      body: { word: mockWord, status: 'published' },
    });
    const response = await PUT(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ success: boolean }>(response, 200);

    expect(data.success).toBe(true);
    // The word is serialized to JSON and back, so dates become strings
    expect(mutations.updateWordByLemma).toHaveBeenCalledWith(
      'ejemplo',
      expect.objectContaining({
        lemma: 'updated',
        root: mockWord.root,
      }),
      {
        status: 'published',
        assignedTo: undefined,
      }
    );
  });

  it('should add comment without updating word', async () => {
    const mockUser = createMockSessionUser({ id: '1' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(mutations.addNoteToWord).mockResolvedValue({
      id: 1,
      note: 'Test comment',
      createdAt: new Date(),
      user: { id: 1, username: 'testuser' },
    });

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'PUT',
      body: { comment: 'Test comment' },
    });
    const response = await PUT(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{
      success: boolean;
      data: { comment: { id: number; note: string } };
    }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.comment.note).toBe('Test comment');
    expect(mutations.addNoteToWord).toHaveBeenCalledWith('ejemplo', 'Test comment', 1);
  });

  it('should update word and add comment together', async () => {
    const mockWord = createMockWord();
    const mockUser = createMockSessionUser({ id: '1' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(mutations.updateWordByLemma).mockResolvedValue(undefined);
    vi.mocked(mutations.addNoteToWord).mockResolvedValue({
      id: 1,
      note: 'Test comment',
      createdAt: new Date(),
      user: { id: 1, username: 'testuser' },
    });

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'PUT',
      body: { word: mockWord, comment: 'Test comment' },
    });
    const response = await PUT(request, { params: createParams('ejemplo') });

    expect(response.status).toBe(200);
    expect(mutations.updateWordByLemma).toHaveBeenCalled();
    expect(mutations.addNoteToWord).toHaveBeenCalled();
  });
});

describe('DELETE /api/words/[lemma]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Authentication required');
  });

  it('should return 403 if user is not admin', async () => {
    const mockUser = createMockSessionUser({ role: 'lexicographer' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ error: string }>(response, 403);

    expect(data.error).toBe('Forbidden: Admin permission required to delete words');
  });

  it('should delete word as admin', async () => {
    const mockUser = createMockSessionUser({ role: 'admin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(mutations.deleteWordByLemma).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ success: boolean }>(response, 200);

    expect(data.success).toBe(true);
    expect(mutations.deleteWordByLemma).toHaveBeenCalledWith('ejemplo');
  });

  it('should delete word as superadmin', async () => {
    const mockUser = createMockSessionUser({ role: 'superadmin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(mutations.deleteWordByLemma).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ success: boolean }>(response, 200);

    expect(data.success).toBe(true);
  });

  it('should return 500 on database error', async () => {
    const mockUser = createMockSessionUser({ role: 'admin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(mutations.deleteWordByLemma).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('http://localhost:3000/api/words/ejemplo', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('ejemplo') });
    const data = await expectResponse<{ error: string; details: string }>(response, 500);

    expect(data.error).toBe('Error al eliminar la palabra');
    expect(data.details).toBe('Database error');
  });
});
