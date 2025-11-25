'use client';

import {
  MEANING_MARKER_KEYS,
  MeaningMarkerKey,
  createEmptyMarkerFilterState,
} from '@/lib/definitions';

export type MarkerSelectionState = Record<MeaningMarkerKey, string[]>;

interface EditorSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
  selectedStatus: string;
  selectedAssignedTo: string[];
  markers: MarkerSelectionState;
}

interface PublicSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
  markers: MarkerSelectionState;
}

const COOKIE_NAME = 'duech_editor_filters';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PUBLIC_COOKIE_NAME = 'duech_public_filters';

export function setEditorSearchFilters(filters: EditorSearchFilters): void {
  try {
    const serializedFilters = JSON.stringify(filters);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serializedFilters)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}

export function setPublicSearchFilters(filters: PublicSearchFilters): void {
  try {
    const serializedFilters = JSON.stringify(filters);
    document.cookie = `${PUBLIC_COOKIE_NAME}=${encodeURIComponent(serializedFilters)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}

export function getEditorSearchFilters(): EditorSearchFilters {
  const defaultFilters: EditorSearchFilters = {
    query: '',
    selectedCategories: [],
    selectedOrigins: [],
    selectedLetters: [],
    selectedStatus: '',
    selectedAssignedTo: [],
    markers: createEmptyMarkerFilterState(),
  };

  try {
    if (typeof document === 'undefined') {
      return defaultFilters;
    }

    const cookies = document.cookie.split(';');
    const filterCookie = cookies.find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`));

    if (!filterCookie) {
      return defaultFilters;
    }

    const cookieValue = filterCookie.split('=')[1];
    if (!cookieValue) {
      return defaultFilters;
    }

    const decodedValue = decodeURIComponent(cookieValue);
    const parsedFilters = JSON.parse(decodedValue) as EditorSearchFilters;

    // Validate the structure
    if (
      typeof parsedFilters.query === 'string' &&
      typeof parsedFilters.selectedStatus === 'string' &&
      Array.isArray(parsedFilters.selectedCategories) &&
      Array.isArray(parsedFilters.selectedOrigins) &&
      Array.isArray(parsedFilters.selectedLetters) &&
      Array.isArray(parsedFilters.selectedAssignedTo)
    ) {
      return {
        ...parsedFilters,
        markers: sanitizeMarkerState(parsedFilters.markers),
      };
    }

    return defaultFilters;
  } catch {
    return defaultFilters;
  }
}

export function clearEditorSearchFilters(): void {
  try {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}

export function getPublicSearchFilters(): PublicSearchFilters {
  const defaultFilters: PublicSearchFilters = {
    query: '',
    selectedCategories: [],
    selectedOrigins: [],
    selectedLetters: [],
    markers: createEmptyMarkerFilterState(),
  };

  try {
    if (typeof document === 'undefined') {
      return defaultFilters;
    }

    const cookies = document.cookie.split(';');
    const filterCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${PUBLIC_COOKIE_NAME}=`)
    );

    if (!filterCookie) {
      return defaultFilters;
    }

    const cookieValue = filterCookie.split('=')[1];
    if (!cookieValue) {
      return defaultFilters;
    }

    const decodedValue = decodeURIComponent(cookieValue);
    const parsedFilters = JSON.parse(decodedValue) as PublicSearchFilters;

    if (
      typeof parsedFilters.query === 'string' &&
      Array.isArray(parsedFilters.selectedCategories) &&
      Array.isArray(parsedFilters.selectedOrigins) &&
      Array.isArray(parsedFilters.selectedLetters)
    ) {
      return {
        ...parsedFilters,
        markers: sanitizeMarkerState(parsedFilters.markers),
      };
    }

    return defaultFilters;
  } catch {
    return defaultFilters;
  }
}

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

export function clearPublicSearchFilters(): void {
  try {
    document.cookie = `${PUBLIC_COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}
