import { NextResponse } from 'next/server';
import { getSessionUser, type SessionUser } from '@/lib/auth';
export { getAllowedRoles, validateRoleAssignment } from '@/lib/role-utils';

/**
 * Verify user is authenticated and has admin/superadmin role for API routes
 * Returns the authenticated user or throws an HTTP response error
 */
export async function requireAdminForApi(): Promise<SessionUser> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
  }

  return currentUser;
}

/**
 * Parse and validate user ID from params
 */
export async function parseUserIdFromParams(params: Promise<{ id: string }>): Promise<{
  userId?: number;
  error?: NextResponse;
}> {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (isNaN(userId)) {
    return {
      error: NextResponse.json({ error: 'Invalid user ID' }, { status: 400 }),
    };
  }

  return { userId };
}

/**
 * Common setup for user API routes: verify admin and parse user ID
 */
export async function setupUserApiRoute(params: Promise<{ id: string }>): Promise<{
  currentUser?: SessionUser;
  userId?: number;
  error?: NextResponse;
}> {
  try {
    const currentUser = await requireAdminForApi();
    const { userId, error } = await parseUserIdFromParams(params);

    if (error) {
      return { error };
    }

    return { currentUser, userId };
  } catch (err) {
    // requireAdminForApi throws NextResponse errors
    return { error: err as NextResponse };
  }
}
