'use client';

import { useState } from 'react';
import { Button } from '@/components/common/button';

/**
 * Selector genérico para opciones (categorías, estilos, etc.)
 * Soporta selección única (maxSelections=1) o múltiple
 */
interface MultiSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: string[]) => void;
  selectedItems: string[];
  title: string;
  options: Record<string, string>;
  maxWidth?: 'lg' | '2xl';
  columns?: 2 | 3;
  maxSelections?: number;
}

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
