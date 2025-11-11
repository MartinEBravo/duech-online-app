'use client';

import React from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <div className={`rounded-lg border p-3 ${variantStyles[variant]} ${className}`}>
      {typeof children === 'string' ? <p className="text-sm">{children}</p> : children}
    </div>
  );
}
