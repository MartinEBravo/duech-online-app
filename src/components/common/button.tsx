/**
 * Reusable button component with loading state support.
 *
 * Can render as a button or a link depending on props.
 *
 * @module components/common/button
 */

'use client';
import React from 'react';
import Link from 'next/link';
import { SpinnerIcon } from '@/components/icons';

/**
 * Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: React.ReactNode;
  /** Shows loading spinner and disables button */
  loading?: boolean;
  /** If provided, renders as a Link instead of button */
  href?: string;
  /** Disables the button */
  disabled?: boolean;
}

/**
 * Button component that supports loading states and link rendering.
 *
 * @example
 * ```tsx
 * <Button onClick={handleClick}>Click me</Button>
 * <Button loading>Saving...</Button>
 * <Button href="/page">Go to page</Button>
 * ```
 */
export function Button({
  children,
  className = '',
  loading = false,
  href,
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-duech-blue hover:scale-105';

  // Default button styling if no className overrides it
  const defaultClasses = 'bg-duech-blue text-white hover:bg-blue-700';

  // Only apply default classes if className doesn't include bg- or text- classes
  const hasCustomBg = className.includes('bg-');
  const hasCustomText = className.includes('text-');

  const combined = `${baseClasses} ${!hasCustomBg && !hasCustomText ? defaultClasses : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combined} aria-disabled={loading} tabIndex={loading ? -1 : 0}>
        {loading && <SpinnerIcon className="mr-2 h-4 w-4" />}
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} disabled={disabled || loading} className={combined}>
      {loading && <SpinnerIcon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
