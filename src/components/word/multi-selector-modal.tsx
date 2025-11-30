/**
 * Multi-selector modal component.
 *
 * This component provides a generic modal dialog for selecting one or more
 * items from a predefined list of options. It's used throughout the word
 * editor for selecting grammar categories, meaning markers, and other
 * categorized values.
 *
 * ## Selection Modes
 *
 * ### Single Selection (maxSelections=1)
 * - Displays radio buttons instead of checkboxes
 * - Selecting a new item replaces the previous selection
 * - Common use: grammar category selection
 *
 * ### Multiple Selection (default)
 * - Displays checkboxes for each option
 * - Users can select multiple items up to maxSelections limit
 * - Common use: style markers, tags
 *
 * ## Layout Options
 * - **maxWidth**: 'lg' (max-w-lg) or '2xl' (max-w-2xl)
 * - **columns**: 2 or 3 column grid layout
 *
 * ## Modal Behavior
 * - Closes on backdrop click
 * - Stops propagation on content click
 * - Scrollable content for many options
 *
 * @module components/word/multi-selector-modal
 * @see {@link MultiSelector} - The main exported component
 * @see {@link MultiSelectorProps} - Props interface
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/common/button';

/**
 * Props for the MultiSelector component.
 *
 * @interface MultiSelectorProps
 */
export interface MultiSelectorProps {
  /**
   * Whether the modal is currently visible.
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Callback fired when the modal should close.
   * Triggered by cancel button or backdrop click.
   * @returns {void}
   */
  onClose: () => void;

  /**
   * Callback fired when the save button is clicked.
   * Receives the array of selected item keys.
   * @param {string[]} items - Array of selected option keys
   * @returns {void}
   */
  onSave: (items: string[]) => void;

  /**
   * Currently selected item keys for initial state.
   * Used to initialize the internal selection state.
   * @type {string[]}
   */
  selectedItems: string[];

  /**
   * Title displayed at the top of the modal.
   * @type {string}
   */
  title: string;

  /**
   * Options to display as selectable items.
   * Keys are the values stored, values are the display labels.
   * @type {Record<string, string>}
   */
  options: Record<string, string>;

  /**
   * Maximum width of the modal.
   * @type {'lg' | '2xl'}
   * @default '2xl'
   */
  maxWidth?: 'lg' | '2xl';

  /**
   * Number of columns in the options grid.
   * @type {2 | 3}
   * @default 2
   */
  columns?: 2 | 3;

  /**
   * Maximum number of items that can be selected.
   * When set to 1, switches to single-select mode with radio buttons.
   * @type {number}
   */
  maxSelections?: number;
}

/**
 * Modal for selecting one or multiple items from a list.
 *
 * Displays options in a responsive grid layout with either radio buttons
 * (single-select) or checkboxes (multi-select). The modal includes
 * cancel and save buttons at the bottom.
 *
 * @function MultiSelector
 * @param {MultiSelectorProps} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSave - Save callback with selected items
 * @param {string[]} props.selectedItems - Initially selected items
 * @param {string} props.title - Modal title
 * @param {Record<string, string>} props.options - Available options
 * @param {'lg' | '2xl'} [props.maxWidth='2xl'] - Modal max width
 * @param {2 | 3} [props.columns=2] - Grid columns
 * @param {number} [props.maxSelections] - Max selectable items
 * @returns {JSX.Element | null} Modal element or null when closed
 *
 * @example
 * // Single selection for grammar category
 * <MultiSelector
 *   isOpen={showCategoryModal}
 *   onClose={() => setShowCategoryModal(false)}
 *   onSave={(items) => setCategory(items[0])}
 *   selectedItems={category ? [category] : []}
 *   title="Seleccionar categoría gramatical"
 *   options={GRAMMATICAL_CATEGORIES}
 *   maxWidth="2xl"
 *   columns={3}
 *   maxSelections={1}
 * />
 *
 * @example
 * // Multiple selection for markers
 * <MultiSelector
 *   isOpen={showMarkerModal}
 *   onClose={() => setShowMarkerModal(false)}
 *   onSave={(items) => setMarkers(items)}
 *   selectedItems={markers}
 *   title="Seleccionar marcas"
 *   options={STYLE_MARKERS}
 *   maxWidth="lg"
 *   columns={2}
 * />
 */
export function MultiSelector({
  isOpen,
  onClose,
  onSave,
  selectedItems,
  title,
  options,
  maxWidth = '2xl',
  columns = 2,
  maxSelections,
}: MultiSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedItems);

  if (!isOpen) return null;

  const isSingleSelect = maxSelections === 1;

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else if (isSingleSelect) {
      // Single selection mode: replace the current selection
      setSelected([item]);
    } else if (maxSelections && selected.length >= maxSelections) {
      // Max selections reached, don't add more
      return;
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const maxWidthClass = maxWidth === '2xl' ? 'max-w-2xl' : 'max-w-lg';
  const columnsClass = columns === 3 ? 'md:grid-cols-3' : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`mx-4 max-h-[80vh] w-full ${maxWidthClass} overflow-y-auto rounded-lg bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <div className={`grid grid-cols-2 gap-3 ${columnsClass}`}>
          {Object.entries(options).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type={isSingleSelect ? 'radio' : 'checkbox'}
                name={isSingleSelect ? 'selector-option' : undefined}
                checked={selected.includes(key)}
                onChange={() => toggleItem(key)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
