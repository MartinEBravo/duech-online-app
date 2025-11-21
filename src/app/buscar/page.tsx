import { isEditorMode } from '@/lib/editor-mode-server';
import { getUsers } from '@/lib/queries';
import { SearchPage } from '@/components/search/search-page';
import { getSessionUser } from '@/lib/auth';

export default async function SearchPageRoute() {
  const editorMode = await isEditorMode();
  const users = editorMode ? await getUsers() : [];

  const user = await getSessionUser();
  const currentUserId = user ? Number(user.id) : null;
  const currentUserRole = user?.role ?? null;

  return (
    <SearchPage
      placeholder="Buscar palabra en el diccionario..."
      initialUsers={users}
      editorMode={editorMode}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  );
}
