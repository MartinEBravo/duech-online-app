'use server';

import { getSessionUser, SessionUser } from '@/lib/auth';
import { validateRoleAssignment } from '@/lib/role-utils';
import {
  createUser,
  updateUser,
  deleteUser,
  hashPassword,
  createPasswordResetToken,
  getUserByEmail,
  getUserByUsername,
  getUserById,
} from '@/lib/queries';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  const randomBytesArray = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytesArray[i] % charset.length;
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Generate a secure random token for password reset
 */
function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Check if current user has admin or superadmin role
 */
async function requireAdminRole(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new Error('Unauthorized: No session found');
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new Error('Unauthorized: Admin or superadmin role required');
  }

  return user;
}

interface CreateUserResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  generatedPassword?: string;
  error?: string;
}

/**
 * Create a new user (admin/superadmin only)
 */
export async function createUserAction(
  username: string,
  email: string,
  role: string
): Promise<CreateUserResult> {
  try {
    // Validate authorization and get current user
    const currentUser = await requireAdminRole();

    // Validate role assignment
    const validation = validateRoleAssignment(currentUser.role!, role);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Validate username and email
    if (!username || username.trim().length < 3) {
      return {
        success: false,
        error: 'Username must be at least 3 characters long',
      };
    }

    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }

    // Check if username already exists
    const existingUsername = await getUserByUsername(username.trim().toLowerCase());
    if (existingUsername) {
      return {
        success: false,
        error: 'Username already exists',
      };
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      return {
        success: false,
        error: 'Email already exists',
      };
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword(12);
    const passwordHash = await hashPassword(generatedPassword);

    // Create user
    const newUser = await createUser({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });

    // Generate password reset token and send welcome email
    try {
      const resetToken = generatePasswordResetToken();
      await createPasswordResetToken(newUser.id, resetToken);

      await sendWelcomeEmail(newUser.email || '', newUser.username, resetToken);

      console.log(`Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      // Log email error but don't fail user creation
      console.error('Failed to send welcome email:', emailError);
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email || '',
        role: newUser.role,
      },
      generatedPassword,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

interface UpdateUserResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  error?: string;
}

/**
 * Update an existing user (admin/superadmin only)
 */
export async function updateUserAction(
  userId: number,
  data: {
    username?: string;
    email?: string;
    role?: string;
  }
): Promise<UpdateUserResult> {
  try {
    // Validate authorization and get current user
    const currentUser = await requireAdminRole();

    // Validate role if provided
    if (data.role) {
      const validation = validateRoleAssignment(currentUser.role!, data.role);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }
    }

    // Check if username already exists (if changing username)
    if (data.username) {
      const existingUsername = await getUserByUsername(data.username.trim().toLowerCase());
      if (existingUsername && existingUsername.id !== userId) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }
    }

    // Check if email already exists (if changing email)
    if (data.email) {
      const existingEmail = await getUserByEmail(data.email.trim().toLowerCase());
      if (existingEmail && existingEmail.id !== userId) {
        return {
          success: false,
          error: 'Email already exists',
        };
      }
    }

    // Prepare update data
    const updateData: {
      username?: string;
      email?: string;
      role?: string;
    } = {};

    if (data.username) updateData.username = data.username.trim().toLowerCase();
    if (data.email) updateData.email = data.email.trim().toLowerCase();
    if (data.role) updateData.role = data.role;

    // Update user
    const updatedUser = await updateUser(userId, updateData);

    return {
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email || '',
        role: updatedUser.role,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

interface DeleteUserResult {
  success: boolean;
  error?: string;
}

/**
 * Delete a user (admin/superadmin only)
 */
export async function deleteUserAction(userId: number): Promise<DeleteUserResult> {
  try {
    // Validate authorization
    const currentUser = await requireAdminRole();

    // Prevent self-deletion
    if (String(currentUser.id) === String(userId)) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    // Delete user
    await deleteUser(userId);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Reset a user's password by sending them a password reset email (admin/superadmin only)
 */
export async function resetUserPasswordAction(userId: number): Promise<ResetPasswordResult> {
  try {
    // Validate authorization and get current user
    const currentUser = await requireAdminRole();

    // Get the target user
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate role hierarchy - admins can only reset passwords for users below them
    if (targetUser.role) {
      const validation = validateRoleAssignment(currentUser.role!, targetUser.role);
      if (!validation.valid) {
        return {
          success: false,
          error: 'No tienes permisos para restablecer la contraseña de este usuario',
        };
      }
    }

    // Prevent self-password-reset (except for superadmins)
    if (
      String(currentUser.id) === String(userId) &&
      !(currentUser.role === 'superadmin' || currentUser.role === 'admin')
    ) {
      return {
        success: false,
        error: 'No puedes restablecer tu propia contraseña desde aquí',
      };
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    await createPasswordResetToken(userId, resetToken);

    // Send password reset email
    try {
      if (!targetUser.email) {
        return {
          success: false,
          error: 'El usuario no tiene un correo electrónico configurado',
        };
      }

      await sendPasswordResetEmail(targetUser.email, targetUser.username, resetToken);
      console.log(`Password reset email sent to ${targetUser.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return {
        success: false,
        error: 'Error al enviar el correo de restablecimiento',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    };
  }
}
