import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import {
  getUserByEmail,
  getUserByUsername,
  verifyUserPassword,
  updateUserSessionId,
} from '@/lib/queries';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, redirectTo = '/' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailOrUsername = email.trim();

    // Try database users first - check both email and username
    // Email lookup with lowercase for consistency
    let dbUser = await getUserByEmail(emailOrUsername.toLowerCase());
    if (!dbUser) {
      // Username lookup (case-insensitive handled by query)
      dbUser = await getUserByUsername(emailOrUsername);
    }

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyUserPassword(dbUser.passwordHash, password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate unique session ID
    const sessionId = randomBytes(32).toString('hex');

    // Update user's current session ID in database
    // This will invalidate any other active sessions
    await updateUserSessionId(dbUser.id, sessionId);

    // Set session cookie with session ID
    await setSessionCookie({
      id: String(dbUser.id),
      email: dbUser.email || dbUser.username,
      name: dbUser.username,
      role: dbUser.role,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      redirectTo,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
