/**
 * Delete word confirmation modal.
 *
 * Wraps DeleteConfirmationModal with word-specific logic
 * including API call and redirect after deletion.
 *
 * @module components/word/delete-word-modal
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';

/**
 * Props for the DeleteWordModal component.
 */
export interface DeleteWordModalProps {
  /** Word lemma to delete */
  lemma: string;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Modal for confirming word deletion.
 *
 * Requires user to type the word lemma to confirm. On success,
 * redirects to the search page.
 *
 * @example
 * ```tsx
 * {showDelete && (
 *   <DeleteWordModal
 *     lemma={word.lemma}
 *     onClose={() => setShowDelete(false)}
 *   />
 * )}
 * ```
 */
export function DeleteWordModal({ lemma, onClose }: DeleteWordModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const editorBasePath = pathname?.startsWith('/editor') ? '/editor' : '';

  const handleDelete = async () => {
    const response = await fetch(`/api/words/${encodeURIComponent(lemma)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Error al eliminar la palabra');
    }

    // Redirect to search page after successful deletion
    const searchPath = editorBasePath ? `${editorBasePath}/buscar` : '/buscar';
    router.push(searchPath);
  };

  return (
    <DeleteConfirmationModal
      title="Eliminar palabra"
      itemName={lemma}
      itemType="la palabra"
      warningMessage="Esta acción no se puede deshacer. Se eliminarán todas las definiciones, ejemplos y comentarios asociados."
      onDelete={handleDelete}
      onClose={onClose}
      requireConfirmText={true}
    />
  );
}
