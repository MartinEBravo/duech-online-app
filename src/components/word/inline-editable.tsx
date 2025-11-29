/**
 * Inline editable field component.
 *
 * This component provides a seamless inline editing experience for text fields.
 * It displays a value with an edit button, and when clicked, transforms into
 * an editable input field. The component supports both controlled and
 * uncontrolled editing modes.
 *
 * ## Key Features
 *
 * ### Display Modes
 * - **View Mode (editorMode=false)**: Shows only the value, no edit capability
 * - **Edit Mode (editorMode=true)**: Shows value with pencil button, or "add" link if empty
 * - **Editing State**: Shows input/textarea for direct text entry
 *
 * ### Save Strategies
 * - **manual**: Calls onChange() with value, parent handles persistence
 * - **immediate**: Calls onSave() which can be async, typically for direct API calls
 *
 * ### Control Modes
 * - **Controlled**: Parent manages editing state via `editing` prop
 * - **Uncontrolled**: Component manages its own editing state internally
 *
 * ## Custom Rendering
 * - `renderDisplay`: Custom renderer for the displayed value
 * - `renderWrapper`: Wrapper around the content for styling
 *
 * @module components/word/inline-editable
 * @see {@link InlineEditable} - The main exported component (default export)
 * @see {@link InlineEditableProps} - Props type
 * @see {@link EditableInput} - The input component used during editing
 */

'use client';

import React, { useState, ReactNode } from 'react';
import { Button } from '@/components/common/button';
import { PencilIcon } from '@/components/icons';
import EditableInput from '@/components/word/editable-input';

/**
 * Props for the InlineEditable component.
 *
 * @typedef InlineEditableProps
 */
export type InlineEditableProps = {
  /**
   * The current value to display/edit.
   * When null, shows the add button in editor mode.
   * @type {string | null}
   */
  value: string | null;

  /**
   * Async save handler for immediate save strategy.
   * Called when the user commits their edit.
   * @param {string | null} v - The new value (null if empty after trim)
   * @returns {Promise<void> | void}
   */
  onSave?: (v: string | null) => Promise<void> | void;

  /**
   * Change handler for manual save strategy.
   * Called when the user commits their edit, parent persists later.
   * @param {string | null} v - The new value (null if empty after trim)
   * @returns {void}
   */
  onChange?: (v: string | null) => void;

  /**
   * Placeholder text shown in the input and used for labels.
   * @type {string}
   * @default '—'
   */
  placeholder?: string;

  /**
   * Additional CSS classes for the input element.
   * @type {string}
   */
  className?: string;

  /**
   * Controlled editing state from parent.
   * When provided, component becomes controlled.
   * @type {boolean}
   */
  editing?: boolean;

  /**
   * Callback when editing is cancelled or completed.
   * Called after commit in controlled mode.
   * @returns {void}
   */
  onCancel?: () => void;

  /**
   * Callback when edit button is clicked.
   * Used in controlled mode to notify parent.
   * @returns {void}
   */
  onStart?: () => void;

  /**
   * How to handle saving the value.
   * - 'manual': Call onChange, parent handles persistence
   * - 'immediate': Call onSave directly (can be async)
   * @type {'manual' | 'immediate'}
   * @default 'manual'
   */
  saveStrategy?: 'manual' | 'immediate';

  /**
   * Whether editing UI elements should be shown.
   * When false, only displays the value without edit capability.
   * @type {boolean}
   */
  editorMode?: boolean;

  /**
   * Custom label for the add button when value is empty.
   * Defaults to "+ {placeholder}".
   * @type {string}
   */
  addLabel?: string;

  /**
   * Custom render function for displaying the value.
   * Allows custom formatting like links, markdown, etc.
   * @param {string} value - The non-empty value to render
   * @returns {ReactNode} Custom rendered content
   */
  renderDisplay?: (value: string) => ReactNode;

  /**
   * Wrapper function for the displayed content.
   * Useful for adding container styling or background.
   * @param {ReactNode} children - The content to wrap
   * @returns {ReactNode} Wrapped content
   */
  renderWrapper?: (children: ReactNode) => ReactNode;

  /**
   * Type of input element to use.
   * 'textarea' is better for multi-line content.
   * @type {'input' | 'textarea'}
   * @default 'input'
   */
  as?: 'input' | 'textarea';

  /**
   * Number of rows for textarea (only applies when as='textarea').
   * @type {number}
   */
  rows?: number;
};

/**
 * Editable field that toggles between display and edit modes.
 *
 * This is a versatile component used throughout the word editor for
 * inline text editing. It handles the complexity of switching between
 * display and input modes while supporting both controlled and
 * uncontrolled patterns.
 *
 * ## Component States
 *
 * ### Non-Editor Mode (editorMode=false)
 * - If value exists: renders display or custom renderDisplay
 * - If value is empty: returns null (hides completely)
 *
 * ### Editor Mode - Not Editing
 * - If value exists: shows value + pencil button
 * - If value is empty: shows "add" link
 *
 * ### Editor Mode - Editing
 * - Shows EditableInput component with auto-focus
 * - On commit: trims value, calls save handler, exits edit mode
 *
 * @function InlineEditable
 * @param {InlineEditableProps} props - Component props
 * @param {string | null} props.value - Current value to display/edit
 * @param {Function} [props.onSave] - Async save handler (immediate strategy)
 * @param {Function} [props.onChange] - Change handler (manual strategy)
 * @param {string} [props.placeholder='—'] - Placeholder text
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.editing] - Controlled editing state
 * @param {Function} [props.onCancel] - Cancel/complete callback
 * @param {Function} [props.onStart] - Edit start callback
 * @param {'manual' | 'immediate'} [props.saveStrategy='manual'] - Save behavior
 * @param {boolean} [props.editorMode] - Enable editing UI
 * @param {string} [props.addLabel] - Custom add button label
 * @param {Function} [props.renderDisplay] - Custom value renderer
 * @param {Function} [props.renderWrapper] - Content wrapper function
 * @param {'input' | 'textarea'} [props.as='input'] - Input element type
 * @param {number} [props.rows] - Textarea rows (when as='textarea')
 * @returns {JSX.Element | null} Rendered component or null
 *
 * @example
 * // Simple controlled usage
 * <InlineEditable
 *   value={title}
 *   onChange={setTitle}
 *   editorMode={true}
 *   editing={editingTitle}
 *   onStart={() => setEditingTitle(true)}
 *   onCancel={() => setEditingTitle(false)}
 *   placeholder="Enter title"
 *   saveStrategy="manual"
 * />
 *
 * @example
 * // With custom display rendering
 * <InlineEditable
 *   value={remission}
 *   onChange={setRemission}
 *   editorMode={true}
 *   editing={isEditing}
 *   onStart={startEdit}
 *   onCancel={cancelEdit}
 *   renderDisplay={(value) => (
 *     <Link href={`/palabra/${value}`}>{value}</Link>
 *   )}
 * />
 *
 * @example
 * // Multiline textarea with wrapper
 * <InlineEditable
 *   as="textarea"
 *   rows={3}
 *   value={observation}
 *   onChange={setObservation}
 *   editorMode={canEdit}
 *   editing={isEditing}
 *   onStart={startEdit}
 *   onCancel={cancelEdit}
 *   renderWrapper={(children) => (
 *     <div className="bg-blue-50 p-3 rounded">{children}</div>
 *   )}
 * />
 */
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
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 opacity-80 shadow-sm transition group-hover:opacity-100 hover:bg-blue-100 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
