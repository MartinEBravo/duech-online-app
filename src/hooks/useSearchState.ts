/**
 * Custom hook to manage search state with URL and cookie synchronization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LocalSearchFilters, createEmptyLocalFilters } from '@/lib/search-utils';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
  setPublicSearchFilters,
  getPublicSearchFilters,
  clearPublicSearchFilters,
  type MarkerSelectionState,
} from '@/lib/cookies';
import { UrlSearchParams } from '@/hooks/useUrlSearchParams';
import { MEANING_MARKER_KEYS } from '@/lib/definitions';

export interface SearchState {
  query: string;
  filters: LocalSearchFilters;
  status: string;
  assignedTo: string[];
}

const createDefaultSearchState = (): SearchState => ({
  query: '',
  filters: createEmptyLocalFilters(),
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
      origins: savedFilters.selectedOrigins,
      letters: savedFilters.selectedLetters,
      ...savedFilters.markers,
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
      origins: savedFilters.selectedOrigins,
      letters: savedFilters.selectedLetters,
      ...savedFilters.markers,
    },
    status: '',
    assignedTo: [],
  };
};

const hasUrlSearchCriteria = (params: UrlSearchParams): boolean =>
  Boolean(params.trimmedQuery) ||
  params.categories.length > 0 ||
  params.origins.length > 0 ||
  params.letters.length > 0 ||
  params.status.length > 0 ||
  params.assignedTo.length > 0 ||
  MEANING_MARKER_KEYS.some((key) => params[key].length > 0);

const hasSearchStateCriteria = (state: SearchState, includeEditorFields: boolean): boolean =>
  state.query.length > 0 ||
  state.filters.categories.length > 0 ||
  state.filters.origins.length > 0 ||
  state.filters.letters.length > 0 ||
  MEANING_MARKER_KEYS.some((key) => state.filters[key].length > 0) ||
  (includeEditorFields && (state.status.length > 0 || state.assignedTo.length > 0));

/**
 * Manages search state with synchronization from URL params (public) or cookies (editor)
 */
export function useSearchState({ editorMode, urlParams }: UseSearchStateOptions) {
  const urlHasCriteria = hasUrlSearchCriteria(urlParams);
  const { trimmedQuery, categories, origins, letters, status, assignedTo } = urlParams;
  const cookieFallbackState = editorMode ? null : createPublicSearchStateFromCookies();
  const cookieHasCriteria = cookieFallbackState
    ? hasSearchStateCriteria(cookieFallbackState, false)
    : false;

  const [searchState, setSearchState] = useState<SearchState>(() => {
    if (editorMode) {
      return createEditorSearchStateFromCookies();
    }
    if (urlHasCriteria) {
      const urlFilters: LocalSearchFilters = {
        categories,
        origins,
        letters,
      } as LocalSearchFilters;
      for (const key of MEANING_MARKER_KEYS) {
        urlFilters[key] = [...urlParams[key]];
      }
      return {
        query: trimmedQuery,
        filters: urlFilters,
        status,
        assignedTo: [...assignedTo],
      };
    }
    if (cookieFallbackState && cookieHasCriteria) {
      return cookieFallbackState;
    }
    return {
      query: '',
      filters: createEmptyLocalFilters(),
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
      const nextFilters: LocalSearchFilters = {
        categories: [...categories],
        origins: [...origins],
        letters: [...letters],
      } as LocalSearchFilters;
      for (const key of MEANING_MARKER_KEYS) {
        nextFilters[key] = [...urlParams[key]];
      }

      setSearchState({
        query: trimmedQuery,
        filters: nextFilters,
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
    origins,
    letters,
    status,
    assignedTo,
    urlParams,
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
          selectedOrigins: snapshot.filters.origins,
          selectedLetters: snapshot.filters.letters,
          selectedStatus: snapshot.status,
          selectedAssignedTo: snapshot.assignedTo,
          markers: buildMarkerSnapshot(snapshot.filters),
        });
        return;
      }

      setPublicSearchFilters({
        query: snapshot.query,
        selectedCategories: snapshot.filters.categories,
        selectedOrigins: snapshot.filters.origins,
        selectedLetters: snapshot.filters.letters,
        markers: buildMarkerSnapshot(snapshot.filters),
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

function buildMarkerSnapshot(filters: LocalSearchFilters): MarkerSelectionState {
  const snapshot = {} as MarkerSelectionState;
  for (const key of MEANING_MARKER_KEYS) {
    snapshot[key] = [...filters[key]];
  }
  return snapshot;
}
