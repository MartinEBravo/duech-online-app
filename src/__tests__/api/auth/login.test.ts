/**
 * Unit tests for the login API route.
 *
 * @module __tests__/api/auth/login.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { createMockRequest, createMockUser, expectResponse } from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/queries', () => ({
  getUserByEmail: vi.fn(),
  getUserByUsername: vi.fn(),
  verifyUserPassword: vi.fn(),
  updateUserSessionId: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  setSessionCookie: vi.fn(),
}));

// Import mocked modules
import * as queries from '@/lib/queries';
import * as auth from '@/lib/auth';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { password: 'password123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; error: string }>(response, 400);

    expect(data.success).toBe(false);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 400 if password is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; error: string }>(response, 400);

    expect(data.success).toBe(false);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 401 if user is not found by email or username', async () => {
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null);
    vi.mocked(queries.getUserByUsername).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@example.com', password: 'password123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; error: string }>(response, 401);

    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
    expect(queries.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    expect(queries.getUserByUsername).toHaveBeenCalledWith('nonexistent@example.com');
  });

  it('should return 401 if password is incorrect', async () => {
    const mockUser = createMockUser();
    vi.mocked(queries.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(queries.verifyUserPassword).mockResolvedValue(false);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'wrongpassword' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; error: string }>(response, 401);

    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
    expect(queries.verifyUserPassword).toHaveBeenCalledWith(mockUser.passwordHash, 'wrongpassword');
  });

  it('should login successfully with email', async () => {
    const mockUser = createMockUser();
    vi.mocked(queries.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(queries.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(queries.updateUserSessionId).mockResolvedValue(undefined);
    vi.mocked(auth.setSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'correctpassword' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.redirectTo).toBe('/');
    expect(queries.updateUserSessionId).toHaveBeenCalledWith(mockUser.id, expect.any(String));
    expect(auth.setSessionCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        id: String(mockUser.id),
        email: mockUser.email,
        name: mockUser.username,
        role: mockUser.role,
      })
    );
  });

  it('should login successfully with username', async () => {
    const mockUser = createMockUser();
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null);
    vi.mocked(queries.getUserByUsername).mockResolvedValue(mockUser);
    vi.mocked(queries.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(queries.updateUserSessionId).mockResolvedValue(undefined);
    vi.mocked(auth.setSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'testuser', password: 'correctpassword' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(queries.getUserByEmail).toHaveBeenCalledWith('testuser');
    expect(queries.getUserByUsername).toHaveBeenCalledWith('testuser');
  });

  it('should use custom redirectTo from request body', async () => {
    const mockUser = createMockUser();
    vi.mocked(queries.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(queries.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(queries.updateUserSessionId).mockResolvedValue(undefined);
    vi.mocked(auth.setSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'correctpassword', redirectTo: '/dashboard' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; redirectTo: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.redirectTo).toBe('/dashboard');
  });

  it('should return 500 on unexpected error', async () => {
    vi.mocked(queries.getUserByEmail).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'password123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; error: string }>(response, 500);

    expect(data.success).toBe(false);
    expect(data.error).toBe('An error occurred during login');
  });

  it('should trim whitespace from email/username input', async () => {
    const mockUser = createMockUser();
    vi.mocked(queries.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(queries.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(queries.updateUserSessionId).mockResolvedValue(undefined);
    vi.mocked(auth.setSessionCookie).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: { email: '  test@example.com  ', password: 'correctpassword' },
    });

    const response = await POST(request);
    await expectResponse(response, 200);

    expect(queries.getUserByEmail).toHaveBeenCalledWith('test@example.com');
  });
});
