'use client';

import { useState } from 'react';
import { Button } from '@/components/common/button';
import { Modal } from '@/components/common/modal';
import { Alert } from '@/components/common/alert';

interface DeleteConfirmationModalProps {
  title: string;
  itemName: string;
  itemType: string;
  warningMessage: string;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmationModal({
  title,
  itemName,
  itemType,
  warningMessage,
  onDelete,
  onClose,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await onDelete();
      // onDelete should handle success (e.g., refresh, navigate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="mb-4 text-2xl font-bold text-red-600">{title}</h2>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6">
        <p className="mb-4 text-gray-700">
          ¿Estás seguro de que deseas eliminar {itemType}{' '}
          <span className="font-semibold">{itemName}</span>?
        </p>
        <Alert variant="warning">
          <p className="text-sm">
            <strong>Advertencia:</strong> {warningMessage}
          </p>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          className="flex-1 bg-red-600 text-white hover:bg-red-700"
        >
          {title}
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
