'use client';

/**
 * InlineEditable
 * Higher-level component that shows a value and an edit control. When editing,
 * it delegates input behavior to `EditableInput` and handles save strategies.
 */

import React, { useState, ReactNode } from 'react';
import { Button } from '@/components/common/button';
import { PencilIcon } from '@/components/icons';
import EditableInput from '@/components/word/editable-input';

type InlineEditableProps = {
  value: string | null;
  onSave?: (v: string | null) => Promise<void> | void;
  onChange?: (v: string | null) => void;
  placeholder?: string;
  className?: string;
  editing?: boolean;
  onCancel?: () => void;
  onStart?: () => void;
  saveStrategy?: 'manual' | 'immediate';
  editorMode?: boolean;
  addLabel?: string;
  renderDisplay?: (value: string) => ReactNode;
  renderWrapper?: (children: ReactNode) => ReactNode;
  as?: 'input' | 'textarea';
  rows?: number;
};

export default function InlineEditable({
  value,
  onSave,
  onChange,
  placeholder = '—',
  className = '',
  editing,
  onCancel,
  onStart,
  saveStrategy = 'manual',
  editorMode,
  addLabel,
  renderDisplay,
  renderWrapper,
  as = 'input',
  rows,
}: InlineEditableProps) {
  const isControlled = typeof editing === 'boolean';
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = isControlled ? (editing as boolean) : internalEditing;

  const begin = () => {
    if (!editorMode) return;

    if (isControlled) onStart?.();
    else setInternalEditing(true);
  };
  const end = () => {
    if (!isControlled) setInternalEditing(false);
  };

  const handleCommit = async (v: string) => {
    const trimmed = v.trim();
    if (saveStrategy === 'immediate') {
      await onSave?.(trimmed || null);
    } else {
      onChange?.(trimmed || null);
    }
    end();
    onCancel?.();
  };

  const displayValue = value?.trim() || '';
  const finalAddLabel = addLabel || `+ ${placeholder}`;

  if (!editorMode) {
    if (!displayValue) return null;
    const content = renderDisplay ? renderDisplay(displayValue) : displayValue;
    return renderWrapper ? <>{renderWrapper(content)}</> : <>{content}</>;
  }

  if (!isEditing) {
    if (displayValue) {
      const content = renderDisplay ? renderDisplay(displayValue) : displayValue;
      const wrappedContent = renderWrapper ? renderWrapper(content) : content;
      return (
        <div className="group flex items-center gap-2">
          {wrappedContent}
            <button
              type="button"
              onClick={begin}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 opacity-80 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 group-hover:opacity-100 hover:bg-blue-100 hover:opacity-100"
              aria-label={`Editar ${placeholder.toLowerCase()}`}
              title={`Editar ${placeholder.toLowerCase()}`}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
      );
    }
    return (
      <Button onClick={begin} className="hover:text-duech-blue text-sm text-gray-500 underline">
        {finalAddLabel}
      </Button>
    );
  }

  return (
    <EditableInput
      value={value ?? ''}
      onChange={handleCommit}
      placeholder={placeholder}
      className={className}
      autoFocus
      as={as}
      rows={rows}
    />
  );
}
