import { NextRequest, NextResponse } from 'next/server';
import { searchWords } from '@/lib/queries';
import { SearchResult } from '@/lib/definitions';
import { applyRateLimit } from '@/lib/rate-limiting';
import { db } from '@/lib/db';
import { meanings } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { isEditorModeFromHeaders } from '@/lib/editor-mode-server';

const MAX_QUERY_LENGTH = 100;
const MAX_FILTER_OPTIONS = 10;
const MAX_LIMIT = 1000;

interface SearchFilters {
  query: string;
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
  status: string | undefined;
  assignedTo: string[];
}

interface ParseSuccess {
  filters: SearchFilters;
  page: number;
  limit: number;
  metaOnly: boolean;
}

interface ParseError {
  errorResponse: NextResponse;
}

type ParseResult = ParseSuccess | ParseError;

const MATCH_ORDER: Record<SearchResult['matchType'], number> = {
  exact: 0,
  partial: 1,
  filter: 2,
};

export async function GET(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(searchParams);
    const editorMode = isEditorModeFromHeaders(request.headers);

    if ('errorResponse' in parsed) {
      return parsed.errorResponse;
    }

    const { filters, page, limit, metaOnly } = parsed;

    // Get metadata from database
    const categoriesResult = await db.execute<{ category: string }>(
      sql`SELECT DISTINCT UNNEST(categories) as category FROM meanings WHERE categories IS NOT NULL`
    );

    const stylesResult = await db.execute<{ style: string }>(
      sql`SELECT DISTINCT UNNEST(styles) as style FROM meanings WHERE styles IS NOT NULL`
    );

    const originsResult = await db.selectDistinct({ origin: meanings.origin }).from(meanings);

    const metadata = {
      categories: categoriesResult.rows
        .map((r) => r.category)
        .filter((c) => c != null)
        .sort((a, b) => a.localeCompare(b, 'es')),
      styles: stylesResult.rows
        .map((r) => r.style)
        .filter((s) => s != null)
        .sort((a, b) => a.localeCompare(b, 'es')),
      origins: originsResult
        .map((r) => r.origin)
        .filter((o) => o != null)
        .sort((a, b) => a!.localeCompare(b!, 'es')) as string[],
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
      // Search in database using advanced search
      const results = await searchWords({
        query: filters.query || undefined,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        styles: filters.styles.length > 0 ? filters.styles : undefined,
        origins: filters.origins.length > 0 ? filters.origins : undefined,
        letter: filters.letters.length > 0 ? filters.letters[0] : undefined,
        status: filters.status || undefined,
        assignedTo: filters.assignedTo.length > 0 ? filters.assignedTo : undefined,
        editorMode,
        limit: MAX_LIMIT,
      });

      // Sort results by match type
      const sortedResults = results.sort(
        (a, b) => MATCH_ORDER[a.matchType] - MATCH_ORDER[b.matchType]
      );

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedResults = sortedResults.slice(startIndex, endIndex);

      pagination = {
        page,
        limit,
        total: sortedResults.length,
        totalPages: Math.ceil(sortedResults.length / limit),
        hasNext: endIndex < sortedResults.length,
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

function parseSearchParams(searchParams: URLSearchParams): ParseResult {
  const rawQuery = searchParams.get('q') ?? '';
  const query = rawQuery.trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      errorResponse: NextResponse.json({ error: 'Query too long' }, { status: 400 }),
    };
  }

  const categories = parseList(searchParams.get('categories'));
  const styles = parseList(searchParams.get('styles'));
  const origins = parseList(searchParams.get('origins'));
  const letters = parseList(searchParams.get('letters'));
  const statusParam = searchParams.get('status');
  // If status is explicitly provided (even as empty), use it. Otherwise undefined means show all.
  const status = statusParam !== null ? statusParam : undefined;
  const assignedTo = parseList(searchParams.get('assignedTo'));

  if (
    categories.length > MAX_FILTER_OPTIONS ||
    styles.length > MAX_FILTER_OPTIONS ||
    origins.length > MAX_FILTER_OPTIONS ||
    letters.length > MAX_FILTER_OPTIONS ||
    assignedTo.length > MAX_FILTER_OPTIONS
  ) {
    return {
      errorResponse: NextResponse.json({ error: 'Too many filter options' }, { status: 400 }),
    };
  }

  const metaOnlyParam = searchParams.get('metaOnly');
  const metaOnly = metaOnlyParam === 'true' || metaOnlyParam === '1';

  const page = Math.max(parseInteger(searchParams.get('page'), 1), 1);
  const limit = Math.max(Math.min(parseInteger(searchParams.get('limit'), 20), MAX_LIMIT), 1);

  if (!Number.isFinite(page) || !Number.isFinite(limit)) {
    return {
      errorResponse: NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 }),
    };
  }

  const filters: SearchFilters = {
    query,
    categories,
    styles,
    origins,
    letters,
    status,
    assignedTo,
  };

  return { filters, page, limit, metaOnly };
}

function parseList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseInteger(input: string | null, fallback: number): number {
  if (!input) return fallback;
  const parsed = parseInt(input, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
