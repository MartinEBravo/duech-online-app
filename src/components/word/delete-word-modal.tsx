/**
 * Delete word confirmation modal.
 *
 * This component provides a safe deletion workflow for words, requiring
 * users to type the word's lemma to confirm deletion. It wraps the
 * generic DeleteConfirmationModal with word-specific logic.
 *
 * ## Safety Features
 * - Requires typing the exact word lemma to confirm
 * - Displays clear warning about irreversible action
 * - Lists all data that will be deleted
 *
 * ## Flow
 * 1. Modal displays with warning and confirmation input
 * 2. User types the word lemma to enable delete button
 * 3. On confirm: DELETE API call is made
 * 4. On success: redirects to search page
 * 5. On error: throws error (handled by parent modal)
 *
 * ## Permissions
 * This modal should only be shown to admin/superadmin users.
 * The parent component is responsible for permission checks.
 *
 * @module components/word/delete-word-modal
 * @see {@link DeleteWordModal} - The main exported component
 * @see {@link DeleteWordModalProps} - Props interface
 * @see {@link DeleteConfirmationModal} - Base modal component
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';

/**
 * Props for the DeleteWordModal component.
 *
 * @interface DeleteWordModalProps
 */
export interface DeleteWordModalProps {
  /**
   * The word's lemma to delete.
   * Also used as the confirmation text the user must type.
   * @type {string}
   */
  lemma: string;

  /**
   * Callback to close the modal.
   * Called on cancel or after successful deletion redirect.
   * @returns {void}
   */
  onClose: () => void;
}

/**
 * Modal for confirming word deletion with type-to-confirm.
 *
 * Displays a warning about the irreversible nature of deletion
 * and requires the user to type the word's lemma to confirm.
 * On successful deletion, redirects to the search page.
 *
 * @function DeleteWordModal
 * @param {DeleteWordModalProps} props - Component props
 * @param {string} props.lemma - Word lemma to delete
 * @param {Function} props.onClose - Close modal callback
 * @returns {JSX.Element} Delete confirmation modal
 *
 * @example
 * // Conditional rendering in word page
 * {showDeleteModal && (
 *   <DeleteWordModal
 *     lemma={word.lemma}
 *     onClose={() => setShowDeleteModal(false)}
 *   />
 * )}
 *
 * @example
 * // With state management
 * const [showDelete, setShowDelete] = useState(false);
 *
 * // In render:
 * <button onClick={() => setShowDelete(true)}>Delete Word</button>
 * {showDelete && (
 *   <DeleteWordModal
 *     lemma="chilenismo"
 *     onClose={() => setShowDelete(false)}
 *   />
 * )}
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
