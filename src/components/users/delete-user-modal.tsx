'use client';

import { deleteUserAction } from '@/lib/actions';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
}

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

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
      title="Eliminar Usuario"
      itemName={user.username}
      itemType="al usuario"
      warningMessage="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario."
      onDelete={handleDelete}
      onClose={onClose}
    />
  );
}
