'use client';

import { dictionary } from '@/components/fonts';
import { Button } from '@/components/common/button';
import { Alert } from '@/components/common/alert';
import { FormError } from '@/components/common/form-error';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyIcon, CheckCircleIcon } from '@/components/icons';

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Token de restablecimiento no válido');
    }
  }, [token]);

  // Real-time password validation
  useEffect(() => {
    const errors: string[] = [];

    if (newPassword.length > 0) {
      if (newPassword.length < 8) {
        errors.push('Mínimo 8 caracteres');
      }
      if (!/[a-z]/.test(newPassword)) {
        errors.push('Al menos una letra minúscula');
      }
      if (!/[A-Z]/.test(newPassword)) {
        errors.push('Al menos una letra mayúscula');
      }
      if (!/[0-9]/.test(newPassword)) {
        errors.push('Al menos un número');
      }
    }

    setValidationErrors(errors);
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      setIsPending(false);
      return;
    }

    // Validate new password meets requirements
    if (validationErrors.length > 0) {
      setErrorMessage('La nueva contraseña no cumple con los requisitos');
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Error al cambiar la contraseña');
        setIsPending(false);
        return;
      }

      setSuccessMessage(
        '¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...'
      );

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage('Error de conexión. Por favor, intente nuevamente.');
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white px-6 py-8">
          <Alert variant="error">Token de restablecimiento no válido o faltante</Alert>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white px-6 py-8">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className={`${dictionary.className} mb-2 text-2xl text-gray-900`}>¡Éxito!</h2>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
        <div className="flex-1 rounded-lg bg-gray-50 px-6 pt-8 pb-4">
          <h1 className={`${dictionary.className} mb-3 text-2xl`}>Establecer contraseña</h1>
          <p className="mb-6 text-sm text-gray-600">
            Por favor, elige una contraseña segura para tu cuenta.
          </p>

          <div className="w-full space-y-4">
            {/* New Password */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-900" htmlFor="newPassword">
                Contraseña
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <KeyIcon className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>

              {/* Password requirements */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className={validationErrors.length === 0 ? 'text-green-600' : 'text-gray-600'}>
                    Requisitos de la contraseña:
                  </p>
                  <ul className="space-y-1 pl-4">
                    <li className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      {/[a-z]/.test(newPassword) ? '✓' : '○'} Al menos una letra minúscula
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'} Al menos una letra mayúscula
                    </li>
                    <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      {/[0-9]/.test(newPassword) ? '✓' : '○'} Al menos un número
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="mb-2 block text-xs font-medium text-gray-900"
                htmlFor="confirmPassword"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu contraseña"
                  required
                />
                <KeyIcon className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          <Button
            className="bg-duech-blue mt-6 w-full px-4 py-2 text-white hover:bg-blue-800"
            type="submit"
            loading={isPending}
            disabled={isPending || validationErrors.length > 0 || newPassword !== confirmPassword}
          >
            Establecer contraseña
          </Button>

          <FormError message={errorMessage} />
        </div>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <p>Cargando...</p>
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
