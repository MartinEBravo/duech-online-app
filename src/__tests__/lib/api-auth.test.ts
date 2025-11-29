/**
 * Unit tests for API authentication utilities.
 *
 * @module __tests__/lib/api-auth.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSessionUser } from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

import * as auth from '@/lib/auth';
import { requireAdminForApi, setupUserApiRoute } from '@/lib/api-auth';

describe('requireAdminForApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw 401 if not authenticated', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);

    await expect(requireAdminForApi()).rejects.toMatchObject({
      status: 401,
    });
  });

  it('should throw 403 if user is lexicographer', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(
      createMockSessionUser({ role: 'lexicographer' })
    );

    await expect(requireAdminForApi()).rejects.toMatchObject({
      status: 403,
    });
  });

  it('should return user for admin role', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockAdmin);

    const result = await requireAdminForApi();

    expect(result).toEqual(mockAdmin);
  });

  it('should return user for superadmin role', async () => {
    const mockSuperAdmin = createMockSessionUser({ role: 'superadmin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockSuperAdmin);

    const result = await requireAdminForApi();

    expect(result).toEqual(mockSuperAdmin);
  });
});

describe('setupUserApiRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for unauthenticated user', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(null);

    const result = await setupUserApiRoute(Promise.resolve({ id: '1' }));

    expect(result.error).toBeDefined();
    expect(result.currentUser).toBeUndefined();
  });

  it('should return error for non-admin user', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(
      createMockSessionUser({ role: 'lexicographer' })
    );

    const result = await setupUserApiRoute(Promise.resolve({ id: '1' }));

    expect(result.error).toBeDefined();
  });

  it('should return error for invalid user ID', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(createMockSessionUser({ role: 'admin' }));

    const result = await setupUserApiRoute(Promise.resolve({ id: 'invalid' }));

    expect(result.error).toBeDefined();
  });

  it('should return user and userId for valid request', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(auth.getSessionUser).mockResolvedValue(mockAdmin);

    const result = await setupUserApiRoute(Promise.resolve({ id: '123' }));

    expect(result.currentUser).toEqual(mockAdmin);
    expect(result.userId).toBe(123);
    expect(result.error).toBeUndefined();
  });

  it('should parse numeric string ID correctly', async () => {
    vi.mocked(auth.getSessionUser).mockResolvedValue(createMockSessionUser({ role: 'admin' }));

    const result = await setupUserApiRoute(Promise.resolve({ id: '42' }));

    expect(result.userId).toBe(42);
  });
});
