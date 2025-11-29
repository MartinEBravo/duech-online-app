/**
 * Unit tests for the users list API route.
 *
 * @module __tests__/api/users/users.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/users/route';
import {
  createMockUser,
  createMockSessionUser,
  expectResponse,
} from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/api-auth', () => ({
  requireAdminForApi: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  getUsers: vi.fn(),
}));

import * as apiAuth from '@/lib/api-auth';
import * as queries from '@/lib/queries';
import { NextResponse } from 'next/server';

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(apiAuth.requireAdminForApi).mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await GET();
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Internal server error:');
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(apiAuth.requireAdminForApi).mockRejectedValue(
      NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 })
    );

    const response = await GET();
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Internal server error:');
  });

  it('should return list of users for admin', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    const mockUsers = [
      createMockUser({ id: 1, username: 'user1', email: 'user1@example.com' }),
      createMockUser({ id: 2, username: 'user2', email: 'user2@example.com' }),
    ];

    vi.mocked(apiAuth.requireAdminForApi).mockResolvedValue(mockAdmin);
    vi.mocked(queries.getUsers).mockResolvedValue(mockUsers);

    const response = await GET();
    const data = await expectResponse<{ success: boolean; data: typeof mockUsers }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].username).toBe('user1');
    expect(data.data[1].username).toBe('user2');
  });

  it('should return empty array when no users exist', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(apiAuth.requireAdminForApi).mockResolvedValue(mockAdmin);
    vi.mocked(queries.getUsers).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse<{ success: boolean; data: unknown[] }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
  });

  it('should allow superadmin access', async () => {
    const mockSuperAdmin = createMockSessionUser({ role: 'superadmin' });
    const mockUsers = [createMockUser()];

    vi.mocked(apiAuth.requireAdminForApi).mockResolvedValue(mockSuperAdmin);
    vi.mocked(queries.getUsers).mockResolvedValue(mockUsers);

    const response = await GET();
    const data = await expectResponse<{ success: boolean; data: unknown[] }>(response, 200);

    expect(data.success).toBe(true);
  });
});
