/**
 * Server-side dictionary utilities.
 *
 * Provides functions for dictionary features that require direct database access,
 * such as the "Word of the Day" feature.
 *
 * @module lib/dictionary
 */

import { Word, SearchResult } from '@/lib/definitions';
import { getWordByLemma, searchWords } from '@/lib/queries';

/** Spanish alphabet including ñ */
const LETTERS = 'abcdefghijklmnñopqrstuvwxyz'.split('');

/** Cache for word of the day to avoid repeated queries */
const wordOfTheDayCache = new Map<string, { word: Word; letter: string }>();

/**
 * Gets a random word for the "Word of the Day" feature.
 *
 * Uses a deterministic selection based on the date so the same word
 * is shown to all users on the same day. Results are cached.
 *
 * @param date - The date to get the word for (defaults to today)
 * @returns Word and letter, or null if no words found
 */
export async function getWordOfTheDay(
  date: Date = new Date()
): Promise<{ word: Word; letter: string } | null> {
  try {
    const seed = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC based)

    if (wordOfTheDayCache.has(seed)) {
      return wordOfTheDayCache.get(seed)!;
    }

    const startIndex = hashSeed(seed) % LETTERS.length;

    let searchResults: SearchResult[] = [];
    let selectedLetter = LETTERS[startIndex];

    const idx = startIndex % LETTERS.length;
    const initialLetter = LETTERS[idx];

    // Search for published words only (status undefined = published)
    const initialSearch = await searchWords({
      letters: [initialLetter],
      status: undefined, // undefined means published only
      page: 1,
      pageSize: 1000,
    });
    searchResults = initialSearch.results;

    if (searchResults.length > 0) {
      selectedLetter = initialLetter;
    } else {
      selectedLetter = 'o';
      const fallbackSearch = await searchWords({
        letters: [selectedLetter],
        status: undefined, // undefined means published only
        page: 1,
        pageSize: 1000,
      });
      searchResults = fallbackSearch.results;
    }

    const pool = [...searchResults].sort((a, b) => a.word.lemma.localeCompare(b.word.lemma, 'es'));

    if (pool.length === 0) {
      throw new Error(
        `No se encontraron palabras para la fecha ${seed}. (letra=${selectedLetter}, filtros vacíos, Resultados=${searchResults.length})`
      );
    }

    const index = hashSeed(`${seed}:${selectedLetter}`) % pool.length;

    const chosen = pool[index];

    const detailed = await getWordByLemma(chosen.word.lemma);

    const fallbackWord = detailed
      ? { word: detailed.word, letter: detailed.letter }
      : { word: chosen.word, letter: chosen.letter };

    wordOfTheDayCache.set(seed, fallbackWord);
    return fallbackWord;
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a deterministic hash from a string seed.
 * Used for reproducible random selection based on date.
 * @internal
 */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
