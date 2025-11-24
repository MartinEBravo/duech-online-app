import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getRedactedWords } from '@/lib/queries';
import { RedactedWordsClient } from '@/components/redacted-words/redacted-words-client';

export default async function RedactadasPage() {
  // Check authentication
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch redacted words
  const redactadas = await getRedactedWords();
  return <RedactedWordsClient initialWords={redactadas} userEmail={user.email} />;
}
