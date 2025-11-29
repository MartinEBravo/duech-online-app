/**
 * Unit tests for the user by ID API routes (GET, PUT, DELETE).
 *
 * @module __tests__/api/users/user-by-id.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/users/[id]/route';
import {
  createMockRequest,
  createMockUser,
  createMockSessionUser,
  expectResponse,
} from '@/__tests__/utils/test-helpers';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api-auth', () => ({
  setupUserApiRoute: vi.fn(),
  validateRoleAssignment: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import * as apiAuth from '@/lib/api-auth';
import * as queries from '@/lib/queries';

const createParams = (id: string): Promise<{ id: string }> => Promise.resolve({ id });

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const request = createMockRequest('http://localhost:3000/api/users/1');
    const response = await GET(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid user ID', async () => {
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      error: NextResponse.json({ error: 'Invalid user ID' }, { status: 400 }),
    });

    const request = createMockRequest('http://localhost:3000/api/users/invalid');
    const response = await GET(request, { params: createParams('invalid') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Invalid user ID');
  });

  it('should return 404 if user not found', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 999,
    });
    vi.mocked(queries.getUserById).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/users/999');
    const response = await GET(request, { params: createParams('999') });
    const data = await expectResponse<{ error: string }>(response, 404);

    expect(data.error).toBe('User not found');
  });

  it('should return user data successfully', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    const mockUser = createMockUser({ id: 1, username: 'testuser' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });
    vi.mocked(queries.getUserById).mockResolvedValue(mockUser);

    const request = createMockRequest('http://localhost:3000/api/users/1');
    const response = await GET(request, { params: createParams('1') });
    const data = await expectResponse<{ success: boolean; data: typeof mockUser }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.data.username).toBe('testuser');
  });
});

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { username: 'newname' },
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if username is too short', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { username: 'ab' },
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Username must be at least 3 characters long');
  });

  it('should return 400 for invalid email', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { email: 'invalid-email' },
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Invalid email address');
  });

  it('should return 403 for invalid role assignment', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });
    vi.mocked(apiAuth.validateRoleAssignment).mockReturnValue({
      valid: false,
      error: 'Cannot assign superadmin role',
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { role: 'superadmin' },
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 403);

    expect(data.error).toBe('Cannot assign superadmin role');
  });

  it('should update user successfully', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    const mockUpdatedUser = createMockUser({
      id: 1,
      username: 'newname',
      email: 'new@example.com',
    });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });
    vi.mocked(apiAuth.validateRoleAssignment).mockReturnValue({ valid: true });
    vi.mocked(queries.updateUser).mockResolvedValue(mockUpdatedUser);

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { username: 'newname', email: 'new@example.com', role: 'lexicographer' },
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await expectResponse<{ success: boolean; data: typeof mockUpdatedUser }>(
      response,
      200
    );

    expect(data.success).toBe(true);
    expect(queries.updateUser).toHaveBeenCalledWith(1, {
      username: 'newname',
      email: 'new@example.com',
      role: 'lexicographer',
    });
  });

  it('should normalize email to lowercase', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    const mockUpdatedUser = createMockUser();
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });
    vi.mocked(queries.updateUser).mockResolvedValue(mockUpdatedUser);

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { email: 'TEST@EXAMPLE.COM' },
    });
    await PUT(request, { params: createParams('1') });

    expect(queries.updateUser).toHaveBeenCalledWith(1, {
      email: 'test@example.com',
    });
  });

  it('should trim whitespace from username', async () => {
    const mockAdmin = createMockSessionUser({ role: 'admin' });
    const mockUpdatedUser = createMockUser();
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });
    vi.mocked(queries.updateUser).mockResolvedValue(mockUpdatedUser);

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'PUT',
      body: { username: '  newname  ' },
    });
    await PUT(request, { params: createParams('1') });

    expect(queries.updateUser).toHaveBeenCalledWith(1, {
      username: 'newname',
    });
  });
});

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when trying to delete own account', async () => {
    const mockAdmin = createMockSessionUser({ id: '1', role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 1,
    });

    const request = createMockRequest('http://localhost:3000/api/users/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Cannot delete your own account');
  });

  it('should delete user successfully', async () => {
    const mockAdmin = createMockSessionUser({ id: '1', role: 'admin' });
    const mockDeletedUser = createMockUser({ id: 2 });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 2,
    });
    vi.mocked(queries.deleteUser).mockResolvedValue(mockDeletedUser);

    const request = createMockRequest('http://localhost:3000/api/users/2', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('2') });
    const data = await expectResponse<{ success: boolean; data: typeof mockDeletedUser }>(
      response,
      200
    );

    expect(data.success).toBe(true);
    expect(queries.deleteUser).toHaveBeenCalledWith(2);
  });

  it('should return 500 on database error', async () => {
    const mockAdmin = createMockSessionUser({ id: '1', role: 'admin' });
    vi.mocked(apiAuth.setupUserApiRoute).mockResolvedValue({
      currentUser: mockAdmin,
      userId: 2,
    });
    vi.mocked(queries.deleteUser).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('http://localhost:3000/api/users/2', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('2') });
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Database error');
  });
});
