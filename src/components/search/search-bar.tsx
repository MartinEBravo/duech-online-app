/**
 * Search bar component with advanced filtering options.
 *
 * This component provides a comprehensive search interface with full-text search
 * and expandable advanced filters. It's used for both public and editor modes
 * with different filter persistence strategies.
 *
 * ## Features
 *
 * ### Search Input
 * - Large input field with placeholder
 * - Debounced input (300ms) to reduce API calls
 * - Settings toggle to show/hide advanced filters
 * - Search button to submit query
 *
 * ### Advanced Filters
 * - Letters (a-z, ñ)
 * - Origins (etymology sources)
 * - Dictionaries (DUECh, Orígen, etc.)
 * - Grammar categories (noun, verb, etc.)
 * - Meaning markers (diatopic, diaphasic, etc.)
 * - Additional filters (status, assignment in editor mode)
 *
 * ### Filter Pills
 * - Active filters displayed as removable pills
 * - Color-coded by filter type
 * - Click to remove individual filter
 *
 * ### State Persistence
 * - Editor mode: persists to cookies via setEditorSearchFilters
 * - Public mode: persists to cookies via setPublicSearchFilters
 * - Syncs with URL parameters on navigation
 *
 * @module components/search/search-bar
 * @see {@link SearchBar} - The main exported component (default export)
 * @see {@link SearchBarProps} - Props interface
 * @see {@link InternalFilters} - Internal filter state type
 */

'use client';

import React, {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown } from '@/components/common/dropdown';
import { CloseIcon, SearchIcon, SettingsIcon } from '@/components/icons';
import { Button } from '@/components/common/button';
import {
  GRAMMATICAL_CATEGORIES,
  ORIGINS,
  DICCIONARIES,
  PREDEFINED_GRAMMATICAL_CATEGORY_FILTERS,
  PREDEFINED_ORIGIN_FILTERS,
  SearchFilters,
  MEANING_MARKER_KEYS,
  MEANING_MARKER_GROUPS,
  createEmptyMarkerFilterState,
  MeaningMarkerKey,
} from '@/lib/definitions';
import { useDebounce } from '@/hooks/useDebounce';
import {
  getEditorSearchFilters,
  setEditorSearchFilters,
  setPublicSearchFilters,
} from '@/lib/cookies';

/**
 * Props for the SearchBar component.
 *
 * @interface SearchBarProps
 */
export interface SearchBarProps {
  /**
   * Placeholder text for the search input.
   * @type {string}
   * @default 'Buscar palabra...'
   */
  placeholder?: string;

  /**
   * Additional CSS classes for the form container.
   * @type {string}
   */
  className?: string;

  /**
   * Initial search query value.
   * @type {string}
   * @default ''
   */
  initialValue?: string;

  /**
   * Initial filter selections.
   * @type {Partial<SearchFilters>}
   */
  initialFilters?: Partial<SearchFilters>;

  /**
   * Custom search path for navigation.
   * Defaults to '/buscar' or '/editor/buscar' based on mode.
   * @type {string}
   */
  searchPath?: string;

  /**
   * Whether to show advanced filters panel initially.
   * @type {boolean}
   * @default false
   */
  initialAdvancedOpen?: boolean;

  /**
   * Custom search handler. When provided, prevents default navigation.
   * @param {Object} state - Current search state
   * @param {string} state.query - Search query
   * @param {InternalFilters} state.filters - Active filters
   * @returns {void | Promise<void>}
   */
  onSearch?: (state: { query: string; filters: InternalFilters }) => void | Promise<void>;

  /**
   * Callback fired when search state changes (debounced).
   * Used for real-time search updates.
   * @param {Object} state - Current search state
   * @param {string} state.query - Search query
   * @param {InternalFilters} state.filters - Active filters
   * @returns {void}
   */
  onStateChange?: (state: { query: string; filters: InternalFilters }) => void;

  /**
   * Callback fired when "Clear filters" button is clicked.
   * @returns {void}
   */
  onClearAll?: () => void;

  /**
   * Configuration for additional filters (e.g., status, assignment).
   * @type {AdditionalFiltersConfig}
   */
  additionalFilters?: AdditionalFiltersConfig;

  /**
   * Whether the search bar is in editor mode.
   * Affects filter persistence and available options.
   * @type {boolean}
   * @default false
   */
  editorMode?: boolean;
}

/**
 * Selection state for meaning marker filters.
 * Maps each marker key to an array of selected values.
 *
 * @typedef MarkerSelections
 */
export type MarkerSelections = Record<MeaningMarkerKey, string[]>;

/**
 * Internal filter state for the search bar.
 *
 * Combines base filters (categories, origins, letters, dictionaries)
 * with all meaning marker selections.
 *
 * @typedef InternalFilters
 */
export type InternalFilters = {
  /** Selected grammar categories */
  categories: string[];
  /** Selected origin values */
  origins: string[];
  /** Selected letters (a-z, ñ) */
  letters: string[];
  /** Selected dictionary sources */
  dictionaries: string[];
} & MarkerSelections;

/**
 * Filter type variants for pill styling.
 * @internal
 * @typedef FilterVariant
 */
type FilterVariant = 'category' | 'origin' | 'letter' | 'marker' | 'dictionary';

/**
 * Configuration for the additional filters section.
 *
 * Allows parent components to inject custom filter controls
 * into the advanced filters panel.
 *
 * @interface AdditionalFiltersConfig
 */
export interface AdditionalFiltersConfig {
  /**
   * Whether any additional filters are currently active.
   * Used to show/hide clear button.
   * @type {boolean}
   */
  hasActive: boolean;

  /**
   * Callback to clear additional filters.
   * @returns {void}
   */
  onClear?: () => void;

  /**
   * Render function for additional filter controls.
   * @returns {ReactNode} Custom filter UI elements
   */
  render: () => ReactNode;
}

const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

const MARKER_ENTRIES = MEANING_MARKER_KEYS.map((key) => ({
  key,
  config: MEANING_MARKER_GROUPS[key],
}));

function createEmptyFilters(): InternalFilters {
  const markerDefaults = createEmptyMarkerFilterState();
  const base = {
    categories: [] as string[],
    origins: [] as string[],
    letters: [] as string[],
    dictionaries: [] as string[],
    ...markerDefaults,
  };

  return base;
}

function mergeInitialFilters(initial?: Partial<SearchFilters>): InternalFilters {
  const filters = createEmptyFilters();
  if (!initial) {
    return filters;
  }

  filters.categories = initial.categories ?? [];
  filters.origins = initial.origins ?? [];
  filters.letters = initial.letters ?? [];
  filters.dictionaries = initial.dictionaries ?? [];

  for (const key of MEANING_MARKER_KEYS) {
    filters[key] = initial[key] ?? [];
  }

  return filters;
}

function arraysEqual(current: string[], next: string[]): boolean {
  if (current === next) return true;
  if (current.length !== next.length) return false;
  for (let index = 0; index < current.length; index += 1) {
    if (current[index] !== next[index]) return false;
  }
  return true;
}

function filtersEqual(a: InternalFilters, b: InternalFilters): boolean {
  if (!arraysEqual(a.categories, b.categories)) return false;
  if (!arraysEqual(a.origins, b.origins)) return false;
  if (!arraysEqual(a.letters, b.letters)) return false;
  if (!arraysEqual(a.dictionaries, b.dictionaries)) return false;

  return !MEANING_MARKER_KEYS.some((key) => !arraysEqual(a[key], b[key]));
}

function buildMarkerSnapshot(filters: InternalFilters): MarkerSelections {
  return MEANING_MARKER_KEYS.reduce((acc, key) => {
    acc[key] = [...filters[key]];
    return acc;
  }, {} as MarkerSelections);
}

function buildMarkerSignature(filters: InternalFilters): string {
  return MEANING_MARKER_KEYS.map((key) => filters[key].join('|')).join(';');
}

/**
 * Advanced search bar with filtering capabilities.
 *
 * Features debounced search, expandable advanced filters panel,
 * filter pills for active selections, and cookie/URL state persistence.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Buscar palabra..."
 *   initialValue={query}
 *   initialFilters={filters}
 *   onSearch={handleSearch}
 *   editorMode={true}
 * />
 * ```
 */
export default function SearchBar({
  placeholder = 'Buscar palabra...',
  className = '',
  initialValue = '',
  initialFilters,
  searchPath: customSearchPath,
  initialAdvancedOpen = false,
  onSearch,
  onStateChange,
  onClearAll,
  additionalFilters,
  editorMode = false,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const editorBasePath = editorMode && pathname.startsWith('/editor') ? '/editor' : '';
  const isInitialMountRef = useRef(true);
  const isSyncingFromPropsRef = useRef(false);

  const normalizedInitialFilters = useMemo(
    () => mergeInitialFilters(initialFilters),
    [initialFilters]
  );

  const [query, setQuery] = useState(initialValue);
  const [filters, setFilters] = useState<InternalFilters>(normalizedInitialFilters);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(initialAdvancedOpen);

  const defaultSearchPath = editorBasePath ? `${editorBasePath}/buscar` : '/buscar';
  const searchPath = customSearchPath ?? defaultSearchPath;

  const initialCategories = normalizedInitialFilters.categories;
  const initialOrigins = normalizedInitialFilters.origins;
  const initialLetters = normalizedInitialFilters.letters;
  const initialMarkerSignature = buildMarkerSignature(normalizedInitialFilters);

  const categoriesSignature = initialCategories.join('|');
  const originsSignature = initialOrigins.join('|');
  const lettersSignature = initialLetters.join('|');

  const baseHasActiveFilters = useMemo(
    () =>
      filters.categories.length > 0 ||
      filters.origins.length > 0 ||
      filters.letters.length > 0 ||
      filters.dictionaries.length > 0 ||
      MEANING_MARKER_KEYS.some((key) => filters[key].length > 0),
    [filters]
  );

  const extraFiltersActive = Boolean(additionalFilters?.hasActive);
  const hasActiveFilters = baseHasActiveFilters || extraFiltersActive;

  const debouncedQuery = useDebounce(query, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isTypingRef.current) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const nextFilters = normalizedInitialFilters;

    const shouldAutoOpen =
      initialCategories.length > 0 ||
      initialOrigins.length > 0 ||
      initialLetters.length > 0 ||
      MEANING_MARKER_KEYS.some((key) => normalizedInitialFilters[key].length > 0);

    if (!filtersEqual(filters, nextFilters)) {
      isSyncingFromPropsRef.current = true;
      setFilters(nextFilters);
    }

    if (shouldAutoOpen) {
      setAdvancedOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categoriesSignature,
    originsSignature,
    lettersSignature,
    initialMarkerSignature,
    normalizedInitialFilters,
  ]);

  useEffect(() => {
    if (extraFiltersActive) {
      setAdvancedOpen(true);
    }
  }, [extraFiltersActive]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const categoryOptions = useMemo(
    () =>
      PREDEFINED_GRAMMATICAL_CATEGORY_FILTERS.map((category) => ({
        value: category,
        label: GRAMMATICAL_CATEGORIES[category] || category,
      })),
    []
  );

  const originOptions = useMemo(
    () =>
      PREDEFINED_ORIGIN_FILTERS.map((origin) => ({
        value: origin,
        label: ORIGINS[origin] || origin,
      })),
    []
  );

  const markerOptions = useMemo(() => {
    const entries = MARKER_ENTRIES.map(({ key, config }) => {
      const values = Object.keys(config.labels);
      const options = values.map((value) => ({
        value,
        label: config.labels[value] || value,
      }));
      return [key, options];
    });
    return Object.fromEntries(entries) as Record<
      MeaningMarkerKey,
      { value: string; label: string }[]
    >;
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedQuery = query.trim();

      if (!trimmedQuery && !hasActiveFilters) {
        return;
      }

      if (onSearch) {
        await onSearch({ query: trimmedQuery, filters });
        return;
      }

      const markerSnapshot = buildMarkerSnapshot(filters);

      if (editorMode) {
        const existing = getEditorSearchFilters();
        setEditorSearchFilters({
          query: trimmedQuery,
          selectedCategories: [...filters.categories],
          selectedOrigins: [...filters.origins],
          selectedLetters: [...filters.letters],
          selectedDictionaries: [...filters.dictionaries],
          selectedStatus: existing.selectedStatus,
          selectedAssignedTo: [...existing.selectedAssignedTo],
          markers: markerSnapshot,
        });

        router.push(searchPath);
        return;
      }

      setPublicSearchFilters({
        query: trimmedQuery,
        selectedCategories: [...filters.categories],
        selectedOrigins: [...filters.origins],
        selectedLetters: [...filters.letters],
        selectedDictionaries: [...filters.dictionaries],
        markers: markerSnapshot,
      });

      router.push(searchPath);
    },
    [editorMode, filters, hasActiveFilters, onSearch, query, router, searchPath]
  );

  const updateFilters = useCallback(<K extends keyof InternalFilters>(key: K, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setFilters(createEmptyFilters());
    additionalFilters?.onClear?.();
    onClearAll?.();
  }, [additionalFilters, onClearAll]);

  const removeFilterValue = useCallback((key: keyof InternalFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((item: string) => item !== value),
    }));
  }, []);

  const renderFilterPills = () => {
    const pills: Array<{
      key: keyof InternalFilters;
      value: string;
      label: string;
      variant: FilterVariant;
    }> = [];

    filters.categories.forEach((category: string) => {
      pills.push({
        key: 'categories',
        value: category,
        label: GRAMMATICAL_CATEGORIES[category] || category,
        variant: 'category',
      });
    });

    filters.origins.forEach((origin) => {
      pills.push({ key: 'origins', value: origin, label: origin, variant: 'origin' });
    });

    filters.letters.forEach((letter) => {
      pills.push({ key: 'letters', value: letter, label: letter.toUpperCase(), variant: 'letter' });
    });

    filters.dictionaries.forEach((dict) => {
      pills.push({ key: 'dictionaries', value: dict, label: dict, variant: 'dictionary' });
    });

    MEANING_MARKER_KEYS.forEach((markerKey) => {
      const config = MEANING_MARKER_GROUPS[markerKey];
      filters[markerKey].forEach((marker) => {
        pills.push({
          key: markerKey,
          value: marker,
          label: config.labels[marker] || marker,
          variant: 'marker',
        });
      });
    });

    if (pills.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {pills.map((pill) => (
          <Button
            key={`${pill.key}-${pill.value}`}
            type="button"
            onClick={() => removeFilterValue(pill.key, pill.value)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${
              pill.variant === 'category'
                ? 'border-blue-300 bg-blue-100 text-blue-800'
                : pill.variant === 'origin'
                  ? 'border-purple-300 bg-purple-100 text-purple-800'
                  : pill.variant === 'letter'
                    ? 'border-orange-300 bg-orange-100 text-orange-800'
                    : pill.variant === 'dictionary'
                      ? 'border-teal-300 bg-teal-100 text-teal-800'
                      : 'border-green-300 bg-green-100 text-green-800'
            } `}
          >
            <span>{pill.label}</span>
            <CloseIcon className="h-3 w-3" />
          </Button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!onStateChange) return;
    if (editorMode) return;

    if (isSyncingFromPropsRef.current) {
      isSyncingFromPropsRef.current = false;
      return;
    }

    onStateChange({ query: debouncedQuery, filters: debouncedFilters });
  }, [debouncedFilters, debouncedQuery, onStateChange, editorMode]);

  const additionalFiltersContent = additionalFilters?.render?.();

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            isTypingRef.current = true;
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              isTypingRef.current = false;
            }, 500);
          }}
          placeholder={placeholder}
          className="focus:border-duech-blue w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 pr-28 text-lg text-gray-900 shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:outline-none"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            aria-label={advancedOpen ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
            className="hover:text-duech-blue bg-gray-100 p-3 text-gray-600 hover:bg-blue-50"
          >
            <SettingsIcon className="h-6 w-6" />
          </Button>

          <Button
            type="submit"
            aria-label="Buscar"
            className="hover:text-duech-blue bg-gray-100 p-3 text-gray-600 hover:bg-blue-50"
          >
            <SearchIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {advancedOpen && (
        <div className="border-duech-blue/20 mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Row 1 */}
              <Dropdown
                label="Letras"
                options={LETTER_OPTIONS}
                value={filters.letters}
                onChange={(values: string[]) => updateFilters('letters', values)}
                placeholder="Seleccionar letras"
                multiple={true}
              />
              <Dropdown
                label="Orígenes"
                options={originOptions}
                value={filters.origins}
                onChange={(values: string[]) => updateFilters('origins', values)}
                placeholder="Seleccionar orígenes"
                multiple={true}
              />

              <Dropdown
                label="Diccionarios"
                options={DICCIONARIES}
                value={filters.dictionaries}
                onChange={(values: string[]) => updateFilters('dictionaries', values)}
                placeholder="Seleccionar diccionarios"
                multiple={true}
              />

              {/* Row 2 */}
              <Dropdown
                label="Categorías gramaticales"
                options={categoryOptions}
                value={filters.categories}
                onChange={(values: string[]) => updateFilters('categories', values)}
                placeholder="Seleccionar categorías"
                multiple={true}
              />
              {/* Markers - rows 2-5 */}
              {MARKER_ENTRIES.map(({ key, config }) => (
                <Dropdown
                  key={key}
                  label={config.label}
                  options={markerOptions[key]}
                  value={filters[key]}
                  onChange={(values: string[]) => updateFilters(key, values)}
                  placeholder={config.addLabel.replace('+ ', '')}
                  multiple={true}
                />
              ))}

              {/* Additional filters if any */}
              {additionalFiltersContent}
            </div>
          </div>

          {renderFilterPills()}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Limpiar filtros
            </Button>

            <Button
              type="submit"
              className="bg-duech-blue px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-900"
            >
              Buscar con filtros
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
