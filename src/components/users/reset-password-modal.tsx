'use client';

import { useState } from 'react';
import { resetUserPasswordAction } from '@/lib/actions';
import { Button } from '@/components/common/button';
import { Modal } from '@/components/common/modal';
import { Alert } from '@/components/common/alert';

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
}

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
}

export default function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    setError('');

    try {
      const result = await resetUserPasswordAction(user.id);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Error al restablecer contraseña');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsResetting(false);
    }
  };

  if (success) {
    return (
      <Modal isOpen={true} onClose={onClose} className="w-full max-w-md p-6">
        <h2 className="mb-4 text-2xl font-bold text-green-600">¡Correo enviado!</h2>

        <Alert variant="success" className="mb-4">
          <p className="text-sm">
            Se ha enviado un correo electrónico a <strong>{user.email}</strong> con instrucciones
            para restablecer la contraseña.
          </p>
        </Alert>

        <Button onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="mb-4 text-2xl font-bold text-orange-600">Restablecer contraseña</h2>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6">
        <p className="mb-4 text-gray-700">
          ¿Deseas enviar un correo de restablecimiento de contraseña a{' '}
          <span className="font-semibold">{user.username}</span>?
        </p>
        <Alert variant="info">
          <p className="text-sm">
            Se enviará un correo electrónico a <strong>{user.email}</strong> con un enlace para
            establecer una nueva contraseña.
          </p>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleReset}
          loading={isResetting}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          Enviar correo
        </Button>
        <Button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
