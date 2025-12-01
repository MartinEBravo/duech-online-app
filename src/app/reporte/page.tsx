import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getRedactedWords, getReviewedLexWords } from '@/lib/queries';
import { ExportedWordsClient } from '@/components/report-words/report-words-client';

export default async function RedactadasPage() {
  // Check authentication
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch redacted and reviewed by lexicographer words
  const [redacted, reviewedLex] = await Promise.all([getRedactedWords(), getReviewedLexWords()]);

  return (
    <ExportedWordsClient
      redactedWords={redacted}
      reviewedLexWords={reviewedLex}
      userEmail={user.email}
    />
  );
}
