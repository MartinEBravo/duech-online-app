/**
 * Custom hook to manage search state with URL and cookie synchronization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LocalSearchFilters } from '@/lib/search-utils';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
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

const createSearchStateFromCookies = (): SearchState => {
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

/**
 * Manages search state with synchronization from URL params (public) or cookies (editor)
 */
export function useSearchState({ editorMode, urlParams }: UseSearchStateOptions) {
  const [searchState, setSearchState] = useState<SearchState>(() => {
    if (editorMode) {
      return createSearchStateFromCookies();
    }
    // Public mode: use URL params
    return {
      query: urlParams.query,
      filters: {
        categories: urlParams.categories,
        styles: urlParams.styles,
        origins: urlParams.origins,
        letters: urlParams.letters,
      },
      status: '',
      assignedTo: [],
    };
  });

  const isInitializedRef = useRef(editorMode);

  // Sync state when URL params change (public mode)
  useEffect(() => {
    if (editorMode) {
      isInitializedRef.current = true;
      return;
    }

    setSearchState({
      query: urlParams.trimmedQuery,
      filters: {
        categories: [...urlParams.categories],
        styles: [...urlParams.styles],
        origins: [...urlParams.origins],
        letters: [...urlParams.letters],
      },
      status: urlParams.status,
      assignedTo: [...urlParams.assignedTo],
    });
    isInitializedRef.current = true;
  }, [
    editorMode,
    urlParams.trimmedQuery,
    urlParams.categories,
    urlParams.styles,
    urlParams.origins,
    urlParams.letters,
    urlParams.status,
    urlParams.assignedTo,
  ]);

  // Save filters to cookies for editor mode
  const saveFilters = useCallback(
    (stateOverride?: SearchState) => {
    if (!editorMode || !isInitializedRef.current) return;

      const snapshot = stateOverride ?? searchState;

    setEditorSearchFilters({
        query: snapshot.query,
        selectedCategories: snapshot.filters.categories,
        selectedStyles: snapshot.filters.styles,
        selectedOrigins: snapshot.filters.origins,
        selectedLetters: snapshot.filters.letters,
        selectedStatus: snapshot.status,
        selectedAssignedTo: snapshot.assignedTo,
    });
    },
    [editorMode, searchState]
  );

  // Clear all filters and reset state
  const clearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    if (editorMode) {
      clearEditorSearchFilters();
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
