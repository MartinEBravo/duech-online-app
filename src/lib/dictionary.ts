import { Word, SearchResult } from '@/lib/definitions';
import { getWordByLemma, searchWords } from '@/lib/queries';

const LETTERS = 'abcdefghijklmnñopqrstuvwxyz'.split('');
const wordOfTheDayCache = new Map<string, { word: Word; letter: string }>();

/**
 * Get a random word for "Word of the Day"
 * Server-only function that directly queries the database.
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

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
