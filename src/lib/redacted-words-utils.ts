import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getRedactedWords } from '@/lib/queries';

/**
 * Common helper to authenticate user and fetch redacted words
 * Returns either the data or an error response
 */
export async function authenticateAndFetchRedactedWords(): Promise<
  | {
      success: true;
      user: { email: string; name?: string };
      words: Awaited<ReturnType<typeof getRedactedWords>>;
    }
  | { success: false; response: NextResponse }
> {
  // Get current user session
  const user = await getSessionUser();

  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  // Get words with "redacted" status
  const words = await getRedactedWords();

  return {
    success: true,
    user: { email: user.email, name: user.name },
    words,
  };
}
