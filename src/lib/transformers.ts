/**
 * Transformation functions to convert between database and frontend formats.
 *
 * This module handles the conversion of data between the raw database representation
 * (DBWord, raw Meaning) and the frontend-friendly formats (Word, normalized Meaning).
 *
 * @module lib/transformers
 */

import {
  DBWord,
  Meaning,
  Word,
  Example,
  MEANING_MARKER_KEYS,
  MeaningMarkerKey,
} from '@/lib/definitions';

/**
 * Transforms a database word record to the frontend Word format.
 *
 * - Normalizes meanings to ensure all marker fields are present
 * - Uses lemma as fallback for root if not specified
 *
 * @param dbWord - The raw database word record
 * @returns Frontend-compatible Word object
 */
export function dbWordToWord(dbWord: DBWord): Word {
  const normalizedMeanings: Meaning[] =
    dbWord.meanings?.map((meaning) => normalizeMeaning(meaning)) || [];

  return {
    lemma: dbWord.lemma,
    root: dbWord.root || dbWord.lemma,
    values: normalizedMeanings,
  };
}

/**
 * Normalizes a meaning by ensuring all optional fields have consistent values.
 * Converts undefined values to null for consistent handling.
 *
 * @param meaning - The raw meaning record
 * @returns Normalized meaning with all fields defined
 * @internal
 */
function normalizeMeaning(meaning: Meaning): Meaning {
  const markerValues = MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      acc[key] = meaning[key] ?? null;
      return acc;
    },
    {} as Record<MeaningMarkerKey, string | null>
  );

  const normalizedExamples: Example[] | null =
    meaning.examples && meaning.examples.length > 0 ? meaning.examples : null;

  return {
    ...meaning,
    ...markerValues,
    grammarCategory: meaning.grammarCategory || null,
    origin: meaning.origin || null,
    remission: meaning.remission || null,
    observation: meaning.observation || null,
    dictionary: meaning.dictionary || null,
    examples: normalizedExamples,
  };
}

/**
 * Transforms a database word to a SearchResult object.
 *
 * @param dbWord - The raw database word record
 * @param matchType - How the word matched the search query
 * @returns SearchResult object for use in search results list
 */
export function dbWordToSearchResult(
  dbWord: DBWord,
  matchType: 'exact' | 'partial' | 'filter' = 'filter'
) {
  const word = dbWordToWord(dbWord);
  return {
    word,
    letter: dbWord.letter,
    matchType,
    status: dbWord.status,
    assignedTo: dbWord.assignedTo ?? null,
    createdBy: dbWord.createdBy ?? null,
  };
}
