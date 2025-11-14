import { SearchFilters, SearchMetadata, SearchResponse } from '@/lib/definitions';

/**
 * Client-safe dictionary functions that use API routes instead of direct database access.
 * These functions can be safely imported in client components.
 */

export async function searchDictionary(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 1000,
  status?: string,
  assignedTo?: string[]
): Promise<SearchResponse> {
  try {
    const params = buildFilterParams(filters);

    // Handle status parameter:
    // - If status is undefined (not passed), it means public search → append '' to indicate "published only"
    // - If status is '' (empty string), it means editor with no filter → don't append (show all)
    // - If status has a value, append it to filter by that specific status
    if (status === undefined) {
      params.append('status', 'published'); // Public search: only published
    } else if (status !== '') {
      params.append('status', status); // Specific status selected
    }
    // If status is '', don't append anything (editor: show all statuses)

    if (assignedTo?.length) params.append('assignedTo', assignedTo.join(','));

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return await fetchSearchResults(params, page, limit);
  } catch {
    return {
      results: [],
      metadata: { categories: [], styles: [], origins: [] },
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }
}

export async function getSearchMetadata(): Promise<SearchMetadata> {
  try {
    const response = await fetch('/api/search?metaOnly=true');

    if (!response.ok) {
      throw new Error('Failed to get search metadata');
    }

    const result = await response.json();
    return result.data.metadata;
  } catch {
    return { categories: [], styles: [], origins: [] };
  }
}

function buildFilterParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  const query = filters.query?.trim();
  if (query) params.append('q', query);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.styles?.length) params.append('styles', filters.styles.join(','));
  if (filters.origins?.length) params.append('origins', filters.origins.join(','));
  if (filters.letters?.length) params.append('letters', filters.letters.join(','));

  return params;
}

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
      metadata: { categories: [], styles: [], origins: [] },
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
