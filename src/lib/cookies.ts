/**
 * Client-side cookie management for persisting search filter state.
 *
 * Stores user's search filter preferences in browser cookies so they
 * persist across page reloads and sessions.
 *
 * @module lib/cookies
 */

'use client';

import {
  MEANING_MARKER_KEYS,
  MeaningMarkerKey,
  createEmptyMarkerFilterState,
} from '@/lib/definitions';

/**
 * State for marker selections across all marker types.
 */
export type MarkerSelectionState = Record<MeaningMarkerKey, string[]>;

/**
 * Search filter state for editor mode (includes status and assignment filters).
 */
export interface EditorSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
  selectedDictionaries: string[];
  selectedStatus: string;
  selectedAssignedTo: string[];
  markers: MarkerSelectionState;
}

/**
 * Search filter state for public mode (no editorial filters).
 */
export interface PublicSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
  selectedDictionaries: string[];
  markers: MarkerSelectionState;
}

/** Cookie name for editor filter persistence */
const COOKIE_NAME = 'duech_editor_filters';

/** Cookie expiration: 30 days */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Cookie name for public filter persistence */
const PUBLIC_COOKIE_NAME = 'duech_public_filters';

/**
 * Serializes and stores data in a browser cookie.
 * @internal
 */
function setCookieData(cookieName: string, data: unknown): void {
  try {
    const serialized = JSON.stringify(data);
    document.cookie = `${cookieName}=${encodeURIComponent(serialized)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}

/**
 * Retrieves and parses data from a browser cookie.
 * @internal
 */
function getCookieData<T>(cookieName: string): T | null {
  try {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookies = document.cookie.split(';');
    const filterCookie = cookies.find((cookie) => cookie.trim().startsWith(`${cookieName}=`));

    if (!filterCookie) {
      return null;
    }

    const cookieValue = filterCookie.split('=')[1];
    if (!cookieValue) {
      return null;
    }

    const decodedValue = decodeURIComponent(cookieValue);
    return JSON.parse(decodedValue) as T;
  } catch {
    return null;
  }
}

/**
 * Saves editor search filters to a cookie.
 * @param filters - The filter state to persist
 */
export function setEditorSearchFilters(filters: EditorSearchFilters): void {
  setCookieData(COOKIE_NAME, filters);
}

/**
 * Saves public search filters to a cookie.
 * @param filters - The filter state to persist
 */
export function setPublicSearchFilters(filters: PublicSearchFilters): void {
  setCookieData(PUBLIC_COOKIE_NAME, filters);
}

/**
 * Retrieves editor search filters from cookie.
 * Returns default empty filters if cookie doesn't exist or is invalid.
 */
export function getEditorSearchFilters(): EditorSearchFilters {
  const defaultFilters: EditorSearchFilters = {
    query: '',
    selectedCategories: [],
    selectedOrigins: [],
    selectedLetters: [],
    selectedDictionaries: [],
    selectedStatus: '',
    selectedAssignedTo: [],
    markers: createEmptyMarkerFilterState(),
  };

  const parsedFilters = getCookieData<EditorSearchFilters>(COOKIE_NAME);

  if (
    parsedFilters &&
    typeof parsedFilters.query === 'string' &&
    typeof parsedFilters.selectedStatus === 'string' &&
    Array.isArray(parsedFilters.selectedCategories) &&
    Array.isArray(parsedFilters.selectedOrigins) &&
    Array.isArray(parsedFilters.selectedLetters) &&
    Array.isArray(parsedFilters.selectedAssignedTo)
  ) {
    return {
      ...parsedFilters,
      selectedDictionaries: Array.isArray(parsedFilters.selectedDictionaries)
        ? parsedFilters.selectedDictionaries
        : [],
      markers: sanitizeMarkerState(parsedFilters.markers),
    };
  }

  return defaultFilters;
}

/**
 * Clears editor search filters cookie.
 */
export function clearEditorSearchFilters(): void {
  try {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}

/**
 * Retrieves public search filters from cookie.
 * Returns default empty filters if cookie doesn't exist or is invalid.
 */
export function getPublicSearchFilters(): PublicSearchFilters {
  const defaultFilters: PublicSearchFilters = {
    query: '',
    selectedCategories: [],
    selectedOrigins: [],
    selectedLetters: [],
    selectedDictionaries: [],
    markers: createEmptyMarkerFilterState(),
  };

  const parsedFilters = getCookieData<PublicSearchFilters>(PUBLIC_COOKIE_NAME);

  if (
    parsedFilters &&
    typeof parsedFilters.query === 'string' &&
    Array.isArray(parsedFilters.selectedCategories) &&
    Array.isArray(parsedFilters.selectedOrigins) &&
    Array.isArray(parsedFilters.selectedLetters)
  ) {
    return {
      ...parsedFilters,
      selectedDictionaries: Array.isArray(parsedFilters.selectedDictionaries)
        ? parsedFilters.selectedDictionaries
        : [],
      markers: sanitizeMarkerState(parsedFilters.markers),
    };
  }

  return defaultFilters;
}

/**
 * Sanitizes and validates marker state from cookie data.
 * Ensures all marker keys exist with valid array values.
 * @internal
 */
function sanitizeMarkerState(state: unknown): MarkerSelectionState {
  const base = createEmptyMarkerFilterState();
  if (!state || typeof state !== 'object') {
    return base;
  }

  const entries = MEANING_MARKER_KEYS.map((key) => {
    const rawValue = (state as Record<string, unknown>)[key];
    if (Array.isArray(rawValue)) {
      const values = rawValue.filter((item): item is string => typeof item === 'string');
      return [key, values];
    }
    return [key, []];
  });

  return Object.fromEntries(entries) as MarkerSelectionState;
}

/**
 * Clears public search filters cookie.
 */
export function clearPublicSearchFilters(): void {
  try {
    document.cookie = `${PUBLIC_COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}
