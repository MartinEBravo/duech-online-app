/**
 * Alert component for displaying feedback messages.
 *
 * Supports error, success, warning, and info variants with appropriate styling.
 *
 * @module components/common/alert
 */

'use client';

import React from 'react';

/** Available alert variants */
export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

/**
 * Props for the Alert component.
 */
export interface AlertProps {
  /** The visual variant of the alert */
  variant: AlertVariant;
  /** Content to display in the alert */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/** Tailwind classes for each alert variant */
const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

/**
 * Alert component for displaying feedback messages.
 *
 * @example
 * ```tsx
 * <Alert variant="error">Something went wrong!</Alert>
 * <Alert variant="success">Operation completed successfully.</Alert>
 * ```
 */
export function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <div className={`rounded-lg border p-3 ${variantStyles[variant]} ${className}`}>
      {typeof children === 'string' ? <p className="text-sm">{children}</p> : children}
    </div>
  );
}
