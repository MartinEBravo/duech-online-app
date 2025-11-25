/**
 * Transformation functions to convert between DB format and frontend format
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
 * Transform a DBWord (from database) to Word (frontend format)
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

function normalizeMeaning(meaning: Meaning): Meaning {
  const markerValues = MEANING_MARKER_KEYS.reduce((acc, key) => {
    acc[key] = meaning[key] ?? null;
    return acc;
  }, {} as Record<MeaningMarkerKey, string | null>);

  const normalizedExamples: Example[] | null = meaning.examples && meaning.examples.length > 0
    ? meaning.examples
    : null;

  return {
    ...meaning,
    ...markerValues,
    grammarCategory: meaning.grammarCategory || null,
    origin: meaning.origin || null,
    remission: meaning.remission || null,
    observation: meaning.observation || null,
    examples: normalizedExamples,
  };
}

/**
 * Transform DBWord with its letter to SearchResult-compatible format
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
