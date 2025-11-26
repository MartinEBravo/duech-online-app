/**
 * Client-side dictionary API functions.
 *
 * Provides functions for searching the dictionary from client components.
 * Uses API routes instead of direct database access for security.
 *
 * @module lib/dictionary-client
 */

import {
  SearchFilters,
  SearchResponse,
  MEANING_MARKER_KEYS,
  createEmptyMarkerFilterState,
} from '@/lib/definitions';

/**
 * Searches the dictionary using the API.
 *
 * Handles both public and editor mode searches with different filter options.
 *
 * @param filters - Search filters (query, categories, origins, etc.)
 * @param page - Page number (1-indexed)
 * @param limit - Results per page
 * @param status - Status filter (editor mode only)
 * @param assignedTo - Assigned user filter (editor mode only)
 * @param editorMode - Whether to include non-published words
 * @returns Search response with results, metadata, and pagination
 */
export async function searchDictionary(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 1000,
  status?: string,
  assignedTo?: string[],
  editorMode?: boolean
): Promise<SearchResponse> {
  try {
    const params = buildFilterParams(filters);

    // Status handling logic
    // - Public users always receive "published"
    // - Editors:
    //   * undefined or "" → no filter → return all statuses
    //   * any specific value → filter by that value
    if (!editorMode) {
      // Public search: always filter to published words only
      params.append('status', 'published');
    } else {
      if (status && status.trim() !== '') {
        // Editor filtering by a specific status
        params.append('status', status);
      }
      // 👉 If status is undefined or empty, DO NOT append anything
      // Ensure the API receives an explicit marker when running in editor mode
      // because middleware-set headers may not be available to API route requests.
      if (editorMode) {
        params.append('editorMode', 'true');
      }
    }

    if (assignedTo?.length) params.append('assignedTo', assignedTo.join(','));

    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return await fetchSearchResults(params, page, limit);
  } catch {
    return {
      results: [],
      metadata: {
        categories: [],
        origins: [],
        dictionaries: [],
        markers: createEmptyMarkerFilterState(),
      },
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }
}

/**
 * Builds URL search params from filter object.
 * @internal
 */
function buildFilterParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  const query = filters.query?.trim();
  if (query) params.append('q', query);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.origins?.length) params.append('origins', filters.origins.join(','));
  if (filters.letters?.length) params.append('letters', filters.letters.join(','));
  if (filters.dictionaries?.length) params.append('dictionaries', filters.dictionaries.join(','));
  for (const key of MEANING_MARKER_KEYS) {
    const values = filters[key];
    if (values?.length) {
      params.append(key, values.join(','));
    }
  }
  return params;
}

/**
 * Fetches search results from the API endpoint.
 * @internal
 */
async function fetchSearchResults(params: URLSearchParams, page: number, limit: number) {
  try {
    const queryString = params.toString();
    const response = await fetch(`/api/search${queryString ? `?${queryString}` : ''}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const result = await response.json();
    return result.data;
  } catch {
    return {
      results: [],
      metadata: {
        categories: [],
        origins: [],
        dictionaries: [],
        markers: createEmptyMarkerFilterState(),
      },
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }
}
