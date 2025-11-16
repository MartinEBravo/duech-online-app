import { notFound } from 'next/navigation';
import { getWordByLemma } from '@/lib/queries';
import { WordDisplay } from '@/components/word/word-page';
import { isEditorMode } from '@/lib/editor-mode-server';
import { getSessionUser } from '@/lib/auth';

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const editorMode = await isEditorMode();
  const { id } = await params;
  const decodedLemma = decodeURIComponent(id);

  const wordData = await getWordByLemma(
    decodedLemma,
    editorMode ? { includeDrafts: true } : undefined
  );
  if (!wordData) {
    notFound();
  }

  const { word, letter, status, assignedTo, wordId, comments, createdBy } = wordData;

  return (
    <WordDisplay
      initialWord={word}
      initialLetter={letter}
      initialStatus={status}
      initialAssignedTo={assignedTo ?? undefined}
      craetedBy={createdBy ?? undefined}
      wordId={wordId}
      initialComments={comments}
      editorMode={editorMode}
      currentUserId={currentUserId}
    />
  );
}
