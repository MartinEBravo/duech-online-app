/**
 * Utility functions for search functionality
 */

/**
 * Parse a comma-separated string parameter into an array
 */
export function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Check if two arrays are equal (same length and same values in order)
 */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/**
 * Local type for filters with required arrays (used in search-page component)
 */
export type LocalSearchFilters = {
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
};

/**
 * Check if search filters have changed by comparing each filter array
 */
export function filtersChanged(
  prevFilters: LocalSearchFilters,
  newFilters: LocalSearchFilters
): boolean {
  return (
    prevFilters.categories.length !== newFilters.categories.length ||
    prevFilters.categories.some((cat, idx) => cat !== newFilters.categories[idx]) ||
    prevFilters.styles.length !== newFilters.styles.length ||
    prevFilters.styles.some((style, idx) => style !== newFilters.styles[idx]) ||
    prevFilters.origins.length !== newFilters.origins.length ||
    prevFilters.origins.some((origin, idx) => origin !== newFilters.origins[idx]) ||
    prevFilters.letters.length !== newFilters.letters.length ||
    prevFilters.letters.some((letter, idx) => letter !== newFilters.letters[idx])
  );
}

/**
 * Create a deep copy of search filters
 */
export function cloneFilters(filters: LocalSearchFilters): LocalSearchFilters {
  return {
    categories: [...filters.categories],
    styles: [...filters.styles],
    origins: [...filters.origins],
    letters: [...filters.letters],
  };
}

/**
 * User type for search functionality
 */
export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: string;
}
function mapUsersToOptions(users: User[]) {
  return users.map((user) => ({
    value: user.id.toString(),
    label: user.username,
  }));
}

function filterLexicographers(users: User[]) {
  return users.filter((user) => user.role === 'lexicographer');
}

/**
 * Get lexicographer options for dropdowns
 */
export function getLexicographerOptions(users: User[]) {
  return mapUsersToOptions(filterLexicographers(users));
}

export function getLexicographerByRole(
  users: User[],
  currentUsername: string,
  isAdmin: boolean,

  isLexicographer: boolean
) {
  if (isAdmin) {
    return mapUsersToOptions(filterLexicographers(users));
  }

  if (isLexicographer) {
    const filteredUsers = users.filter((user) => user.username === currentUsername);
    return mapUsersToOptions(filteredUsers);
  }

  return [];
}
export function getStatusByRole(
  statusOptions: { value: string; label: string }[],
  isAdmin: boolean,
  isLexicographer: boolean
) {
  if (isAdmin) {
    return statusOptions.filter((status) => status.value !== 'imported');
  }

  if (isLexicographer) {
    return statusOptions.filter(
      (status) => status.value === 'redacted' || status.value === 'preredacted'
    );
  }

  return [];
}
