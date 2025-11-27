/**
 * EditableInput
 * A small reusable input component that encapsulates local draft state and common handlers.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';

type EditableInputProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
};

export default function EditableInput({
  value,
  onChange,
  onBlur,
  placeholder = '',
  className = '',
  autoFocus = false,
  as = 'input',
  rows = 4,
}: EditableInputProps) {
  const [draft, setDraft] = useState(value ?? '');
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const setRef = (node: HTMLInputElement | HTMLTextAreaElement | null) => {
    ref.current = node;
  };

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleChange = (v: string) => {
    setDraft(v);
  };

  const commit = () => {
    onChange(draft.trim());
    onBlur?.();
  };

  const classNames =
    as === 'textarea'
      ? `rounded border border-gray-300 px-3 py-2 leading-relaxed ${className}`
      : `rounded border border-gray-300 px-2 py-1 ${className}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChange(e.target.value);
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    handleChange(e.target.value);

  if (as === 'textarea') {
    return (
      <textarea
        ref={setRef}
        value={draft}
        onChange={handleTextareaChange}
        onBlur={commit}
        rows={rows}
        placeholder={placeholder}
        className={classNames}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            commit();
          }
        }}
      />
    );
  }

  return (
    <input
      ref={setRef}
      value={draft}
      onChange={handleInputChange}
      onBlur={commit}
      placeholder={placeholder}
      className={classNames}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') commit();
      }}
    />
  );
}
