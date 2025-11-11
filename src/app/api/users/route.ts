import { NextResponse } from 'next/server';
import { requireAdminForApi } from '@/lib/api-auth';
import { getUsers } from '@/lib/queries';

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
