/**
 * Unit tests for the logout API route.
 *
 * @module __tests__/api/auth/logout.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/logout/route';
import {
  createMockRequest,
  createMockSessionUser,
  expectResponse,
} from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  clearSessionCookie: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  updateUser: vi.fn(),
}));

import * as auth from '@/lib/auth';
import * as queries from '@/lib/queries';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should logout successfully and clear session cookie', async () => {
    const mockUser = createMockSessionUser();
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(queries.updateUser).mockResolvedValue({} as never);
    vi.mocked(auth.clearSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.redirectTo).toBe('/login');
    expect(queries.updateUser).toHaveBeenCalledWith(Number(mockUser.id), {
      currentSessionId: null,
    });
    expect(auth.clearSessionCookie).toHaveBeenCalled();
  });

  it('should use custom redirect URL from query parameter', async () => {
    const mockUser = createMockSessionUser();
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(queries.updateUser).mockResolvedValue({} as never);
    vi.mocked(auth.clearSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/logout?redirect=/home', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.redirectTo).toBe('/home');
  });

  it('should still logout even if no user session exists', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);
    vi.mocked(auth.clearSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(queries.updateUser).not.toHaveBeenCalled();
    expect(auth.clearSessionCookie).toHaveBeenCalled();
  });

  it('should still logout even if clearing session ID fails', async () => {
    const mockUser = createMockSessionUser();
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);
    vi.mocked(queries.updateUser).mockRejectedValue(new Error('Database error'));
    vi.mocked(auth.clearSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(auth.clearSessionCookie).toHaveBeenCalled();
  });

  it('should set cookie expiration header in response', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);
    vi.mocked(auth.clearSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('duech_session=');
    expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970');
  });
});
