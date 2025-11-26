/**
 * Example display component for word definitions.
 *
 * Renders usage examples with metadata (author, title, source, date, page).
 * Supports editing actions in editor mode.
 *
 * @module components/word/word-example
 */

'use client';

import React from 'react';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import { Button } from '@/components/common/button';
import { PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { type Example } from '@/lib/definitions';

/**
 * Props for the ExampleDisplay component.
 */
export interface ExampleDisplayProps {
  /** Example or array of examples to display */
  example: Example | Example[];
  /** Definition index for editing callbacks */
  defIndex?: number;
  /** Enable edit/add/delete buttons */
  editorMode?: boolean;
  /** Callback when edit button clicked */
  onEdit?: (exIndex: number) => void;
  /** Callback when add button clicked */
  onAdd?: () => void;
  /** Callback when delete button clicked */
  onDelete?: (exIndex: number) => void;
}

/**
 * Displays word usage examples with optional editing.
 *
 * Renders example text with markdown support and shows metadata.
 * In editor mode, provides edit, add, and delete buttons.
 *
 * @example
 * ```tsx
 * <ExampleDisplay
 *   example={[{ value: "Example sentence", author: "Author" }]}
 *   defIndex={0}
 *   editorMode={true}
 *   onEdit={(idx) => openEditor(idx)}
 *   onAdd={addExample}
 *   onDelete={(idx) => deleteExample(idx)}
 * />
 * ```
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
            {ex.author && <span className="mr-3">Autor: {ex.author}</span>}
            {ex.title && <span className="mr-3">Título: {ex.title}</span>}
            {ex.source && <span className="mr-3">Fuente: {ex.source}</span>}
            {ex.date && <span className="mr-3">Fecha: {ex.date}</span>}
            {ex.page && <span>Página: {ex.page}</span>}
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
