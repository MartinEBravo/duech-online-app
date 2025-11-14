'use client';
import React from 'react';
import Link from 'next/link';
import { SpinnerIcon } from '@/components/icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  href?: string;
  disabled?: boolean;
}

export function Button({
  children,
  className = '',
  loading = false,
  href,
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-duech-blue hover:scale-105';

  const combined = `${baseClasses} ${className}`;

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
