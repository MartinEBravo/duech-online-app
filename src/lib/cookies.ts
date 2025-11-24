'use client';

interface EditorSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedStyles: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
  selectedStatus: string;
  selectedAssignedTo: string[];
}

interface PublicSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedStyles: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
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
    selectedStyles: [],
    selectedOrigins: [],
    selectedLetters: [],
    selectedStatus: '',
    selectedAssignedTo: [],
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
      Array.isArray(parsedFilters.selectedStyles) &&
      Array.isArray(parsedFilters.selectedOrigins) &&
      Array.isArray(parsedFilters.selectedLetters) &&
      Array.isArray(parsedFilters.selectedAssignedTo)
    ) {
      return parsedFilters;
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
    selectedStyles: [],
    selectedOrigins: [],
    selectedLetters: [],
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
      Array.isArray(parsedFilters.selectedStyles) &&
      Array.isArray(parsedFilters.selectedOrigins) &&
      Array.isArray(parsedFilters.selectedLetters)
    ) {
      return parsedFilters;
    }

    return defaultFilters;
  } catch {
    return defaultFilters;
  }
}

export function clearPublicSearchFilters(): void {
  try {
    document.cookie = `${PUBLIC_COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch {
    // Silent fail
  }
}
