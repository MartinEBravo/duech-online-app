/**
 * Database query functions using Drizzle ORM
 */

import { eq, ilike, or, and, sql, SQL, isNotNull, asc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { words, meanings, users, passwordResetTokens, examples } from '@/lib/schema';
import {
  Word,
  SearchResult,
  WordNote,
  MarkerFilterState,
  MEANING_MARKER_KEYS,
} from '@/lib/definitions';
import { dbWordToWord, dbWordToSearchResult } from '@/lib/transformers';

/**
 * Common word columns for queries
 */
const WORD_COLUMNS = {
  id: true,
  lemma: true,
  root: true,
  letter: true,
  variant: true,
  status: true,
  createdBy: true,
  assignedTo: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Common meanings relation config with examples
 */
const MEANINGS_WITH_EXAMPLES = {
  meanings: {
    orderBy: (meaningsTable: typeof meanings, { asc }: { asc: typeof import('drizzle-orm').asc }) => [asc(meaningsTable.number)],
    with: {
      examples: true,
    },
  },
} as const;

/**
 * Get a word by lemma with all its meanings
 * Returns in frontend-compatible format
 */
interface GetWordByLemmaOptions {
  includeDrafts?: boolean;
}

export async function getWordByLemma(
  lemma: string,
  options: GetWordByLemmaOptions = {}
): Promise<{
  word: Word;
  letter: string;
  status: string;
  assignedTo: number | null;
  createdBy: number | null;
  wordId: number;
  comments: WordNote[];
} | null> {
  const { includeDrafts = false } = options;

  const whereCondition = includeDrafts
    ? eq(words.lemma, lemma)
    : and(eq(words.lemma, lemma), eq(words.status, 'published'));

  const result = await db.query.words.findFirst({
    where: whereCondition,
    columns: WORD_COLUMNS,
    with: {
      ...MEANINGS_WITH_EXAMPLES,
      notes: {
        orderBy: (notesTable, { desc }) => [desc(notesTable.createdAt)],
        with: {
          user: true,
        },
      },
    },
  });

  if (!result) return null;

  return {
    word: dbWordToWord(result),
    letter: result.letter,
    status: result.status,
    assignedTo: result.assignedTo ?? null,
    createdBy: result.createdBy ?? null,
    wordId: result.id,
    comments:
      result.notes?.map((note) => ({
        id: note.id,
        note: note.note,
        createdAt: note.createdAt.toISOString(),
        user: note.user
          ? {
            id: note.user.id,
            username: note.user.username,
          }
          : null,
      })) ?? [],
  };
}

const MARKER_COLUMN_MAP = {
  socialValuations: meanings.socialValuations,
  socialStratumMarkers: meanings.socialStratumMarkers,
  styleMarkers: meanings.styleMarkers,
  intentionalityMarkers: meanings.intentionalityMarkers,
  geographicalMarkers: meanings.geographicalMarkers,
  chronologicalMarkers: meanings.chronologicalMarkers,
  frequencyMarkers: meanings.frequencyMarkers,
} as const;

type SearchWordsParams = {
  query?: string;
  categories?: string[];
  origins?: string[];
  letters?: string[];
  dictionaries?: string[];
  status?: string;
  assignedTo?: string[];
  editorMode?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
} & MarkerFilterState;

export async function searchWords(params: SearchWordsParams): Promise<{
  results: SearchResult[];
  total: number;
}> {
  const {
    query,
    categories,
    origins,
    letters,
    dictionaries,
    status,
    assignedTo,
    editorMode,
    page = 1,
    pageSize = 25,
  } = params;

  const markerFilters = MEANING_MARKER_KEYS.reduce((acc, key) => {
    const values = params[key];
    if (values && values.length > 0) {
      acc[key] = values;
    }
    return acc;
  }, {} as MarkerFilterState);

  const conditions: SQL[] = [];

  if (!editorMode) {
    conditions.push(eq(words.status, 'published'));
  } else if (status && status !== '') {
    conditions.push(eq(words.status, status));
  }

  if (assignedTo && assignedTo.length > 0) {
    const assignedToIds = assignedTo.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    if (assignedToIds.length > 0) {
      conditions.push(or(...assignedToIds.map((id) => eq(words.assignedTo, id)))!);
    }
  }

  let normalizedQuery: string | null = null;
  let prefixPattern: string | null = null;
  let inlinePattern: string | null = null;
  let containsPattern: string | null = null;

  if (query) {
    normalizedQuery = query.trim();
    if (normalizedQuery.length > 0) {
      prefixPattern = `${normalizedQuery}%`;
      inlinePattern = `% ${normalizedQuery}%`;
      containsPattern = `%${normalizedQuery}%`;
      conditions.push(
        or(
          sql`unaccent(lower(${words.lemma})) LIKE unaccent(lower(${prefixPattern}))`,
          sql`unaccent(lower(${words.lemma})) LIKE unaccent(lower(${inlinePattern}))`,
          sql`unaccent(lower(${words.lemma})) LIKE unaccent(lower(${containsPattern}))`
        )!
      );
    } else {
      normalizedQuery = null;
    }
  }

  if (letters && letters.length > 0) {
    conditions.push(or(...letters.map((letter) => eq(words.letter, letter.toLowerCase())))!);
  }

  if (origins && origins.length > 0) {
    conditions.push(or(...origins.map((origin) => ilike(meanings.origin, `%${origin}%`)))!);
  }

  if (dictionaries && dictionaries.length > 0) {
    conditions.push(or(...dictionaries.map((dict) => eq(meanings.dictionary, dict)))!);
  }

  if (categories && categories.length > 0) {
    conditions.push(or(...categories.map((cat) => eq(meanings.grammarCategory, cat)))!);
  }

  for (const key of MEANING_MARKER_KEYS) {
    const values = markerFilters[key];
    if (values && values.length > 0) {
      const column = MARKER_COLUMN_MAP[key];
      conditions.push(or(...values.map((value) => eq(column, value)))!);
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(distinct ${words.id})` })
    .from(words)
    .leftJoin(meanings, eq(words.id, meanings.wordId))
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  const offset = (page - 1) * pageSize;
  const alphabeticalOrderExpression = sql`unaccent(lower(${words.lemma}))`;
  const matchPriorityExpression =
    normalizedQuery && prefixPattern && inlinePattern && containsPattern
      ? sql<number>`
          CASE
            WHEN unaccent(lower(${words.lemma})) = unaccent(lower(${normalizedQuery})) THEN 0
            WHEN unaccent(lower(${words.lemma})) LIKE unaccent(lower(${prefixPattern})) THEN 1
            WHEN unaccent(lower(${words.lemma})) LIKE unaccent(lower(${inlinePattern})) THEN 2
            WHEN unaccent(lower(${words.lemma})) LIKE unaccent(lower(${containsPattern})) THEN 3
            ELSE 4
          END
        `
      : sql<number>`4`;

  const results = await db
    .select({
      id: words.id,
      lemma: words.lemma,
      root: words.root,
      letter: words.letter,
      variant: words.variant,
      status: words.status,
      createdBy: words.createdBy,
      assignedTo: words.assignedTo,
      createdAt: words.createdAt,
      updatedAt: words.updatedAt,
    })
    .from(words)
    .leftJoin(meanings, eq(words.id, meanings.wordId))
    .where(whereClause)
    .groupBy(
      words.id,
      words.lemma,
      words.root,
      words.letter,
      words.variant,
      words.status,
      words.createdBy,
      words.assignedTo,
      words.createdAt,
      words.updatedAt
    )
    .orderBy(matchPriorityExpression, alphabeticalOrderExpression)
    .limit(pageSize)
    .offset(offset);

  const wordIds = results.map((w) => w.id);

  const fullWords = await db.query.words.findMany({
    where: (words, { inArray }) => inArray(words.id, wordIds),
    with: {
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
  });

  const wordMap = new Map(fullWords.map((w) => [w.id, w]));

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  type MatchCategory = 'exact' | 'prefix' | 'inline' | 'partial' | 'filter';
  const bucketOrder: MatchCategory[] = ['exact', 'prefix', 'inline', 'partial', 'filter'];

  const wordsWithMeanings = results.map((w) => {
    const fullWord = wordMap.get(w.id);
    let matchType: MatchCategory = 'filter';

    if (query && fullWord) {
      const normalizedQueryForMatch = normalize(query);
      const lemma = normalize(fullWord.lemma);

      if (normalizedQueryForMatch.length === 0) {
        matchType = 'filter';
      } else if (lemma === normalizedQueryForMatch) {
        matchType = 'exact';
      } else if (lemma.startsWith(normalizedQueryForMatch)) {
        matchType = 'prefix';
      } else {
        const tokens = lemma.split(/\s+/).map((token) => token.replace(/^[^a-z0-9]+/i, ''));
        const hasInlineMatch = tokens.some((token) => token.startsWith(normalizedQueryForMatch));

        if (hasInlineMatch) {
          matchType = 'inline';
        } else if (lemma.includes(normalizedQueryForMatch)) {
          matchType = 'partial';
        }
      }
    }

    return { fullWord, matchType };
  });

  const compareLemma = (
    a: { fullWord: (typeof fullWords)[number] | undefined },
    b: { fullWord: (typeof fullWords)[number] | undefined }
  ) => {
    const lemmaA = a.fullWord!.lemma;
    const lemmaB = b.fullWord!.lemma;
    return lemmaA.localeCompare(lemmaB, 'es', { sensitivity: 'base' });
  };

  const orderedResults = bucketOrder.flatMap((bucket) =>
    wordsWithMeanings
      .filter((entry) => entry.fullWord && entry.matchType === bucket)
      .sort(compareLemma)
  );

  const finalResults = orderedResults.map((w) => {
    const mappedMatch: 'filter' | 'partial' | 'exact' | undefined =
      w.matchType === 'exact'
        ? 'exact'
        : w.matchType === 'partial' || w.matchType === 'prefix' || w.matchType === 'inline'
          ? 'partial'
          : 'filter';

    return dbWordToSearchResult(w.fullWord!, mappedMatch);
  });

  return {
    results: finalResults,
    total,
  };
}

/**
 * USER AUTHENTICATION QUERIES
 */

/**
 * Find user by username (case-insensitive)
 */
export async function getUserByUsername(username: string) {
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Find user by email (case-insensitive)
 */
export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyUserPassword(
  dbPasswordHash: string,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, dbPasswordHash);
}

/**
 * Get all users (without sensitive data)
 */
export async function getUsers() {
  return await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Create a new user
 */
export async function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  role: string;
}) {
  const result = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  return result[0];
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: number,
  data: {
    username?: string;
    email?: string;
    role?: string;
    passwordHash?: string;
    currentSessionId?: string | null;
  }
) {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      updatedAt: users.updatedAt,
    });

  return result[0];
}

/**
 * Update user's current session ID
 */
export async function updateUserSessionId(userId: number, sessionId: string) {
  await db
    .update(users)
    .set({
      currentSessionId: sessionId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Delete a user
 */
export async function deleteUser(userId: number) {
  const result = await db.delete(users).where(eq(users.id, userId)).returning({
    id: users.id,
    username: users.username,
  });

  return result[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      currentSessionId: users.currentSessionId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(userId: number, token: string) {
  const result = await db
    .insert(passwordResetTokens)
    .values({
      userId,
      token,
    })
    .returning({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      token: passwordResetTokens.token,
      createdAt: passwordResetTokens.createdAt,
    });

  return result[0];
}

/**
 * Get password reset token and associated user
 */
export async function getPasswordResetToken(token: string) {
  const result = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
    with: {
      user: true,
    },
  });

  return result;
}

/**
 * Delete a password reset token
 */
export async function deletePasswordResetToken(token: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
}

/**
 * Get all words with "redacted" status, including their meanings and notes
 */
export async function getRedactedWords() {
  return db.query.words.findMany({
    where: (table, { eq }) => eq(table.status, 'redacted'),
    with: {
      notes: {
        with: {
          user: true,
        },
      },
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
    orderBy: (table, { asc }) => [asc(table.lemma)],
  });
}

/**
 * Get unique sources from examples for the bibliography dropdown
 */
export async function getUniqueSources() {
  return await db
    .selectDistinct({
      publication: examples.publication,
      author: examples.author,
      year: examples.year,
      city: examples.city,
      editorial: examples.editorial,
      format: examples.format,
    })
    .from(examples)
    .where(isNotNull(examples.publication))
    .orderBy(asc(examples.publication));
}

/**
 * Get words that have examples from a specific publication/source
 */
export async function getWordsBySource(publication: string): Promise<SearchResult[]> {
  // Find all word IDs that have examples with this publication
  const wordIdsResult = await db
    .selectDistinct({ wordId: meanings.wordId })
    .from(examples)
    .innerJoin(meanings, eq(examples.meaningId, meanings.id))
    .where(eq(examples.publication, publication));

  if (wordIdsResult.length === 0) {
    return [];
  }

  const wordIds = wordIdsResult.map((r) => r.wordId);

  // Fetch full word data for these IDs
  const results = await db.query.words.findMany({
    where: sql`${words.id} IN (${sql.join(
      wordIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
    columns: WORD_COLUMNS,
    with: MEANINGS_WITH_EXAMPLES,
    orderBy: (table, { asc }) => [asc(table.lemma)],
  });

  return results.map((result) => dbWordToSearchResult(result));
}
