/**
 * New comment input component.
 *
 * This component provides a collapsible interface for adding new editorial
 * comments. It starts as a compact button that expands into an input field
 * when clicked, providing a clean UX that doesn't clutter the page.
 *
 * ## Interaction Flow
 * 1. User sees "Añadir comentario" button
 * 2. Click expands to input field with instructions
 * 3. Type comment and press Enter to submit
 * 4. Input collapses back to button
 *
 * ## States
 * - **Collapsed**: Shows the add button (blue, rounded)
 * - **Expanded**: Shows instruction text and input field
 *
 * ## Behavior
 * - Empty submissions are ignored
 * - Blur cancels without submitting
 * - Calls onAdd asynchronously and waits for completion
 *
 * @module components/word/comment/new
 * @see {@link NewComment} - The main exported component (default export)
 * @see {@link NewCommentProps} - Props type
 * @see {@link EditableInput} - Input component used for text entry
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/button';
import { PlusIcon } from '@/components/icons';
import EditableInput from '@/components/word/editable-input';

/**
 * Props for the NewComment component.
 *
 * @typedef NewCommentProps
 */
export type NewCommentProps = {
  /**
   * Callback to add a new comment.
   * Can be async - the component will wait for completion.
   * @param {string} text - The comment text (already trimmed)
   * @returns {Promise<void> | void}
   */
  onAdd: (text: string) => Promise<void> | void;

  /**
   * Whether to show the add button.
   * When false, component returns null.
   * @type {boolean}
   * @default true
   */
  editorMode?: boolean;
};

/**
 * Collapsible input for adding new comments.
 *
 * Shows a button that expands to an input field when clicked.
 * Handles the complete flow of expanding, capturing input,
 * submitting, and collapsing.
 *
 * @function NewComment
 * @param {NewCommentProps} props - Component props
 * @param {Function} props.onAdd - Callback with comment text
 * @param {boolean} [props.editorMode=true] - Show the add button
 * @returns {JSX.Element | null} Button or input, or null if not in editor mode
 *
 * @example
 * // Basic async usage
 * <NewComment
 *   onAdd={async (text) => {
 *     await saveCommentToAPI(text);
 *   }}
 *   editorMode={true}
 * />
 *
 * @example
 * // Synchronous handler
 * <NewComment
 *   onAdd={(text) => setComments([...comments, { text }])}
 * />
 */
export default function NewComment({ onAdd, editorMode = true }: NewCommentProps) {
  const [adding, setAdding] = useState(false);

  const start = () => setAdding(true);
  const cancel = () => setAdding(false);

  const handleAdd = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      cancel();
      return;
    }
    try {
      await onAdd(trimmed);
    } finally {
      setAdding(false);
    }
  };

  if (!editorMode) return null;

  return (
    <div className={`w-full sm:w-auto ${adding ? 'sm:flex-1' : 'sm:flex-shrink-0'}`}>
      {!adding ? (
        <Button
          onClick={start}
          className="bg-duech-blue inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-800"
        >
          <PlusIcon className="h-4 w-4" /> Añadir comentario
        </Button>
      ) : (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4 shadow-inner">
          <p className="text-xs font-medium text-blue-900">Escribe un comentario editorial.</p>
          <EditableInput
            value=""
            onChange={handleAdd}
            onBlur={cancel}
            placeholder="Escribe tu comentario y presiona Enter…"
            autoFocus
            className="mt-3 w-full bg-white shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
