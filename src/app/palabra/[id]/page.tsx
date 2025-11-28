import { notFound } from 'next/navigation';
import { getWordByLemma, getUsers } from '@/lib/queries';
import { WordDisplay } from '@/components/word/word-page';
import { isEditorMode } from '@/lib/editor-mode-server';
import { getSessionUser } from '@/lib/auth';

export default async function WordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const editorMode = await isEditorMode();
  const { id } = await params;
  const users = editorMode ? await getUsers() : [];
  const { preview } = await searchParams;
  const decodedLemma = decodeURIComponent(id);
  const user = await getSessionUser();
  const currentUserId = user ? Number(user.id) : null;
  const currentUserRole = user?.role ?? null;

  // Allow preview if user is logged in (has a role) and requests preview
  const canPreview = !!user?.role;
  const isPreview = preview === 'true';
  const includeDrafts = editorMode || (isPreview && canPreview);

  const wordData = await getWordByLemma(
    decodedLemma,
    includeDrafts ? { includeDrafts: true } : undefined
  );
  if (!wordData) {
    notFound();
  }

  const { word, letter, status, assignedTo, wordId, comments, createdBy } = wordData;

  // Get user role for editor mode features
  let userRole: string | undefined;
  if (editorMode) {
    const user = await getSessionUser();
    userRole = user?.role;
  }

  return (
    <WordDisplay
      initialWord={word}
      initialLetter={letter}
      initialStatus={status}
      initialAssignedTo={assignedTo ?? undefined}
      craetedBy={createdBy ?? undefined}
      wordId={wordId}
      initialUsers={users}
      initialComments={comments}
      editorMode={editorMode && !isPreview}
      userRole={userRole}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole || null}
    />
  );
}
