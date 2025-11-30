/**
 * Custom hook to parse and memoize URL search parameters.
 *
 * Extracts all search-related parameters from the URL and provides
 * them in a structured, memoized format for use in search components.
 *
 * @module hooks/useUrlSearchParams
 */

import { useMemo } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { parseListParam } from '@/lib/search-utils';
import { MEANING_MARKER_KEYS, MeaningMarkerKey } from '@/lib/definitions';

/**
 * Parsed URL search parameters structure.
 */
export type UrlSearchParams = {
  /** Raw query string from URL */
  query: string;
  /** Trimmed query string */
  trimmedQuery: string;
  /** Category filters from URL */
  categories: string[];
  /** Origin filters from URL */
  origins: string[];
  /** Letter filters from URL */
  letters: string[];
  /** Dictionary filters from URL */
  dictionaries: string[];
  /** Status filter from URL */
  status: string;
  /** Assigned user filters from URL */
  assignedTo: string[];
  /** Whether any search criteria is present in URL */
  hasUrlCriteria: boolean;
} & Record<MeaningMarkerKey, string[]>;

/**
 * Parses all search parameters from URL and returns memoized values.
 *
 * @param searchParams - The URL search params from Next.js navigation
 * @returns Parsed and memoized search parameters
 *
 * @example
 * ```tsx
 * const searchParams = useSearchParams();
 * const urlParams = useUrlSearchParams(searchParams);
 * console.log(urlParams.categories); // ['m', 'f']
 * ```
 */
export function useUrlSearchParams(searchParams?: ReadonlyURLSearchParams | null): UrlSearchParams {
  return useMemo(() => {
    const params = searchParams ?? new URLSearchParams();
    const query = params.get('q') || '';
    const categories = parseListParam(params.get('categories'));
    const origins = parseListParam(params.get('origins'));
    const letters = parseListParam(params.get('letters'));
    const dictionaries = parseListParam(params.get('dictionaries'));
    const status = (params.get('status') || '').trim();
    const assignedTo = parseListParam(params.get('assignedTo'));
    const markerFilters = parseMarkerParams(params);
    const trimmedQuery = query.trim();

    const hasUrlCriteria =
      Boolean(trimmedQuery) ||
      categories.length > 0 ||
      origins.length > 0 ||
      letters.length > 0 ||
      dictionaries.length > 0 ||
      status.length > 0 ||
      assignedTo.length > 0 ||
      MEANING_MARKER_KEYS.some((key) => markerFilters[key].length > 0);

    return {
      query,
      trimmedQuery,
      categories,
      origins,
      letters,
      dictionaries,
      status,
      assignedTo,
      hasUrlCriteria,
      ...markerFilters,
    };
  }, [searchParams]);
}

/**
 * Parses marker filter parameters from URL search params.
 * @internal
 */
function parseMarkerParams(params: ReadonlyURLSearchParams | URLSearchParams) {
  return MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      acc[key] = parseListParam(params.get(key));
      return acc;
    },
    {} as Record<MeaningMarkerKey, string[]>
  );
}
