/**
 * Word warning component for missing fields.
 *
 * Displays warnings for definitions that are missing required fields,
 * helping editors identify incomplete entries. This component is displayed
 * in the editor mode header to provide quick visibility into what fields
 * need to be filled out.
 *
 * ## Warning Detection
 * The component checks each definition against a configurable list of
 * required fields and displays warnings grouped by definition number.
 *
 * ## Visual Design
 * - Amber/yellow color scheme for warning emphasis
 * - Exclamation icon for visual alert
 * - Chip list showing missing fields per definition
 * - Definition numbers in circular badges
 *
 * ## Field Checking Logic
 * - **Empty values**: null, undefined, empty string (after trim), empty array
 * - **Examples**: Checks if any example has a non-empty value field
 * - **Categories/Markers**: Checks if the field is null/undefined
 *
 * @module components/word/word-warning
 * @see {@link WordWarning} - The main exported component (default export)
 * @see {@link WordWarningProps} - Props interface
 * @see {@link DefinitionField} - Checkable field type union
 */

'use client';

import React, { useMemo } from 'react';
import type { Meaning, Example } from '@/lib/definitions';
import { ChipList } from '@/components/common/chip';
import { ExclamationCircleIcon } from '@/components/icons';

/**
 * Fields that can be checked for completeness in a definition.
 *
 * Each field corresponds to a property in the Meaning interface
 * that can be validated for presence/non-empty value.
 *
 * @typedef {'origin' | 'categories' | 'remission' | 'meaning' | 'styleMarkers' | 'observation' | 'examples' | 'variant'} DefinitionField
 */
export type DefinitionField =
  | 'origin'
  | 'categories'
  | 'remission'
  | 'meaning'
  | 'styleMarkers'
  | 'observation'
  | 'examples'
  | 'variant';

/**
 * Props for the WordWarning component.
 *
 * @interface WordWarningProps
 */
export interface WordWarningProps {
  /**
   * Definition(s) to check for missing fields.
   * Accepts single definition or array for flexibility.
   * @type {Meaning | Meaning[]}
   */
  definitions: Meaning | Meaning[];

  /**
   * Fields that should be present (defaults to all fields).
   * Only specified fields will be checked for warnings.
   * @type {DefinitionField[]}
   * @default ['origin', 'categories', 'remission', 'meaning', 'styleMarkers', 'observation', 'examples', 'variant']
   */
  requiredFields?: DefinitionField[];

  /**
   * Additional CSS classes to apply to the container.
   * @type {string}
   */
  className?: string;
}

/**
 * Human-readable labels for each checkable field.
 * Used to display warning messages in Spanish.
 *
 * @internal
 * @constant
 * @type {Record<DefinitionField, string>}
 */
const LABELS: Record<DefinitionField, string> = {
  origin: 'Origen vacío',
  categories: 'Categorías sin seleccionar',
  remission: 'Remisión vacía',
  meaning: 'Significado vacío',
  styleMarkers: 'Marcas de estilo sin seleccionar',
  observation: 'Observación vacía',
  examples: 'Ejemplo(s) faltante(s)',
  variant: 'Variante vacía',
};

/**
 * Checks if a value is considered empty for warning purposes.
 *
 * A value is empty if it's:
 * - null or undefined
 * - An empty string (after trimming whitespace)
 * - An empty array
 *
 * @internal
 * @param {unknown} val - The value to check
 * @returns {boolean} True if the value is empty
 */
function isEmptyValue(val: unknown): boolean {
  if (val == null) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

/**
 * Checks if examples are missing or all empty.
 *
 * Returns true if:
 * - The examples parameter is null/undefined
 * - The examples array is empty
 * - All examples have empty or whitespace-only value fields
 *
 * @internal
 * @param {Example | Example[] | undefined | null} ex - Example(s) to check
 * @returns {boolean} True if examples are missing or empty
 */
function isExampleMissing(ex: Example | Example[] | undefined | null): boolean {
  if (ex == null) return true;
  const items = Array.isArray(ex) ? ex : [ex];
  return items.length === 0 || items.every((e) => (e?.value ?? '').trim().length === 0);
}

/**
 * Collects all missing fields from a definition.
 *
 * Iterates through the specified fields and checks each one
 * against the definition, returning an array of field names
 * that are empty or missing.
 *
 * @internal
 * @param {Meaning} def - The definition to check
 * @param {DefinitionField[]} fields - Array of fields to check
 * @returns {DefinitionField[]} Array of missing field names
 */
function collectMissing(def: Meaning, fields: DefinitionField[]): DefinitionField[] {
  const missing: DefinitionField[] = [];

  for (const f of fields) {
    switch (f) {
      case 'origin':
        if (isEmptyValue(def.origin)) missing.push(f);
        break;
      case 'categories':
        if (isEmptyValue(def.grammarCategory)) missing.push(f);
        break;
      case 'remission':
        if (isEmptyValue(def.remission)) missing.push(f);
        break;
      case 'meaning':
        if (isEmptyValue(def.meaning)) missing.push(f);
        break;
      case 'styleMarkers':
        if (isEmptyValue(def.styleMarkers)) missing.push(f);
        break;
      case 'observation':
        if (isEmptyValue(def.observation)) missing.push(f);
        break;
      case 'examples':
        if (isExampleMissing(def.examples ?? null)) missing.push(f);
        break;
      case 'variant':
        if (isEmptyValue(def.variant)) missing.push(f);
        break;
    }
  }
  return missing;
}

/**
 * Displays warnings for definitions with missing required fields.
 *
 * This component analyzes all provided definitions and displays a
 * warning box listing which fields are missing for each definition.
 * It's designed to be displayed in the editor header to help editors
 * quickly identify what needs to be filled in.
 *
 * ## Behavior
 * - Returns null if no warnings exist (all fields complete)
 * - Groups warnings by definition number
 * - Shows definition numbers in circular badges
 * - Displays missing fields as chips using ChipList
 *
 * ## Performance
 * - Uses useMemo to avoid recalculating warnings on every render
 * - Only re-calculates when definitions or requiredFields change
 *
 * @function WordWarning
 * @param {WordWarningProps} props - Component props
 * @param {Meaning | Meaning[]} props.definitions - Definition(s) to check
 * @param {DefinitionField[]} [props.requiredFields] - Fields to check (defaults to all)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element | null} Warning box or null if no warnings
 *
 * @example
 * // Check all fields (default)
 * <WordWarning definitions={word.values} />
 *
 * @example
 * // Check only specific required fields
 * <WordWarning
 *   definitions={word.values}
 *   requiredFields={['meaning', 'examples', 'categories']}
 *   className="mb-4"
 * />
 *
 * @example
 * // Single definition
 * <WordWarning
 *   definitions={singleMeaning}
 *   requiredFields={['meaning']}
 * />
 */
export default function WordWarning({
  definitions,
  requiredFields = [
    'origin',
    'categories',
    'remission',
    'meaning',
    'styleMarkers',
    'observation',
    'examples',
    'variant',
  ],
  className,
}: WordWarningProps) {
  // Check if there are any definitions with missing fields
  const definitionsWithWarnings = useMemo(() => {
    const definitionList = Array.isArray(definitions) ? definitions : [definitions];
    return definitionList
      .map((def, idx) => ({
        definition: def,
        missing: collectMissing(def, requiredFields),
        index: idx,
      }))
      .filter((item) => item.missing.length > 0);
  }, [definitions, requiredFields]);

  if (definitionsWithWarnings.length === 0) return null;

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <ExclamationCircleIcon className="h-20 w-20 flex-shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="mb-3 font-semibold text-amber-900">Campos pendientes por definición:</p>
          <div className="space-y-3">
            {definitionsWithWarnings.map(({ definition: def, missing }) => (
              <div key={def.number} className="flex items-center gap-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-200 px-2 text-sm font-bold text-amber-900">
                  {def.number}
                </span>
                <ChipList items={missing} labels={LABELS} variant="warning" editorMode={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
