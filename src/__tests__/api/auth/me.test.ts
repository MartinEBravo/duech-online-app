/**
 * Unit tests for the current user (me) API route.
 *
 * @module __tests__/api/auth/me.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { createMockSessionUser, expectResponse } from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

import * as auth from '@/lib/auth';

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<{ user: null }>(response, 401);

    expect(data.user).toBeNull();
  });

  it('should return user data when authenticated', async () => {
    const mockUser = createMockSessionUser({
      id: '123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'admin',
    });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await expectResponse<{
      user: { id: string; email: string; name: string; role: string };
    }>(response, 200);

    expect(data.user).toEqual({
      id: '123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'admin',
    });
  });

  it('should return user with all session properties', async () => {
    const mockUser = createMockSessionUser();
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await expectResponse<{
      user: { id: string; email: string; name?: string; role?: string };
    }>(response, 200);

    expect(data.user.id).toBe(mockUser.id);
    expect(data.user.email).toBe(mockUser.email);
    expect(data.user.name).toBe(mockUser.name);
    expect(data.user.role).toBe(mockUser.role);
  });

  it('should not expose sessionId in response', async () => {
    const mockUser = createMockSessionUser({ sessionId: 'secret-session-id' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await response.json();

    expect(data.user).not.toHaveProperty('sessionId');
  });

  it('should handle user without optional fields', async () => {
    const mockUser = createMockSessionUser({
      name: undefined,
      role: undefined,
    });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await expectResponse<{
      user: { id: string; email: string; name?: string; role?: string };
    }>(response, 200);

    expect(data.user.id).toBe(mockUser.id);
    expect(data.user.email).toBe(mockUser.email);
  });
});
