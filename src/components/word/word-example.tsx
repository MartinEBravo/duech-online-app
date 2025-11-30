/**
 * Example display component for word definitions.
 *
 * This component renders usage examples that demonstrate how a word is used
 * in context. Each example includes the example text (with markdown support)
 * and bibliographic metadata such as author, year, title, publication, etc.
 *
 * ## Display Structure
 *
 * ### Public View
 * - Example text with markdown formatting
 * - Visible metadata: author, year, title, publication (linked), date
 *
 * ### Editor View
 * - All public fields plus internal metadata section
 * - Internal fields: format, city, editorial, volume, number, page, DOI, URL
 * - Edit/Add/Delete action buttons with hover reveal
 *
 * ## Styling
 * - Left border accent (blue-400 in view, blue-600 in editor)
 * - Gray background for contrast
 * - Additional padding in editor mode for action buttons
 *
 * @module components/word/word-example
 * @see {@link ExampleDisplay} - The main exported component
 * @see {@link ExampleDisplayProps} - Props interface
 * @see {@link Example} - Example data type from definitions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import { Button } from '@/components/common/button';
import { PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { type Example } from '@/lib/definitions';

/**
 * Props for the ExampleDisplay component.
 *
 * @interface ExampleDisplayProps
 */
export interface ExampleDisplayProps {
  /**
   * Example or array of examples to display.
   * Accepts both single example and array for flexibility.
   * @type {Example | Example[]}
   */
  example: Example | Example[];

  /**
   * Zero-based index of the parent definition.
   * Required for editing callbacks to identify which definition
   * the examples belong to.
   * @type {number}
   */
  defIndex?: number;

  /**
   * Whether to enable editor mode with action buttons.
   * When true, shows edit/add/delete buttons on hover.
   * @type {boolean}
   * @default false
   */
  editorMode?: boolean;

  /**
   * Callback fired when the edit button is clicked.
   * Opens the example editor modal for the specified example.
   * @param {number} exIndex - Zero-based index of the example to edit
   * @returns {void}
   */
  onEdit?: (exIndex: number) => void;

  /**
   * Callback fired when the add button is clicked.
   * Creates a new empty example and opens the editor.
   * @returns {void}
   */
  onAdd?: () => void;

  /**
   * Callback fired when the delete button is clicked.
   * Removes the example at the specified index.
   * @param {number} exIndex - Zero-based index of the example to delete
   * @returns {void}
   */
  onDelete?: (exIndex: number) => void;
}

/**
 * Displays word usage examples with optional editing.
 *
 * Renders example text with markdown support and shows bibliographic
 * metadata. Each example is displayed in a card with a left border accent.
 * In editor mode, hovering reveals floating action buttons for editing,
 * adding, and deleting examples.
 *
 * ## Metadata Display
 *
 * ### Visible to All Users
 * - **Author**: Name of the author/source
 * - **Year**: Publication year
 * - **Title**: Title of the work (in quotes)
 * - **Publication**: Source publication (linked to source page)
 * - **Date**: Specific date if available
 *
 * ### Internal (Editor Only)
 * - Format, City, Editorial, Volume, Number, Page, DOI, URL
 * - Displayed in a separate section with yellow header
 *
 * @function ExampleDisplay
 * @param {ExampleDisplayProps} props - Component props
 * @param {Example | Example[]} props.example - Example(s) to display
 * @param {number} [props.defIndex] - Parent definition index
 * @param {boolean} [props.editorMode=false] - Enable editing features
 * @param {Function} [props.onEdit] - Edit button callback
 * @param {Function} [props.onAdd] - Add button callback
 * @param {Function} [props.onDelete] - Delete button callback
 * @returns {JSX.Element} Rendered example card(s)
 *
 * @example
 * // Single example in view mode
 * <ExampleDisplay
 *   example={{ value: "Ejemplo de uso", author: "García" }}
 * />
 *
 * @example
 * // Multiple examples with editing
 * <ExampleDisplay
 *   example={[
 *     { value: "First example", author: "Author 1", year: "2020" },
 *     { value: "Second example", author: "Author 2", year: "2021" }
 *   ]}
 *   defIndex={0}
 *   editorMode={true}
 *   onEdit={(idx) => openEditor(idx)}
 *   onAdd={() => addNewExample()}
 *   onDelete={(idx) => confirmDelete(idx)}
 * />
 */
export function ExampleDisplay({
  example,
  defIndex,
  editorMode = false,
  onEdit,
  onAdd,
  onDelete,
}: ExampleDisplayProps) {
  const examples = Array.isArray(example) ? example : [example];
  const isEditable = editorMode && defIndex !== undefined;

  return (
    <>
      {examples.map((ex, exIndex) => (
        <div
          key={exIndex}
          className={`example-hover relative rounded-lg border-l-4 ${editorMode ? 'border-blue-600' : 'border-blue-400'} bg-gray-50 p-4 ${editorMode ? 'pb-12' : ''}`}
        >
          <div className="mb-2 text-gray-700">
            <MarkdownRenderer content={ex.value} />
          </div>
          <div className="text-sm text-gray-600">
            {/* Green fields (Visible to public) */}
            {ex.author && <span className="mr-3 font-medium">Autor: {ex.author}</span>}
            {ex.year && <span className="mr-3">Año: {ex.year}</span>}
            {ex.title && <span className="mr-3">Título: &ldquo;{ex.title}&rdquo;</span>}
            {(ex.publication || ex.source) && (
              <span className="mr-3 italic">
                Publicación:{' '}
                {ex.publication ? (
                  <Link
                    href={`/fuente/${encodeURIComponent(ex.publication)}`}
                    className="text-duech-blue hover:text-duech-gold underline transition-colors"
                  >
                    {ex.publication}
                  </Link>
                ) : (
                  ex.source
                )}
              </span>
            )}
            {ex.date && <span className="mr-3">Fecha: {ex.date}</span>}
            {editorMode && (
              <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
                <span className="font-semibold text-yellow-700">Datos internos:</span>
                {ex.format && <span className="ml-2">Formato: {ex.format}</span>}
                {ex.city && <span className="ml-2">Ciudad: {ex.city}</span>}
                {ex.editorial && <span className="ml-2">Editorial: {ex.editorial}</span>}
                {ex.volume && <span className="ml-2">Vol: {ex.volume}</span>}
                {ex.number && <span className="ml-2">Núm: {ex.number}</span>}
                {ex.page && <span className="ml-2">Páginas: {ex.page}</span>}
                {ex.doi && <span className="ml-2">DOI: {ex.doi}</span>}
                {ex.url && (
                  <span className="ml-2">
                    URL:{' '}
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Link
                    </a>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Example action buttons (editor mode) */}
          {isEditable && (
            <div className="example-buttons absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 transition-opacity duration-200">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => onEdit?.(exIndex)}
                  aria-label="Editar ejemplo"
                  title="Editar ejemplo"
                  className="inline-flex size-12 items-center justify-center rounded-full border-2 border-dashed border-green-400 bg-white text-green-600 shadow hover:bg-green-50 focus:ring-2 focus:ring-green-300 focus:outline-none"
                >
                  <PencilIcon className="h-5 w-5" />
                </Button>

                <Button
                  onClick={onAdd}
                  aria-label="Agregar ejemplo"
                  title="Agregar ejemplo"
                  className="inline-flex size-12 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                >
                  <PlusIcon className="h-5 w-5" />
                </Button>

                <Button
                  onClick={() => onDelete?.(exIndex)}
                  aria-label="Eliminar ejemplo"
                  title="Eliminar ejemplo"
                  className="inline-flex size-12 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
