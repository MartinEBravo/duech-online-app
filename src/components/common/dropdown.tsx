'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface Option {
  value: string;
  label: string;
}

// Common dropdown button component
function DropdownButton({
  onClick,
  isOpen,
  displayText,
  isEmpty,
  badge,
  disabled,
}: {
  onClick: () => void;
  isOpen: boolean;
  displayText: string;
  isEmpty: boolean;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
          : 'focus:border-duech-blue cursor-pointer border-gray-300 bg-white hover:bg-gray-50 focus:outline-none'
      } `}
    >
      <div className="flex items-center justify-between">
        <span className={`truncate ${isEmpty ? 'text-gray-500' : 'text-gray-900'}`}>
          {displayText}
        </span>
        <div className="flex items-center gap-2">
          {badge !== undefined && badge > 0 && (
            <span className="bg-duech-blue rounded-full px-2 py-1 text-xs text-white">{badge}</span>
          )}
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform ${!disabled && isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </button>
  );
}

function useDropdownClose(setIsOpen: (open: boolean) => void, reset?: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        reset?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen, reset]);

  return ref;
}

export function SelectDropdown({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = 'Seleccionar...',
  disabled,
}: {
  label: string;
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useDropdownClose(setIsOpen);

  const selectedOption = options.find((o) => o.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (value: string) => {
    if (disabled) return;
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} ref={ref}>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <DropdownButton
        onClick={() => !disabled && setIsOpen(!isOpen)}
        isOpen={isOpen}
        disabled={disabled}
        displayText={displayText}
        isEmpty={!selectedValue}
      />

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                selectedValue === option.value
                  ? 'bg-duech-blue bg-opacity-10 text-duech-blue font-medium'
                  : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Seleccionar...',
  maxDisplay = 3,
  disabled,
}: {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useDropdownClose(setIsOpen, () => setSearchTerm(''));

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxDisplay
        ? selectedOptions.map((o) => o.label).join(', ')
        : `${selectedOptions
            .slice(0, maxDisplay)
            .map((o) => o.label)
            .join(', ')} +${selectedOptions.length - maxDisplay} más`;

  const toggleValue = (value: string) => {
    const values = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(values);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    if (selectedValues.length === options.length) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  return (
    <div className={`relative ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} ref={ref}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <DropdownButton
        onClick={() => setIsOpen((prev) => !prev)}
        isOpen={isOpen}
        disabled={disabled}
        displayText={displayText}
        isEmpty={selectedValues.length === 0}
        badge={selectedValues.length > 0 ? selectedValues.length : undefined}
      />

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:border-duech-blue w-full rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none"
            />
          </div>

          <div className="border-b border-gray-200 p-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-duech-blue text-sm hover:underline"
            >
              {selectedValues.length === options.length
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                  className="text-duech-blue focus:ring-duech-blue mr-3 rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No se encontraron opciones</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
