/**
 * Word definition section component.
 *
 * Renders a single word meaning with all its metadata, markers,
 * examples, and inline editing capabilities. This is one of the core
 * components of the dictionary application, responsible for displaying
 * and editing individual word definitions.
 *
 * In view mode, it displays:
 * - Definition number in a circular badge
 * - Origin of the word (if available)
 * - Grammar category and meaning markers as chips
 * - The main meaning text with markdown support
 * - Observations, examples, and variants
 *
 * In editor mode, it additionally provides:
 * - Inline editing with pencil icons for all text fields
 * - Dropdown selectors for origin, categories, and markers
 * - Add/remove buttons for chips
 * - Floating action buttons for adding/deleting definitions
 *
 * @module components/word/word-definition
 * @see {@link DefinitionSection} - The main exported component
 * @see {@link DefinitionSectionProps} - Props interface
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import InlineEditable from '@/components/word/inline-editable';
import { Chip, type MarkerColorVariant } from '@/components/common/chip';
import { Button } from '@/components/common/button';
import { Dropdown } from '@/components/common/dropdown';
import { PlusIcon, TrashIcon } from '@/components/icons';
import {
  GRAMMATICAL_CATEGORIES,
  MEANING_MARKER_GROUPS,
  MEANING_MARKER_KEYS,
  ORIGINS,
  DICTIONARY_COLORS,
  type Example,
  type Meaning,
  type MeaningMarkerKey,
} from '@/lib/definitions';

/**
 * Internal representation of a chip item for category or marker display.
 *
 * Used to normalize grammar categories and meaning markers into a unified
 * format for rendering as chips in the definition UI.
 *
 * @internal
 * @interface ChipItem
 */
interface ChipItem {
  /**
   * The type of chip - either 'category' for grammar category or a specific marker key.
   * @type {'category' | MeaningMarkerKey}
   */
  type: 'category' | MeaningMarkerKey;

  /**
   * The code/value stored in the database for this chip.
   * @type {string}
   */
  code: string;

  /**
   * Human-readable label to display on the chip.
   * @type {string}
   */
  label: string;

  /**
   * Color variant for styling the chip based on its type.
   * @type {MarkerColorVariant}
   */
  variant: MarkerColorVariant;
}

/**
 * Props for the DefinitionSection component.
 *
 * @interface DefinitionSectionProps
 */
export interface DefinitionSectionProps {
  /**
   * The meaning/definition data object to render.
   * Contains all fields: number, origin, grammarCategory, meaning, examples, etc.
   * @type {Meaning}
   */
  definition: Meaning;

  /**
   * Zero-based index of this definition within the word's values array.
   * Used to generate unique editing keys and for callbacks.
   * @type {number}
   */
  defIndex: number;

  /**
   * Whether the component is in editor mode.
   * When true, shows inline edit buttons and allows modifications.
   * @type {boolean}
   */
  editorMode: boolean;

  /**
   * The currently active editing key, or null if nothing is being edited.
   * Format: "def:{defIndex}:{fieldName}" (e.g., "def:0:meaning").
   * @type {string | null}
   */
  editingKey: string | null;

  /**
   * Callback to toggle editing state for a specific field.
   * @param {string} key - The unique key identifying the field to toggle
   * @returns {void}
   */
  onToggleEdit: (key: string) => void;

  /**
   * Callback to apply partial updates to the definition.
   * Merges the patch with existing definition data.
   * @param {Partial<Meaning>} patch - Object containing fields to update
   * @returns {void}
   */
  onPatchDefinition: (patch: Partial<Meaning>) => void;

  /**
   * Callback to open the grammar category selector modal.
   * @returns {void}
   */
  onSetEditingCategories: () => void;

  /**
   * Callback to open a marker selector modal for a specific marker type.
   * @param {MeaningMarkerKey} markerKey - The type of marker to edit (e.g., 'diatopic', 'diaphasic')
   * @returns {void}
   */
  onSetEditingMarker: (markerKey: MeaningMarkerKey) => void;

  /**
   * Callback to add a new definition after this one.
   * @returns {void}
   */
  onAddDefinition: () => void;

  /**
   * Callback to delete this definition.
   * @returns {void}
   */
  onDeleteDefinition: () => void;

  /**
   * Render function for displaying examples.
   * Allows parent component to control example rendering and editing.
   * @param {Example[] | null} examples - Array of examples or null
   * @param {number} [defIndex] - Definition index for editing callbacks
   * @param {boolean} [isEditable] - Whether examples should be editable
   * @returns {React.ReactNode} Rendered example content
   */
  renderExample: (
    examples: Example[] | null,
    defIndex?: number,
    isEditable?: boolean
  ) => React.ReactNode;
}

/**
 * Renders a single word definition with all its fields.
 *
 * This component is the main building block for displaying dictionary entries.
 * It handles both the public-facing read-only view and the editor's interactive
 * editing interface. The component uses a card-based layout with a numbered
 * badge and organized sections for each field type.
 *
 * ## Layout Structure
 * - Left side: Circular badge showing definition number
 * - Right side: Stacked content areas for origin, chips, meaning, etc.
 *
 * ## Editor Mode Features
 * - Dropdown for origin selection with search
 * - Chips with remove buttons for categories/markers
 * - Add buttons for missing categories/markers
 * - InlineEditable components for text fields
 * - Floating add/delete buttons at bottom
 *
 * @function DefinitionSection
 * @param {DefinitionSectionProps} props - Component props
 * @param {Meaning} props.definition - The meaning/definition data to render
 * @param {number} props.defIndex - Index of this definition (0-based)
 * @param {boolean} props.editorMode - Whether to enable editing features
 * @param {string | null} props.editingKey - Currently active editing field key
 * @param {Function} props.onToggleEdit - Callback to toggle field editing
 * @param {Function} props.onPatchDefinition - Callback to update definition fields
 * @param {Function} props.onSetEditingCategories - Callback to open category modal
 * @param {Function} props.onSetEditingMarker - Callback to open marker modal
 * @param {Function} props.onAddDefinition - Callback to add new definition
 * @param {Function} props.onDeleteDefinition - Callback to delete this definition
 * @param {Function} props.renderExample - Render function for examples section
 * @returns {JSX.Element} The rendered definition section
 *
 * @example
 * // Basic usage in view mode
 * <DefinitionSection
 *   definition={meaning}
 *   defIndex={0}
 *   editorMode={false}
 *   editingKey={null}
 *   onToggleEdit={() => {}}
 *   onPatchDefinition={() => {}}
 *   onSetEditingCategories={() => {}}
 *   onSetEditingMarker={() => {}}
 *   onAddDefinition={() => {}}
 *   onDeleteDefinition={() => {}}
 *   renderExample={(examples) => <ExampleDisplay example={examples} />}
 * />
 *
 * @example
 * // Full editor mode with all callbacks
 * <DefinitionSection
 *   definition={meaning}
 *   defIndex={0}
 *   editorMode={true}
 *   editingKey={editingKey}
 *   onToggleEdit={toggle}
 *   onPatchDefinition={(patch) => updateDefinition(defIndex, patch)}
 *   onSetEditingCategories={() => setCategoryModalOpen(true)}
 *   onSetEditingMarker={(key) => setMarkerModal({ defIndex, markerKey: key })}
 *   onAddDefinition={() => addDefinitionAfter(defIndex)}
 *   onDeleteDefinition={() => removeDefinition(defIndex)}
 *   renderExample={renderExampleWithEditor}
 * />
 */
export function DefinitionSection({
  definition: def,
  defIndex,
  editorMode,
  editingKey,
  onToggleEdit,
  onPatchDefinition,
  onSetEditingCategories,
  onSetEditingMarker,
  onAddDefinition,
  onDeleteDefinition,
  renderExample,
}: DefinitionSectionProps) {
  const pathname = usePathname();
  /** @internal Base path for editor routes, empty string for public routes */
  const editorBasePath = pathname.startsWith('/editor') ? '/editor' : '';

  /**
   * Checks if a specific field is currently being edited.
   * @internal
   * @param {string} k - The editing key to check
   * @returns {boolean} True if the field is being edited
   */
  const isEditing = (k: string): boolean => editingKey === k;

  /** @internal Dictionary identifier from the definition */
  const dictionary = def.dictionary;
  /** @internal Background color class based on dictionary source */
  const cardBgColor = dictionary ? DICTIONARY_COLORS[dictionary] || 'bg-amber-50' : 'bg-white';

  /**
   * Memoized array of all chips to display (grammar category + all markers).
   *
   * Combines the grammar category (if present) with all meaning markers
   * into a single unified list for rendering. Each chip includes its type,
   * database code, display label, and color variant.
   *
   * @internal
   * @type {ChipItem[]}
   */
  const allChips = useMemo((): ChipItem[] => {
    const chips: ChipItem[] = [];

    // Add grammar category
    if (def.grammarCategory) {
      chips.push({
        type: 'category',
        code: def.grammarCategory,
        label: GRAMMATICAL_CATEGORIES[def.grammarCategory] || def.grammarCategory,
        variant: 'category',
      });
    }

    // Add all markers
    for (const markerKey of MEANING_MARKER_KEYS) {
      const value = def[markerKey] as string | null | undefined;
      if (value) {
        const markerGroup = MEANING_MARKER_GROUPS[markerKey];
        chips.push({
          type: markerKey,
          code: value,
          label: markerGroup.labels[value] || value,
          variant: markerKey as MarkerColorVariant,
        });
      }
    }

    return chips;
  }, [def]);

  /**
   * Handles removal of a chip (category or marker) from the definition.
   *
   * When a chip's remove button is clicked, this function determines
   * whether it's a grammar category or a meaning marker and calls
   * onPatchDefinition with the appropriate null value.
   *
   * @internal
   * @param {ChipItem} chip - The chip being removed
   * @returns {void}
   */
  const handleRemoveChip = (chip: ChipItem): void => {
    if (chip.type === 'category') {
      onPatchDefinition({ grammarCategory: null });
    } else {
      onPatchDefinition({ [chip.type]: null } as Partial<Meaning>);
    }
  };

  return (
    <section
      className={`definition-hover relative rounded-2xl border-2 ${editorMode ? 'border-blue-300/70' : 'border-gray-200'} ${cardBgColor} p-6 ${editorMode ? 'pb-16' : ''} shadow-sm`}
    >
      {/* Layout: number on left, content on right */}
      <div className="flex gap-4">
        {/* Definition number */}
        <div className="flex-shrink-0">
          <span className="bg-duech-blue inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white">
            {def.number}
          </span>
        </div>

        {/* Content wrapper */}
        <div className="flex-1">
          {/* Origin */}
          <div className="mb-2">
            {editorMode ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Origen:</span>
                <div className="w-48">
                  <Dropdown
                    label=""
                    options={[
                      { value: '', label: 'Sin origen' },
                      ...Object.entries(ORIGINS).map(([key, label]) => ({
                        value: key,
                        label: label,
                      })),
                    ]}
                    value={def.origin ?? ''}
                    onChange={(value: string) => onPatchDefinition({ origin: value || null })}
                    placeholder="Seleccionar origen"
                    searchable={true}
                  />
                </div>
              </div>
            ) : (
              def.origin && (
                <span className="text-sm text-gray-600">
                  <span className="font-medium">Origen:</span> {ORIGINS[def.origin] || def.origin}
                </span>
              )
            )}
          </div>
          {/* Categories and Markers - unified chip display */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {allChips.map((chip, index) => (
                <Chip
                  key={`${chip.type}-${chip.code}-${index}`}
                  code={chip.code}
                  label={chip.label}
                  variant={chip.variant}
                  editorMode={editorMode}
                  onRemove={editorMode ? () => handleRemoveChip(chip) : undefined}
                />
              ))}
              {editorMode && (
                <>
                  {!def.grammarCategory && (
                    <Button
                      onClick={onSetEditingCategories}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-blue-400 bg-white px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Categoría
                    </Button>
                  )}
                  {MEANING_MARKER_KEYS.map((markerKey) => {
                    const value = def[markerKey] as string | null | undefined;
                    if (value) return null; // Already has a value
                    const markerGroup = MEANING_MARKER_GROUPS[markerKey];
                    return (
                      <Button
                        key={markerKey}
                        onClick={() => onSetEditingMarker(markerKey)}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-gray-300 bg-white px-3 py-1 text-xs text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                        title={markerGroup.addLabel}
                      >
                        <PlusIcon className="h-4 w-4" />
                        {markerGroup.label}
                      </Button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
          {/* Remission */}
          <div className="mb-2 flex items-center gap-2">
            <InlineEditable
              value={def.remission ?? null}
              onChange={(v) => onPatchDefinition({ remission: v })}
              editorMode={editorMode}
              editing={isEditing(`def:${defIndex}:remission`)}
              onStart={() => onToggleEdit(`def:${defIndex}:remission`)}
              onCancel={() => onToggleEdit(`def:${defIndex}:remission`)}
              saveStrategy="manual"
              placeholder="Artículo de remisión"
              addLabel="+ Añadir remisión"
              renderDisplay={(value: string) => (
                <p className="text-lg text-gray-800">
                  Ver:{' '}
                  <Link
                    href={
                      editorMode && editorBasePath
                        ? `${editorBasePath}/palabra/${encodeURIComponent(value)}`
                        : `/palabra/${encodeURIComponent(value)}`
                    }
                    className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                  >
                    {value}
                  </Link>
                </p>
              )}
            />
          </div>
          {/* Meaning */}
          <div className="mb-4">
            <InlineEditable
              as="textarea"
              value={def.meaning}
              onChange={(v) => onPatchDefinition({ meaning: v ?? '' })}
              editorMode={editorMode}
              editing={isEditing(`def:${defIndex}:meaning`)}
              onStart={() => onToggleEdit(`def:${defIndex}:meaning`)}
              onCancel={() => onToggleEdit(`def:${defIndex}:meaning`)}
              saveStrategy="manual"
              placeholder="Significado de la definición"
              renderDisplay={(value: string) => (
                <div className="text-xl leading-relaxed text-gray-900">
                  <MarkdownRenderer content={value} />
                </div>
              )}
            />
          </div>
          {/* Observation */}
          {(def.observation || editorMode) && (
            <div className="mb-3">
              <InlineEditable
                value={def.observation ?? null}
                onChange={(v) => onPatchDefinition({ observation: v })}
                editorMode={editorMode}
                editing={isEditing(`def:${defIndex}:observation`)}
                onStart={() => onToggleEdit(`def:${defIndex}:observation`)}
                onCancel={() => onToggleEdit(`def:${defIndex}:observation`)}
                saveStrategy="manual"
                placeholder="Observación sobre la definición"
                addLabel="+ Añadir observación"
                as="textarea"
                renderDisplay={(value: string) => (
                  <p className="flex-1 text-sm text-blue-900">
                    <span className="font-medium">Observación:</span> {value}
                  </p>
                )}
                renderWrapper={(children: React.ReactNode) => (
                  <div className="rounded-lg bg-blue-50 p-3">{children}</div>
                )}
              />
            </div>
          )}
          {/* Examples */}
          {((def.examples && def.examples.length > 0) || editorMode) && (
            <div className="mt-4">
              {def.examples && def.examples.length > 0 && (
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Ejemplo{def.examples.length > 1 ? 's' : ''}:
                  </h3>
                </div>
              )}
              <div className="space-y-8">
                {renderExample(def.examples ?? null, defIndex, editorMode)}
              </div>
            </div>
          )}
          {/* Variant */}
          {(def.variant || editorMode) && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-900">Variante: </span>
              <InlineEditable
                value={def.variant ?? null}
                onChange={(v) => onPatchDefinition({ variant: v })}
                editorMode={editorMode}
                editing={isEditing(`def:${defIndex}:variant`)}
                onStart={() => onToggleEdit(`def:${defIndex}:variant`)}
                onCancel={() => onToggleEdit(`def:${defIndex}:variant`)}
                saveStrategy="manual"
                placeholder="Variante de la palabra"
                addLabel="+ Añadir variante"
                renderDisplay={(value: string) => <span className="font-bold">{value}</span>}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Delete definition buttons (editor mode) */}
      {editorMode && (
        <div className="definition-buttons absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-4 opacity-0 transition-opacity duration-200">
          <Button
            onClick={onAddDefinition}
            aria-label="Agregar definición"
            title="Agregar definición"
            className="inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            <PlusIcon className="h-7 w-7" />
          </Button>

          <Button
            onClick={onDeleteDefinition}
            aria-label="Eliminar definición"
            title="Eliminar definición"
            className="inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
          >
            <TrashIcon className="h-7 w-7" />
          </Button>
        </div>
      )}
    </section>
  );
}
