/**
 * Delete user confirmation modal.
 *
 * Modal for confirming user deletion with warning about consequences.
 *
 * @module components/users/delete-user-modal
 */

'use client';

import { deleteUserAction } from '@/lib/actions';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';

/**
 * User data for deletion.
 */
export interface DeleteUserModalUser {
  /** User ID */
  id: number;
  /** Username */
  username: string;
  /** User email */
  email: string | null;
  /** User role */
  role: string;
}

/**
 * Props for the DeleteUserModal component.
 */
export interface DeleteUserModalProps {
  /** User to delete */
  user: DeleteUserModalUser;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback on successful deletion */
  onSuccess: () => void;
}

/**
 * Modal for confirming user deletion.
 *
 * Shows warning and calls deleteUserAction on confirmation.
 *
 * @example
 * ```tsx
 * <DeleteUserModal
 *   user={userToDelete}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => refreshUsers()}
 * />
 * ```
 */
export default function DeleteUserModal({ user, onClose, onSuccess }: DeleteUserModalProps) {
  const handleDelete = async () => {
    const result = await deleteUserAction(user.id);

    if (result.success) {
      onSuccess();
    } else {
      throw new Error(result.error || 'Error al eliminar usuario');
    }
  };

  return (
    <DeleteConfirmationModal
      title="Eliminar usuario"
      itemName={user.username}
      itemType="al usuario"
      warningMessage="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario."
      onDelete={handleDelete}
      onClose={onClose}
    />
  );
}
