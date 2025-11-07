import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateUser, deleteUser, getUserById } from '@/lib/queries';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify user is authenticated and has admin role
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { username, email, role } = body;

    // Validate input
    const updateData: {
      username?: string;
      email?: string;
      role?: string;
    } = {};

    if (username !== undefined) {
      if (username.trim().length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters long' },
          { status: 400 }
        );
      }
      updateData.username = username.trim().toLowerCase();
    }

    if (email !== undefined) {
      if (!email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      // Role-based validation: Check what roles the current user can assign
      const allowedRoles: string[] = [];

      if (currentUser.role === 'superadmin') {
        // Superadmins can assign all types of roles
        allowedRoles.push('lexicographer', 'editor', 'admin', 'superadmin');
      } else if (currentUser.role === 'admin') {
        // Admins can only assign lexicographer and admin roles
        allowedRoles.push('lexicographer', 'admin');
      }

      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          {
            error: `You are not authorized to assign role '${role}'. Allowed roles: ${allowedRoles.join(', ')}`,
          },
          { status: 403 }
        );
      }
      updateData.role = role;
    }

    // Update user
    const updatedUser = await updateUser(userId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated and has admin role
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (String(currentUser.id) === String(userId)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user
    const deletedUser = await deleteUser(userId);

    return NextResponse.json({
      success: true,
      data: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify user is authenticated and has admin role
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
