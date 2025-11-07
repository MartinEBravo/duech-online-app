'use server';

import { redirect } from 'next/navigation';
import { setSessionCookie, type SessionUser, getSessionUser } from '@/lib/auth';
import {
  getUserByEmail,
  getUserByUsername,
  verifyUserPassword,
  createUser,
  updateUser,
  deleteUser,
  hashPassword,
} from '@/lib/queries';
import { randomBytes } from 'crypto';

// Demo user for backwards compatibility - checks against DB first
const DEMO_USER: SessionUser = {
  id: '1',
  email: process.env.DEMO_USER_EMAIL || 'admin@example.com',
  name: 'Admin',
  role: 'admin',
};
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'admin123';

export async function authenticate(_: unknown, formData: FormData): Promise<string | undefined> {
  const emailOrUsername = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  // Try database users first - check both email and username
  let dbUser = await getUserByEmail(emailOrUsername);
  if (!dbUser) {
    dbUser = await getUserByUsername(emailOrUsername);
  }

  if (dbUser && (await verifyUserPassword(dbUser.passwordHash, password))) {
    await setSessionCookie({
      id: String(dbUser.id),
      email: dbUser.email || dbUser.username,
      name: dbUser.username,
      role: dbUser.role,
    });

    redirect(redirectTo);
  }

  // Fallback demo user (for backwards compatibility)
  if (emailOrUsername === DEMO_USER.email.toLowerCase() && password === DEMO_PASSWORD) {
    await setSessionCookie(DEMO_USER);
    redirect(redirectTo);
  }

  return 'Invalid email or password';
}

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

    // Role-based validation: Check what roles the current user can create
    const allowedRoles: string[] = [];

    if (currentUser.role === 'superadmin') {
      // Superadmins can create all types of users
      allowedRoles.push('lexicographer', 'editor', 'admin', 'superadmin');
    } else if (currentUser.role === 'admin') {
      // Admins can only create lexicographers and other admins
      allowedRoles.push('lexicographer', 'admin');
    }

    // Validate that the requested role is allowed
    if (!allowedRoles.includes(role)) {
      return {
        success: false,
        error: `You are not authorized to create users with role '${role}'. Allowed roles: ${allowedRoles.join(', ')}`,
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
      // Role-based validation: Check what roles the current user can assign
      const allowedRoles: string[] = [];

      if (currentUser.role === 'superadmin') {
        // Superadmins can assign all types of roles
        allowedRoles.push('lexicographer', 'editor', 'admin', 'superadmin');
      } else if (currentUser.role === 'admin') {
        // Admins can only assign lexicographer and admin roles
        allowedRoles.push('lexicographer', 'admin');
      }

      // Validate that the requested role is allowed
      if (!allowedRoles.includes(data.role)) {
        return {
          success: false,
          error: `You are not authorized to assign role '${data.role}'. Allowed roles: ${allowedRoles.join(', ')}`,
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

// Uncomment when password reset functionality is needed in the UI
// interface ResetPasswordResult {
//   success: boolean;
//   newPassword?: string;
//   error?: string;
// }

// /**
//  * Reset a user's password (admin/superadmin only)
//  */
// export async function resetUserPasswordAction(userId: number): Promise<ResetPasswordResult> {
//   try {
//     // Validate authorization
//     await requireAdminRole();

//     // Generate new secure password
//     const newPassword = generateSecurePassword(12);
//     const passwordHash = await hashPassword(newPassword);

//     // Update user's password
//     await updateUser(userId, { passwordHash });

//     return {
//       success: true,
//       newPassword,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to reset password',
//     };
//   }
// }
