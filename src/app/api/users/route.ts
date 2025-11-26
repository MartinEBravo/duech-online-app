/**
 * Users API endpoint for listing users.
 *
 * @module app/api/users
 */

import { NextResponse } from 'next/server';
import { requireAdminForApi } from '@/lib/api-auth';
import { getUsers } from '@/lib/queries';

/**
 * GET /api/users - List all users (admin only)
 *
 * Requires admin or superadmin role.
 *
 * @returns Array of user objects (without password hashes)
 */
export async function GET() {
  try {
    // Verify user is authenticated and has admin role
    await requireAdminForApi();

    // Get all users
    const allUsers = await getUsers();

    return NextResponse.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error:' }, { status: 500 });
  }
}
