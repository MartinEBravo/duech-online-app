/**
 * Custom hook to manage search state with URL and cookie synchronization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LocalSearchFilters } from '@/lib/search-utils';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
  setPublicSearchFilters,
  getPublicSearchFilters,
  clearPublicSearchFilters,
} from '@/lib/cookies';
import { UrlSearchParams } from '@/hooks/useUrlSearchParams';

export interface SearchState {
  query: string;
  filters: LocalSearchFilters;
  status: string;
  assignedTo: string[];
}

const createDefaultSearchState = (): SearchState => ({
  query: '',
  filters: {
    categories: [],
    styles: [],
    origins: [],
    letters: [],
  },
  status: '',
  assignedTo: [],
});

interface UseSearchStateOptions {
  editorMode: boolean;
  urlParams: UrlSearchParams;
}

const createEditorSearchStateFromCookies = (): SearchState => {
  const savedFilters = getEditorSearchFilters();

  return {
    query: savedFilters.query,
    filters: {
      categories: savedFilters.selectedCategories,
      styles: savedFilters.selectedStyles,
      origins: savedFilters.selectedOrigins,
      letters: savedFilters.selectedLetters,
    },
    status: savedFilters.selectedStatus,
    assignedTo: savedFilters.selectedAssignedTo,
  };
};

const createPublicSearchStateFromCookies = (): SearchState => {
  const savedFilters = getPublicSearchFilters();

  return {
    query: savedFilters.query,
    filters: {
      categories: savedFilters.selectedCategories,
      styles: savedFilters.selectedStyles,
      origins: savedFilters.selectedOrigins,
      letters: savedFilters.selectedLetters,
    },
    status: '',
    assignedTo: [],
  };
};

const hasUrlSearchCriteria = (params: UrlSearchParams): boolean =>
  Boolean(params.trimmedQuery) ||
  params.categories.length > 0 ||
  params.styles.length > 0 ||
  params.origins.length > 0 ||
  params.letters.length > 0 ||
  params.status.length > 0 ||
  params.assignedTo.length > 0;

const hasSearchStateCriteria = (state: SearchState, includeEditorFields: boolean): boolean =>
  state.query.length > 0 ||
  state.filters.categories.length > 0 ||
  state.filters.styles.length > 0 ||
  state.filters.origins.length > 0 ||
  state.filters.letters.length > 0 ||
  (includeEditorFields && (state.status.length > 0 || state.assignedTo.length > 0));

/**
 * Manages search state with synchronization from URL params (public) or cookies (editor)
 */
export function useSearchState({ editorMode, urlParams }: UseSearchStateOptions) {
  const urlHasCriteria = hasUrlSearchCriteria(urlParams);
  const {
    trimmedQuery,
    categories,
    styles,
    origins,
    letters,
    status,
    assignedTo,
  } = urlParams;
  const cookieFallbackState = editorMode ? null : createPublicSearchStateFromCookies();
  const cookieHasCriteria = cookieFallbackState
    ? hasSearchStateCriteria(cookieFallbackState, false)
    : false;

  const [searchState, setSearchState] = useState<SearchState>(() => {
    if (editorMode) {
      return createEditorSearchStateFromCookies();
    }
    if (urlHasCriteria) {
      return {
        query: trimmedQuery,
        filters: {
          categories,
          styles,
          origins,
          letters,
        },
        status,
        assignedTo: [...assignedTo],
      };
    }
    if (cookieFallbackState && cookieHasCriteria) {
      return cookieFallbackState;
    }
    return {
      query: '',
      filters: {
        categories: [],
        styles: [],
        origins: [],
        letters: [],
      },
      status: '',
      assignedTo: [],
    };
  });

  const isInitializedRef = useRef(editorMode || urlHasCriteria || cookieHasCriteria);

  // Sync state when URL params change (public mode)
  useEffect(() => {
    if (editorMode) {
      isInitializedRef.current = true;
      return;
    }

    if (urlHasCriteria) {
      setSearchState({
        query: trimmedQuery,
        filters: {
          categories: [...categories],
          styles: [...styles],
          origins: [...origins],
          letters: [...letters],
        },
        status,
        assignedTo: [...assignedTo],
      });
    }
    isInitializedRef.current = true;
  }, [
    editorMode,
    urlHasCriteria,
    trimmedQuery,
    categories,
    styles,
    origins,
    letters,
    status,
    assignedTo,
  ]);

  // Save filters to cookies for editor mode
  const saveFilters = useCallback(
    (stateOverride?: SearchState) => {
      if (!isInitializedRef.current) return;

      const snapshot = stateOverride ?? searchState;

      if (editorMode) {
        setEditorSearchFilters({
          query: snapshot.query,
          selectedCategories: snapshot.filters.categories,
          selectedStyles: snapshot.filters.styles,
          selectedOrigins: snapshot.filters.origins,
          selectedLetters: snapshot.filters.letters,
          selectedStatus: snapshot.status,
          selectedAssignedTo: snapshot.assignedTo,
        });
        return;
      }

      setPublicSearchFilters({
        query: snapshot.query,
        selectedCategories: snapshot.filters.categories,
        selectedStyles: snapshot.filters.styles,
        selectedOrigins: snapshot.filters.origins,
        selectedLetters: snapshot.filters.letters,
      });
    },
    [editorMode, searchState]
  );

  // Clear all filters and reset state
  const clearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    if (editorMode) {
      clearEditorSearchFilters();
    } else {
      clearPublicSearchFilters();
    }
  }, [editorMode]);

  // Update search state
  const updateState = useCallback((updater: (prev: SearchState) => SearchState) => {
    setSearchState(updater);
  }, []);

  return {
    searchState,
    setSearchState,
    updateState,
    saveFilters,
    clearAll,
    isInitialized: isInitializedRef.current,
  };
}
