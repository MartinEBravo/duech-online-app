/**
 * Chip components for displaying tags and markers.
 *
 * This module provides reusable chip/tag components for displaying
 * categorized information throughout the dictionary application.
 * Chips are used for grammar categories, meaning markers, status
 * indicators, and various other labeled elements.
 *
 * ## Components
 *
 * ### Chip
 * Single chip with label and optional remove button.
 * Color-coded by variant for visual categorization.
 *
 * ### ChipList
 * Collection of chips with add button support.
 * Manages empty state and provides consistent layout.
 *
 * ## Color Variants
 * Each variant has carefully chosen colors for visual distinction:
 * - **category**: Blue (primary action color)
 * - **socialValuations**: Rose (social/emotional)
 * - **socialStratumMarkers**: Violet (social class)
 * - **styleMarkers**: Amber (style/register)
 * - **intentionalityMarkers**: Emerald (intent/purpose)
 * - **geographicalMarkers**: Sky (location)
 * - **chronologicalMarkers**: Orange (time)
 * - **frequencyMarkers**: Slate (frequency)
 * - **warning**: Red with border (alerts)
 *
 * @module components/common/chip
 * @see {@link Chip} - Single chip component
 * @see {@link ChipList} - List of chips with add support
 * @see {@link MarkerColorVariant} - Available color variants
 */

'use client';

import React from 'react';
import { Button } from '@/components/common/button';
import { PlusIcon, CloseIcon } from '@/components/icons';

/**
 * Color variants for different marker types.
 *
 * Each variant maps to a specific Tailwind color scheme
 * designed to provide visual distinction between different
 * types of dictionary markers.
 *
 * @typedef MarkerColorVariant
 */
export type MarkerColorVariant =
  | 'category'
  | 'socialValuations'
  | 'socialStratumMarkers'
  | 'styleMarkers'
  | 'intentionalityMarkers'
  | 'geographicalMarkers'
  | 'chronologicalMarkers'
  | 'frequencyMarkers'
  | 'warning';

/**
 * Props for the Chip component.
 *
 * @interface ChipProps
 */
export interface ChipProps {
  /**
   * Unique code/value for the chip.
   * Used for identification in callbacks.
   * @type {string}
   */
  code: string;

  /**
   * Human-readable display label.
   * @type {string}
   */
  label: string;

  /**
   * Callback when remove button is clicked.
   * Only shown when editorMode is true.
   * @param {string} code - The chip's code
   * @returns {void}
   */
  onRemove?: (code: string) => void;

  /**
   * Additional CSS classes for the chip.
   * @type {string}
   */
  className?: string;

  /**
   * Color variant based on marker type.
   * @type {MarkerColorVariant}
   * @default 'category'
   */
  variant?: MarkerColorVariant;

  /**
   * Enable interactive/editing mode.
   * When true, shows remove button on hover.
   * @type {boolean}
   * @default false
   */
  editorMode?: boolean;
}

const VARIANT_STYLES: Record<
  MarkerColorVariant,
  { chip: string; chipReadOnly: string; removeBtn: string }
> = {
  category: {
    chip: 'bg-duech-blue text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary-400)]',
    chipReadOnly: 'bg-duech-blue text-white',
    removeBtn: 'hover:bg-white/20',
  },
  socialValuations: {
    chip: 'bg-rose-200 text-rose-900',
    chipReadOnly: 'bg-rose-200 text-rose-900',
    removeBtn: 'hover:bg-rose-300',
  },
  socialStratumMarkers: {
    chip: 'bg-violet-200 text-violet-900',
    chipReadOnly: 'bg-violet-200 text-violet-900',
    removeBtn: 'hover:bg-violet-300',
  },
  styleMarkers: {
    chip: 'bg-amber-200 text-amber-900',
    chipReadOnly: 'bg-amber-200 text-amber-900',
    removeBtn: 'hover:bg-amber-300',
  },
  intentionalityMarkers: {
    chip: 'bg-emerald-200 text-emerald-900',
    chipReadOnly: 'bg-emerald-200 text-emerald-900',
    removeBtn: 'hover:bg-emerald-300',
  },
  geographicalMarkers: {
    chip: 'bg-sky-200 text-sky-900',
    chipReadOnly: 'bg-sky-200 text-sky-900',
    removeBtn: 'hover:bg-sky-300',
  },
  chronologicalMarkers: {
    chip: 'bg-orange-200 text-orange-900',
    chipReadOnly: 'bg-orange-200 text-orange-900',
    removeBtn: 'hover:bg-orange-300',
  },
  frequencyMarkers: {
    chip: 'bg-slate-200 text-slate-900',
    chipReadOnly: 'bg-slate-200 text-slate-900',
    removeBtn: 'hover:bg-slate-300',
  },
  warning: {
    chip: 'bg-red-100 text-red-800 border border-red-300 shadow-sm',
    chipReadOnly: 'bg-red-100 text-red-800 border border-red-300 shadow-sm',
    removeBtn: 'hover:bg-red-200',
  },
};

export function Chip({
  code,
  label,
  onRemove,
  className = '',
  variant = 'category',
  editorMode = false,
}: ChipProps) {
  const styles = VARIANT_STYLES[variant];
  const chipClass = editorMode ? styles.chip : styles.chipReadOnly;

  return (
    <div
      role={editorMode ? 'button' : undefined}
      tabIndex={editorMode ? 0 : undefined}
      className={`${editorMode ? 'group' : ''} inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors ${chipClass} ${className}`}
      onKeyDown={
        editorMode
          ? (e) => {
              // solo para que no haga scroll si alguien presiona Space, no borra nada
              if (e.key === ' ') e.preventDefault();
            }
          : undefined
      }
      title={label}
    >
      <span className="select-none">{label}</span>
      {editorMode && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(code);
          }}
          className={`ml-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors ${styles.removeBtn}`}
          aria-label={`Quitar ${label}`}
          title={`Quitar ${label}`}
        >
          <CloseIcon className="h-4 w-4" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

/**
 * Props for the ChipList component.
 */
export interface ChipListProps {
  /** Array of item codes to display */
  items: string[];
  /** Map of codes to display labels */
  labels: Record<string, string>;
  /** Color variant for all chips */
  variant: MarkerColorVariant;
  /** Enable editing mode */
  editorMode: boolean;
  /** Label for add button */
  addLabel?: string;
  /** Callback when add button clicked */
  onAdd?: () => void;
  /** Callback when chip removed */
  onRemove?: (index: number) => void;
}

export function ChipList({
  items,
  labels,
  variant,
  editorMode,
  addLabel,
  onAdd,
  onRemove,
}: ChipListProps) {
  if (!items || items.length === 0) {
    return editorMode && onAdd ? (
      <Button onClick={onAdd} className="hover:text-duech-blue text-sm text-gray-500 underline">
        {addLabel}
      </Button>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Chip
          key={index}
          code={item}
          label={labels[item] || item}
          variant={variant}
          editorMode={editorMode}
          onRemove={editorMode && onRemove ? () => onRemove(index) : undefined}
        />
      ))}
      {editorMode && onAdd && (
        <Button
          onClick={onAdd}
          className="inline-flex items-center justify-center rounded-md border-2 border-dashed border-blue-400 bg-white px-2 py-1 text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
