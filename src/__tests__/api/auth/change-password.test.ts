/**
 * Unit tests for the change-password API route.
 *
 * @module __tests__/api/auth/change-password.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/change-password/route';
import {
  createMockRequest,
  createMockUser,
  createMockPasswordResetToken,
  expectResponse,
} from '@/__tests__/utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/queries', () => ({
  getPasswordResetToken: vi.fn(),
  hashPassword: vi.fn(),
  updateUser: vi.fn(),
  deletePasswordResetToken: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendPasswordChangeConfirmation: vi.fn(),
}));

import * as queries from '@/lib/queries';
import * as email from '@/lib/email';

describe('POST /api/auth/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { newPassword: 'NewPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Token y contraseña son requeridos');
  });

  it('should return 400 if newPassword is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('Token y contraseña son requeridos');
  });

  it('should return 401 if token is invalid', async () => {
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'invalid-token', newPassword: 'NewPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Token inválido o expirado');
  });

  it('should return 401 if token has no associated user', async () => {
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue({ user: null } as never);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'NewPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 401);

    expect(data.error).toBe('Token inválido o expirado');
  });

  it('should return 400 if password is too short', async () => {
    const mockToken = createMockPasswordResetToken();
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'Short1' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('should return 400 if password has no lowercase letter', async () => {
    const mockToken = createMockPasswordResetToken();
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'ALLUPPERCASE123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('La contraseña debe incluir al menos una letra minúscula');
  });

  it('should return 400 if password has no uppercase letter', async () => {
    const mockToken = createMockPasswordResetToken();
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'alllowercase123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('La contraseña debe incluir al menos una letra mayúscula');
  });

  it('should return 400 if password has no number', async () => {
    const mockToken = createMockPasswordResetToken();
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'NoNumbersHere' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 400);

    expect(data.error).toBe('La contraseña debe incluir al menos un número');
  });

  it('should change password successfully with valid input', async () => {
    const mockUser = createMockUser({ email: 'user@example.com' });
    const mockToken = createMockPasswordResetToken({ user: mockUser });
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);
    vi.mocked(queries.hashPassword).mockResolvedValue('new-hashed-password');
    vi.mocked(queries.updateUser).mockResolvedValue(mockUser);
    vi.mocked(queries.deletePasswordResetToken).mockResolvedValue(undefined);
    vi.mocked(email.sendPasswordChangeConfirmation).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'ValidPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; message: string }>(response, 200);

    expect(data.success).toBe(true);
    expect(data.message).toBe('Contraseña actualizada exitosamente');
    expect(queries.hashPassword).toHaveBeenCalledWith('ValidPassword123');
    expect(queries.updateUser).toHaveBeenCalledWith(mockUser.id, {
      passwordHash: 'new-hashed-password',
    });
    expect(queries.deletePasswordResetToken).toHaveBeenCalledWith('valid-token');
    expect(email.sendPasswordChangeConfirmation).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.username
    );
  });

  it('should still succeed even if confirmation email fails', async () => {
    const mockUser = createMockUser({ email: 'user@example.com' });
    const mockToken = createMockPasswordResetToken({ user: mockUser });
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);
    vi.mocked(queries.hashPassword).mockResolvedValue('new-hashed-password');
    vi.mocked(queries.updateUser).mockResolvedValue(mockUser);
    vi.mocked(queries.deletePasswordResetToken).mockResolvedValue(undefined);
    vi.mocked(email.sendPasswordChangeConfirmation).mockRejectedValue(new Error('Email failed'));

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'ValidPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ success: boolean; message: string }>(response, 200);

    expect(data.success).toBe(true);
  });

  it('should not send email if user has no email', async () => {
    const mockUser = createMockUser({ email: '' });
    const mockToken = createMockPasswordResetToken({ user: mockUser });
    vi.mocked(queries.getPasswordResetToken).mockResolvedValue(mockToken as never);
    vi.mocked(queries.hashPassword).mockResolvedValue('new-hashed-password');
    vi.mocked(queries.updateUser).mockResolvedValue(mockUser);
    vi.mocked(queries.deletePasswordResetToken).mockResolvedValue(undefined);

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'ValidPassword123' },
    });

    const response = await POST(request);
    await expectResponse(response, 200);

    expect(email.sendPasswordChangeConfirmation).not.toHaveBeenCalled();
  });

  it('should return 500 on unexpected error', async () => {
    vi.mocked(queries.getPasswordResetToken).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: { token: 'valid-token', newPassword: 'ValidPassword123' },
    });

    const response = await POST(request);
    const data = await expectResponse<{ error: string }>(response, 500);

    expect(data.error).toBe('Error al cambiar la contraseña');
  });
});
