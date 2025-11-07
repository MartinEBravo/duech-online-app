import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUsers } from '@/lib/queries';

export async function GET() {
  try {
    // Verify user is authenticated and has admin role
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await getUsers();

    return NextResponse.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
