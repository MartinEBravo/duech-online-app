import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getRedactedWords } from '@/lib/queries';
import type { RedactedWord } from '@/lib/pdf-utils';
import type { Meaning } from '@/lib/definitions';

type RawRedactedWord = Awaited<ReturnType<typeof getRedactedWords>>[number];

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

function mapNotes(notes: RawRedactedWord['notes']): RedactedWord['notes'] {
  if (!notes || notes.length === 0) {
    return null;
  }

  return notes.map((note) => ({
    note: note.note ?? null,
    date: note.createdAt ? note.createdAt.toISOString() : null,
    user: note.user?.username ?? null,
  }));
}

export function mapRedactedWordsToPdf(
  words: Awaited<ReturnType<typeof getRedactedWords>>
): RedactedWord[] {
  return words.map((word) => ({
    lemma: word.lemma,
    root: word.root,
    letter: word.letter,
    meanings: word.meanings as unknown as Meaning[],
    notes: mapNotes(word.notes),
  }));
}
