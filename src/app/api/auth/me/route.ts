/**
 * Current user API endpoint.
 *
 * @module app/api/auth/me
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/auth/me - Get current authenticated user
 *
 * Returns the session data for the currently authenticated user.
 *
 * @returns User object with id, email, name, and role, or 401 if not authenticated
 */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
