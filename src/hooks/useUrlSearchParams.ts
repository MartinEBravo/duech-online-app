/**
 * Custom hook to parse and memoize URL search parameters
 */

import { useMemo } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { parseListParam } from '@/lib/search-utils';
import { MEANING_MARKER_KEYS, MeaningMarkerKey } from '@/lib/definitions';

export type UrlSearchParams = {
  query: string;
  trimmedQuery: string;
  categories: string[];
  origins: string[];
  letters: string[];
  status: string;
  assignedTo: string[];
  hasUrlCriteria: boolean;
} & Record<MeaningMarkerKey, string[]>;

/**
 * Parse all search parameters from URL and return memoized values
 */
export function useUrlSearchParams(searchParams?: ReadonlyURLSearchParams | null): UrlSearchParams {
  return useMemo(() => {
    const params = searchParams ?? new URLSearchParams();
    const query = params.get('q') || '';
    const categories = parseListParam(params.get('categories'));
    const origins = parseListParam(params.get('origins'));
    const letters = parseListParam(params.get('letters'));
    const status = (params.get('status') || '').trim();
    const assignedTo = parseListParam(params.get('assignedTo'));
    const markerFilters = parseMarkerParams(params);
    const trimmedQuery = query.trim();

    const hasUrlCriteria =
      Boolean(trimmedQuery) ||
      categories.length > 0 ||
      origins.length > 0 ||
      letters.length > 0 ||
      status.length > 0 ||
      assignedTo.length > 0 ||
      MEANING_MARKER_KEYS.some((key) => markerFilters[key].length > 0);

    return {
      query,
      trimmedQuery,
      categories,
      origins,
      letters,
      status,
      assignedTo,
      hasUrlCriteria,
      ...markerFilters,
    };
  }, [searchParams]);
}

function parseMarkerParams(params: ReadonlyURLSearchParams | URLSearchParams) {
  return MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      acc[key] = parseListParam(params.get(key));
      return acc;
    },
    {} as Record<MeaningMarkerKey, string[]>
  );
}
