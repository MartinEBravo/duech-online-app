'use client';

import { useState } from 'react';
import { deleteUserAction } from '@/lib/actions';
import { Button } from '@/components/common/button';
import { Modal } from '@/components/common/modal';
import { Alert } from '@/components/common/alert';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const result = await deleteUserAction(user.id);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Error al eliminar usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="mb-4 text-2xl font-bold text-red-600">Eliminar Usuario</h2>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6">
        <p className="mb-4 text-gray-700">
          ¿Estás seguro de que deseas eliminar al usuario{' '}
          <span className="font-semibold">{user.username}</span>?
        </p>
        <Alert variant="warning">
          <p className="text-sm">
            <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se eliminarán todos los
            datos asociados al usuario.
          </p>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleDelete}
          loading={isDeleting}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          Eliminar Usuario
        </Button>
        <Button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
