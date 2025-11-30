/**
 * Search API endpoint for dictionary queries.
 *
 * Provides advanced search functionality with support for:
 * - Text search (prefix and contains matching)
 * - Multiple filter types (categories, origins, letters, etc.)
 * - Marker filters (sociolinguistic classifications)
 * - Pagination
 * - Metadata-only requests
 *
 * @module app/api/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchWords } from '@/lib/queries';
import {
  SearchResult,
  MarkerFilterState,
  MarkerMetadata,
  MEANING_MARKER_KEYS,
  MeaningMarkerKey,
} from '@/lib/definitions';
import { applyRateLimit } from '@/lib/rate-limiting';
import { db } from '@/lib/db';
import { meanings } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { isEditorModeFromHeaders } from '@/lib/editor-mode-server';

/** Maximum allowed query length */
const MAX_QUERY_LENGTH = 100;

/** Maximum results per request */
const MAX_LIMIT = 1000;

/**
 * Internal search filter structure.
 * @internal
 */
type SearchFilters = {
  query: string;
  categories: string[];
  origins: string[];
  letters: string[];
  dictionaries: string[];
  status: string | undefined;
  assignedTo: string[];
} & MarkerFilterState;

/** @internal */
interface ParseSuccess {
  filters: SearchFilters;
  page: number;
  limit: number;
  metaOnly: boolean;
}

/** @internal */
interface ParseError {
  errorResponse: NextResponse;
}

/** @internal */
type ParseResult = ParseSuccess | ParseError;

/**
 * GET /api/search - Search the dictionary
 *
 * Query parameters:
 * - q: Search query string
 * - categories: Comma-separated grammatical categories
 * - origins: Comma-separated origins
 * - letters: Comma-separated first letters
 * - dictionaries: Comma-separated dictionary sources
 * - status: Word status filter (editor mode)
 * - assignedTo: Comma-separated user IDs (editor mode)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 1000)
 * - meta: If "true", returns only metadata without results
 * - editorMode: If "true", includes non-published words
 * - [markerKey]: Marker filters (e.g., socialValuations=vulgar)
 *
 * @returns Search results, metadata, and pagination info
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(searchParams);
    // Determine editor mode from middleware header or explicit query param fallback.
    // Middleware may set x-editor-mode, but for API requests the header can be missing,
    // so allow client to pass editorMode=true as a query param.
    const editorMode =
      isEditorModeFromHeaders(request.headers) || searchParams.get('editorMode') === 'true';

    if ('errorResponse' in parsed) {
      return parsed.errorResponse;
    }

    const { filters, page, limit, metaOnly } = parsed;

    // Get metadata from database
    const categoriesResult = await db
      .selectDistinct({ category: meanings.grammarCategory })
      .from(meanings)
      .where(sql`${meanings.grammarCategory} IS NOT NULL`);

    const originsResult = await db.selectDistinct({ origin: meanings.origin }).from(meanings);

    const markerMetadata = await fetchMarkerMetadata();

    const metadata = {
      categories: categoriesResult
        .map((r) => r.category)
        .filter((c): c is string => c != null)
        .sort((a, b) => a.localeCompare(b, 'es')),
      origins: originsResult
        .map((r) => r.origin)
        .filter((o): o is string => o != null)
        .sort((a, b) => a.localeCompare(b, 'es')),
      markers: markerMetadata,
    };

    let paginatedResults: SearchResult[] = [];
    let pagination = {
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };

    if (!metaOnly) {
      // Search in database using advanced search with pagination
      const { results, total } = await searchWords({
        query: filters.query || undefined,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        origins: filters.origins.length > 0 ? filters.origins : undefined,
        letters: filters.letters.length > 0 ? filters.letters : undefined,
        dictionaries: filters.dictionaries.length > 0 ? filters.dictionaries : undefined,
        status: filters.status || undefined,
        assignedTo: filters.assignedTo.length > 0 ? filters.assignedTo : undefined,
        editorMode,
        limit: MAX_LIMIT,
        page: page,
        pageSize: limit,
        ...extractMarkerFilters(filters),
      });

      paginatedResults = results;

      pagination = {
        page,
        limit,
        total: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        metadata,
        pagination,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Parses and validates search parameters from URL.
 * @internal
 */
function parseSearchParams(searchParams: URLSearchParams): ParseResult {
  const rawQuery = searchParams.get('q') ?? '';
  const query = rawQuery.trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      errorResponse: NextResponse.json({ error: 'Query too long' }, { status: 400 }),
    };
  }

  const categories = parseList(searchParams.get('categories'));
  const origins = parseList(searchParams.get('origins'));
  const letters = parseList(searchParams.get('letters'));
  const dictionaries = parseList(searchParams.get('dictionaries'));
  const markerFilters = parseMarkerFilters(searchParams);
  const statusParam = searchParams.get('status');
  const assignedTo = parseList(searchParams.get('assignedTo'));

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const metaOnly = searchParams.get('meta') === 'true';

  return {
    filters: {
      query,
      categories,
      origins,
      letters,
      dictionaries,
      status: statusParam || undefined,
      assignedTo,
      ...markerFilters,
    },
    page,
    limit,
    metaOnly,
  };
}

/**
 * Maps marker keys to their database column names.
 * @internal
 */
const MARKER_COLUMN_NAMES: Record<MeaningMarkerKey, string> = {
  socialValuations: 'social_valuation',
  socialStratumMarkers: 'social_mark',
  styleMarkers: 'style_mark',
  intentionalityMarkers: 'inten_mark',
  geographicalMarkers: 'geo_mark',
  chronologicalMarkers: 'chrono_mark',
  frequencyMarkers: 'freq_mark',
};

/**
 * Fetches all unique marker values from the database.
 * @internal
 */
async function fetchMarkerMetadata(): Promise<MarkerMetadata> {
  const entries = await Promise.all(
    MEANING_MARKER_KEYS.map(async (key) => {
      const column = MARKER_COLUMN_NAMES[key];
      const query = sql.raw(
        `SELECT DISTINCT ${column} as marker FROM meanings WHERE ${column} IS NOT NULL`
      );
      const result = await db.execute<{ marker: string | null }>(query);
      const values = result.rows
        .map((row) => row.marker)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b, 'es'));
      return [key, values] as const;
    })
  );

  return Object.fromEntries(entries) as MarkerMetadata;
}

/** @internal */
function parseMarkerFilters(searchParams: URLSearchParams): MarkerFilterState {
  return MEANING_MARKER_KEYS.reduce((acc, key) => {
    acc[key] = parseList(searchParams.get(key)) ?? [];
    return acc;
  }, {} as MarkerFilterState);
}

/** @internal */
function extractMarkerFilters(filters: MarkerFilterState): MarkerFilterState {
  return MEANING_MARKER_KEYS.reduce((acc, key) => {
    const values = filters[key];
    if (values && values.length > 0) {
      acc[key] = values;
    }
    return acc;
  }, {} as MarkerFilterState);
}

/**
 * Parses a comma-separated string into an array.
 * @internal
 */
function parseList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
