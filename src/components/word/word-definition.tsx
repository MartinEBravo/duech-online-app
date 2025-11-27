'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import InlineEditable from '@/components/word/inline-editable';
import { Chip, type MarkerColorVariant } from '@/components/common/chip';
import { Button } from '@/components/common/button';
import { PlusIcon, TrashIcon } from '@/components/icons';
import {
  GRAMMATICAL_CATEGORIES,
  MEANING_MARKER_GROUPS,
  MEANING_MARKER_KEYS,
  ORIGINS,
  type Example,
  type Meaning,
  type MeaningMarkerKey,
} from '@/lib/definitions';

// Type for unified chip item
interface ChipItem {
  type: 'category' | MeaningMarkerKey;
  code: string;
  label: string;
  variant: MarkerColorVariant;
}

interface DefinitionSectionProps {
  definition: Meaning;
  defIndex: number;
  editorMode: boolean;
  editingKey: string | null;
  onToggleEdit: (key: string) => void;
  onPatchDefinition: (patch: Partial<Meaning>) => void;
  onSetEditingCategories: () => void;
  onSetEditingMarker: (markerKey: MeaningMarkerKey) => void;
  onAddDefinition: () => void;
  onDeleteDefinition: () => void;
  renderExample: (
    examples: Example[] | null,
    defIndex?: number,
    isEditable?: boolean
  ) => React.ReactNode;
}

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
  const editorBasePath = pathname.startsWith('/editor') ? '/editor' : '';
  const isEditing = (k: string) => editingKey === k;

  // Gather all chips (category + markers) into a single list
  const allChips = useMemo(() => {
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

  const handleRemoveChip = (chip: ChipItem) => {
    if (chip.type === 'category') {
      onPatchDefinition({ grammarCategory: null });
    } else {
      onPatchDefinition({ [chip.type]: null } as Partial<Meaning>);
    }
  };

  return (
    <section
      className={`definition-hover relative rounded-2xl border-2 ${editorMode ? 'border-blue-300/70' : 'border-gray-200'} bg-white p-6 ${editorMode ? 'pb-16' : ''} shadow-sm`}
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
                <select
                  value={def.origin ?? ''}
                  onChange={(e) => onPatchDefinition({ origin: e.target.value || null })}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Sin origen</option>
                  {Object.entries(ORIGINS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
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
