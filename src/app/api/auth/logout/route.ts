import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionUser } from '@/lib/auth';
import { updateUser } from '@/lib/queries';

/**
 * POST /api/logout
 * Clears the session cookie and logs the user out
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/login';

  // Get current user to clear their session ID
  try {
    const user = await getSessionUser();
    if (user) {
      // Clear the session ID in database
      await updateUser(Number(user.id), { currentSessionId: null });
    }
  } catch (error) {
    console.error('Error clearing session ID during logout:', error);
  }

  // Clear the session cookie
  await clearSessionCookie();

  const response = NextResponse.json({
    success: true,
    redirectTo: redirect,
  });

  // Set additional headers to ensure cookie is cleared on client
  response.headers.set(
    'Set-Cookie',
    'duech_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
  );

  return response;
}
