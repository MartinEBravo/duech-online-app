/**
 * Delete confirmation modal with optional text confirmation.
 *
 * A dangerous action confirmation dialog that can optionally require
 * the user to type the item name to confirm deletion.
 *
 * @module components/common/delete-confirmation-modal
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/common/button';
import { Modal } from '@/components/common/modal';
import { Alert } from '@/components/common/alert';

/**
 * Props for the DeleteConfirmationModal component.
 */
export interface DeleteConfirmationModalProps {
  /** Modal title (e.g., "Eliminar palabra") */
  title: string;
  /** Name of the item being deleted */
  itemName: string;
  /** Type descriptor for the item (e.g., "la palabra", "el usuario") */
  itemType: string;
  /** Warning message about consequences of deletion */
  warningMessage: string;
  /** Async callback executed when deletion is confirmed */
  onDelete: () => Promise<void>;
  /** Callback to close the modal */
  onClose: () => void;
  /** If true, user must type itemName to confirm deletion */
  requireConfirmText?: boolean;
}

/**
 * Confirmation modal for destructive delete operations.
 *
 * Displays a warning and optionally requires the user to type the item name
 * to confirm. Shows loading state during deletion and handles errors.
 *
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   title="Eliminar palabra"
 *   itemName="chilenismo"
 *   itemType="la palabra"
 *   warningMessage="Esta acción no se puede deshacer."
 *   onDelete={async () => await deleteWord(lemma)}
 *   onClose={() => setShowModal(false)}
 *   requireConfirmText={true}
 * />
 * ```
 */
export function DeleteConfirmationModal({
  title,
  itemName,
  itemType,
  warningMessage,
  onDelete,
  onClose,
  requireConfirmText = false,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = !requireConfirmText || confirmText === itemName;

  const handleDelete = async () => {
    if (!isConfirmValid) return;

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

        {requireConfirmText && (
          <div className="mt-4">
            <label htmlFor="confirm-text" className="mb-2 block text-sm font-medium text-gray-700">
              Para confirmar, escribe <span className="font-semibold">{itemName}</span>:
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none disabled:bg-gray-100"
              placeholder={itemName}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleDelete}
          loading={isDeleting}
          disabled={isDeleting || !isConfirmValid}
          className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
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
