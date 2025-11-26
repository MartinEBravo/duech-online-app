/**
 * Login form component.
 *
 * Handles user authentication with email and password.
 * Supports redirect after successful login.
 *
 * @module components/auth/login-form
 */

'use client';

import { dictionary } from '@/components/fonts';
import { Button } from '@/components/common/button';
import { FormError } from '@/components/common/form-error';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AtSymbolIcon, KeyIcon, ArrowRightIcon } from '@/components/icons';

/**
 * Login form with email and password fields.
 *
 * Submits credentials to the login API and handles redirect
 * on success. Shows error messages on failure.
 *
 * @example
 * ```tsx
 * // In a login page
 * <LoginForm />
 * ```
 */
export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams?.get('redirectTo') ?? searchParams?.get('callbackUrl') ?? '/buscar';
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email');
      const password = formData.get('password');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          redirectTo,
        }),
      });

      const result = await response.json();

      if (result.success && result.redirectTo) {
        // Force a full page reload to ensure server components are fresh
        window.location.href = result.redirectTo;
      } else {
        // Show error message
        setErrorMessage(result.error || 'An error occurred during login');
        setIsPending(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during login');
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pt-8 pb-4">
        <h1 className={`${dictionary.className} mb-3 text-2xl`}>Inicia sesión para continuar</h1>
        <div className="w-full">
          <div>
            <label className="mt-5 mb-3 block text-xs font-medium text-gray-900" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Ingrese su email"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mt-5 mb-3 block text-xs font-medium text-gray-900" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Ingrese su contraseña"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button
          className="bg-duech-blue mt-5 w-full px-4 py-2 text-white hover:bg-blue-800"
          type="submit"
          loading={isPending}
        >
          Entrar <ArrowRightIcon className="ml-2 h-5 w-5 text-gray-50" />
        </Button>
        <FormError message={errorMessage} />
      </div>
    </form>
  );
}
