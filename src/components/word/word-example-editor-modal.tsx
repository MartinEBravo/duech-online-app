/**
 * Example editor modal component.
 *
 * This component provides a comprehensive form for creating or editing
 * word usage examples with full bibliographic metadata. It's designed
 * to capture all necessary information for academic dictionary entries.
 *
 * ## Form Structure
 *
 * ### Required Fields (Green Section)
 * - **Example text**: The actual usage example (textarea)
 * - **Author**: Name(s) of the author(s)
 * - **Year**: Publication year
 * - **Publication**: Source publication name
 * - **Format**: Publication format type
 *
 * ### Optional Fields (Yellow Section)
 * - **Title**: Article or chapter title
 * - **Date**: Specific date (dd/mm/yyyy)
 * - **City**: Publication city
 * - **Editorial**: Publisher name
 * - **Volume**: Volume number
 * - **Number**: Issue number
 * - **Page**: Page reference
 * - **DOI**: Digital Object Identifier
 * - **URL**: Web address
 *
 * ## Special Features
 * - Auto-fill from existing sources (Nómina dropdown)
 * - Color-coded sections for field importance
 * - Responsive two-column grid layout
 *
 * @module components/word/word-example-editor-modal
 * @see {@link ExampleEditorModal} - The main exported component
 * @see {@link ExampleDraft} - Draft state type
 * @see {@link ExampleEditorModalProps} - Props interface
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/common/button';
import { Dropdown } from '@/components/common/dropdown';
import { fetchUniqueSources } from '@/lib/actions';

/**
 * Internal helper component for form input fields.
 *
 * Renders a labeled text input with consistent styling.
 *
 * @internal
 * @param {Object} props - Component props
 * @param {string} props.label - Label text displayed above input
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @returns {JSX.Element} Labeled input field
 */
function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border p-2"
        placeholder={placeholder}
      />
    </div>
  );
}

/**
 * Draft state for an example being edited.
 *
 * Contains all fields for a word usage example, both required
 * and optional. All fields are strings to simplify form handling.
 *
 * @typedef ExampleDraft
 */
type ExampleDraft = {
  /**
   * The example text content showing word usage.
   * @type {string}
   */
  value: string;

  // Required bibliographic fields
  /**
   * Name(s) of the author(s).
   * @type {string}
   */
  author: string;

  /**
   * Publication year.
   * @type {string}
   */
  year: string;

  /**
   * Source publication name (journal, book, website).
   * @type {string}
   */
  publication: string;

  /**
   * Publication format type.
   * @type {string}
   */
  format: string;

  // Optional bibliographic fields
  /**
   * Article or chapter title.
   * @type {string}
   */
  title: string;

  /**
   * Specific date in dd/mm/yyyy format.
   * @type {string}
   */
  date: string;

  /**
   * Publication city.
   * @type {string}
   */
  city: string;

  /**
   * Publisher/editorial name.
   * @type {string}
   */
  editorial: string;

  /**
   * Volume number.
   * @type {string}
   */
  volume: string;

  /**
   * Issue number.
   * @type {string}
   */
  number: string;

  /**
   * Page reference.
   * @type {string}
   */
  page: string;

  /**
   * Digital Object Identifier.
   * @type {string}
   */
  doi: string;

  /**
   * Web URL.
   * @type {string}
   */
  url: string;
};

/**
 * Props for the ExampleEditorModal component.
 *
 * @interface ExampleEditorModalProps
 */
interface ExampleEditorModalProps {
  /**
   * Whether the modal is currently visible.
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Whether this is a new example (vs editing existing).
   * Affects the modal title.
   * @type {boolean}
   */
  isNew: boolean;

  /**
   * Current draft state with all form values.
   * @type {ExampleDraft}
   */
  draft: ExampleDraft;

  /**
   * Callback to update the draft state.
   * Called on any field change with the complete new draft.
   * @param {ExampleDraft} draft - Updated draft state
   * @returns {void}
   */
  onDraftChange: (draft: ExampleDraft) => void;

  /**
   * Callback when the save button is clicked.
   * Parent component handles actual persistence.
   * @returns {void}
   */
  onSave: () => void;

  /**
   * Callback when the cancel button is clicked.
   * Should close the modal without saving.
   * @returns {void}
   */
  onCancel: () => void;
}

/**
 * Modal form for editing word examples.
 *
 * Provides a comprehensive form with all bibliographic fields needed
 * for dictionary examples. Includes a dropdown to auto-fill from
 * existing sources in the database.
 *
 * @function ExampleEditorModal
 * @param {ExampleEditorModalProps} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {boolean} props.isNew - Whether creating new example
 * @param {ExampleDraft} props.draft - Current form state
 * @param {Function} props.onDraftChange - Draft update callback
 * @param {Function} props.onSave - Save button callback
 * @param {Function} props.onCancel - Cancel button callback
 * @returns {JSX.Element | null} Modal element or null when closed
 *
 * @example
 * // Creating a new example
 * <ExampleEditorModal
 *   isOpen={showModal}
 *   isNew={true}
 *   draft={emptyDraft}
 *   onDraftChange={setDraft}
 *   onSave={handleSave}
 *   onCancel={() => setShowModal(false)}
 * />
 *
 * @example
 * // Editing an existing example
 * <ExampleEditorModal
 *   isOpen={showModal}
 *   isNew={false}
 *   draft={existingExampleDraft}
 *   onDraftChange={setDraft}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 * />
 */
export function ExampleEditorModal({
  isOpen,
  isNew,
  draft,
  onDraftChange,
  onSave,
  onCancel,
}: ExampleEditorModalProps) {
  const [sources, setSources] = useState<
    {
      publication: string | null;
      author: string | null;
      year: string | null;
      city: string | null;
      editorial: string | null;
      format: string | null;
    }[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetchUniqueSources().then((res) => {
        if (res.success && res.data) {
          setSources(res.data);
        }
      });
    }
  }, [isOpen]);

  const handleSourceSelect = (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const source = sources[index];
    if (source) {
      onDraftChange({
        ...draft,
        publication: source.publication || '',
        author: source.author || '',
        year: source.year || '',
        city: source.city || '',
        editorial: source.editorial || '',
        format: source.format || '',
      });
    }
  };

  const sourceOptions = sources.map((s, i) => ({
    value: i.toString(),
    label: `${s.publication || 'Sin título'} (${s.year || 's/f'}) - ${s.author || 'Anon'}`,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">{isNew ? 'Nuevo ejemplo' : 'Editar ejemplo'}</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Ejemplo *</label>
            <textarea
              value={draft.value}
              onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
              className="min-h-[100px] w-full rounded border p-2"
              placeholder="Texto del ejemplo"
            />
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <Dropdown
              label="Cargar datos desde Nómina (Opcional)"
              options={sourceOptions}
              value=""
              onChange={handleSourceSelect}
              placeholder="Seleccionar fuente..."
              searchable={true}
            />
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <h3 className="mb-3 font-semibold text-green-800">Datos bibliográficos obligatorios</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Autor(a,es,as)"
                value={draft.author}
                onChange={(value) => onDraftChange({ ...draft, author: value })}
              />
              <FormInput
                label="Año"
                value={draft.year}
                onChange={(value) => onDraftChange({ ...draft, year: value })}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Publicación (revista, periódico, libro, sitio web)"
                  value={draft.publication}
                  onChange={(value) => onDraftChange({ ...draft, publication: value })}
                  placeholder="Siempre en cursiva"
                />
              </div>
              <FormInput
                label="Formato"
                value={draft.format}
                onChange={(value) => onDraftChange({ ...draft, format: value })}
              />
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <h3 className="mb-3 font-semibold text-yellow-800">Datos bibliográficos opcionales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormInput
                  label="Título (capítulo, artículo)"
                  value={draft.title}
                  onChange={(value) => onDraftChange({ ...draft, title: value })}
                  placeholder="Siempre entre comillas dobles"
                />
              </div>
              <FormInput
                label="Fecha (dd/mm/aaaa)"
                value={draft.date}
                onChange={(value) => onDraftChange({ ...draft, date: value })}
              />
              <FormInput
                label="Ciudad"
                value={draft.city}
                onChange={(value) => onDraftChange({ ...draft, city: value })}
              />
              <FormInput
                label="Editorial"
                value={draft.editorial}
                onChange={(value) => onDraftChange({ ...draft, editorial: value })}
              />
              <FormInput
                label="Volumen"
                value={draft.volume}
                onChange={(value) => onDraftChange({ ...draft, volume: value })}
              />
              <FormInput
                label="Número"
                value={draft.number}
                onChange={(value) => onDraftChange({ ...draft, number: value })}
              />
              <FormInput
                label="Páginas"
                value={draft.page}
                onChange={(value) => onDraftChange({ ...draft, page: value })}
              />
              <FormInput
                label="DOI"
                value={draft.doi}
                onChange={(value) => onDraftChange({ ...draft, doi: value })}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="URL"
                  value={draft.url}
                  onChange={(value) => onDraftChange({ ...draft, url: value })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} className="rounded border px-4 py-2 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            className="bg-duech-blue rounded px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ExampleDraft };
