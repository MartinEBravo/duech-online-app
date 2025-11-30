/**
 * Form error display component.
 *
 * Shows validation errors with an icon in forms.
 *
 * @module components/common/form-error
 */

import { ExclamationCircleIcon } from '@/components/icons';

/**
 * Props for the FormError component.
 */
export interface FormErrorProps {
  /** Error message to display */
  message: string;
}

/**
 * Displays a form validation error with an exclamation icon.
 *
 * Returns null if the message is empty, making it safe to always render.
 * Uses aria-live for accessibility announcements.
 *
 * @example
 * ```tsx
 * <FormError message={errors.email} />
 * ```
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="mt-3 flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}
