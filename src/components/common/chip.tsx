'use client';

import React from 'react';
import { Button } from '@/components/common/button';
import { PlusIcon, DeleteIcon } from '@/components/icons';

// Color variants for different marker types
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

interface ChipProps {
  code: string;
  label: string;
  onRemove?: (code: string) => void;
  className?: string;
  variant?: MarkerColorVariant;
  editorMode?: boolean;
}

const VARIANT_STYLES: Record<
  MarkerColorVariant,
  { chip: string; chipReadOnly: string; removeBtn: string }
> = {
  category: {
    chip: 'bg-duech-blue text-white hover:bg-[var(--color-primary-700)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary-400)]',
    chipReadOnly: 'bg-duech-blue text-white',
    removeBtn: 'bg-white/20 hover:bg-white/30',
  },
  socialValuations: {
    chip: 'bg-rose-200 text-rose-900 hover:bg-rose-300 cursor-pointer',
    chipReadOnly: 'bg-rose-200 text-rose-900',
    removeBtn: 'bg-rose-300 hover:bg-rose-400',
  },
  socialStratumMarkers: {
    chip: 'bg-violet-200 text-violet-900 hover:bg-violet-300 cursor-pointer',
    chipReadOnly: 'bg-violet-200 text-violet-900',
    removeBtn: 'bg-violet-300 hover:bg-violet-400',
  },
  styleMarkers: {
    chip: 'bg-amber-200 text-amber-900 hover:bg-amber-300 cursor-pointer',
    chipReadOnly: 'bg-amber-200 text-amber-900',
    removeBtn: 'bg-amber-300 hover:bg-amber-400',
  },
  intentionalityMarkers: {
    chip: 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300 cursor-pointer',
    chipReadOnly: 'bg-emerald-200 text-emerald-900',
    removeBtn: 'bg-emerald-300 hover:bg-emerald-400',
  },
  geographicalMarkers: {
    chip: 'bg-sky-200 text-sky-900 hover:bg-sky-300 cursor-pointer',
    chipReadOnly: 'bg-sky-200 text-sky-900',
    removeBtn: 'bg-sky-300 hover:bg-sky-400',
  },
  chronologicalMarkers: {
    chip: 'bg-orange-200 text-orange-900 hover:bg-orange-300 cursor-pointer',
    chipReadOnly: 'bg-orange-200 text-orange-900',
    removeBtn: 'bg-orange-300 hover:bg-orange-400',
  },
  frequencyMarkers: {
    chip: 'bg-slate-200 text-slate-900 hover:bg-slate-300 cursor-pointer',
    chipReadOnly: 'bg-slate-200 text-slate-900',
    removeBtn: 'bg-slate-300 hover:bg-slate-400',
  },
  warning: {
    chip: 'bg-red-100 text-red-800 border border-red-300 cursor-default shadow-sm hover:bg-red-200',
    chipReadOnly: 'bg-red-100 text-red-800 border border-red-300 shadow-sm',
    removeBtn: 'bg-red-200 hover:bg-red-300',
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
        <Button
          type="button"
          onClick={() => onRemove(code)}
          className={`ml-2 grid h-0 w-0 place-items-center overflow-hidden rounded-full opacity-0 transition-all duration-200 group-hover:h-6 group-hover:w-6 group-hover:opacity-100 ${styles.removeBtn}`}
          aria-label={`Quitar ${label}`}
          title={`Quitar ${label}`}
        >
          <DeleteIcon className="h-3 w-3 text-white" />
        </Button>
      )}
    </div>
  );
}

interface ChipListProps {
  items: string[];
  labels: Record<string, string>;
  variant: MarkerColorVariant;
  editorMode: boolean;
  addLabel?: string;
  onAdd?: () => void;
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
