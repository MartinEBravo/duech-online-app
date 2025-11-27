import 'server-only';
import { db } from '@/lib/db';
import { words, meanings, notes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { Word, Example, MeaningMarkerKey } from '@/lib/definitions';
import { MEANING_MARKER_KEYS } from '@/lib/definitions';

/**
 * Clean example data by removing undefined fields
 */
function cleanExample(ex: Example) {
  return {
    value: ex.value,
    ...(ex.author !== undefined && { author: ex.author }),
    ...(ex.title !== undefined && { title: ex.title }),
    ...(ex.source !== undefined && { source: ex.source }),
    ...(ex.date !== undefined && { date: ex.date }),
    ...(ex.page !== undefined && { page: ex.page }),
  };
}

/**
 * Normalize examples to array and clean them
 */
function normalizeAndCleanExamples(examples: Example[] | null | undefined) {
  if (!examples || examples.length === 0) {
    return [] as ReturnType<typeof cleanExample>[];
  }
  return examples.map(cleanExample);
}

/**
 * Insert a meaning into the database
 */
async function insertMeaning(wordId: number, def: Word['values'][number]) {
  const cleanedExamples = normalizeAndCleanExamples(def.examples);
  const markerValues = MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      const value = def[key as MeaningMarkerKey];
      acc[key] = value || null;
      return acc;
    },
    {} as Record<MeaningMarkerKey, string | null>
  );

  await db.insert(meanings).values({
    wordId,
    number: def.number,
    origin: def.origin || null,
    meaning: def.meaning,
    observation: def.observation || null,
    remission: def.remission || null,
    grammarCategory: def.grammarCategory || null,
    dictionary: def.dictionary || null,
    ...markerValues,
    examples: cleanedExamples.length > 0 ? cleanedExamples : null,
  });
}

/**
 * Update a word and all its meanings
 */
export async function updateWordByLemma(
  prevLemma: string,
  updatedWord: Word,
  options?: { status?: string; assignedTo?: number | null }
) {
  // Find the word by lemma
  const existingWord = await db.query.words.findFirst({
    where: eq(words.lemma, prevLemma),
  });

  if (!existingWord) {
    throw new Error(`Word not found: ${prevLemma}`);
  }

  // Update word metadata (lemma, root, and optionally status/assignedTo)
  const updateData: Partial<typeof words.$inferInsert> = {
    lemma: updatedWord.lemma,
    root: updatedWord.root || null,
    updatedAt: new Date(),
  };

  if (options?.status !== undefined) {
    updateData.status = options.status;
  }

  if (options?.assignedTo !== undefined) {
    updateData.assignedTo = options.assignedTo;
  }

  await db.update(words).set(updateData).where(eq(words.id, existingWord.id));

  // Delete all existing meanings for this word
  await db.delete(meanings).where(eq(meanings.wordId, existingWord.id));

  // Insert new meanings
  for (const def of updatedWord.values) {
    await insertMeaning(existingWord.id, def);
  }

  return { success: true };
}

/**
 * Create a new word with its meanings
 */
interface CreateWordOptions {
  createdBy?: number | null;
  assignedTo?: number | null;
  letter?: string | null;
  status?: string;
}

export async function createWord(newWord: Word, options: CreateWordOptions = {}) {
  // Normalize core fields
  const normalizedLemma = newWord.lemma.trim();
  if (!normalizedLemma) {
    throw new Error('El lema es obligatorio');
  }

  const normalizedRoot = (newWord.root || '').trim();
  const requestedLetter = options.letter?.trim();
  const normalizedLetter = (requestedLetter?.[0] || normalizedLemma[0] || 'a').toLowerCase();
  const assignedTo = options.assignedTo ?? null;
  const createdBy = options.createdBy ?? null;
  const status = options.status ?? 'included';

  // Prevent duplicate lemmas
  const existing = await db.query.words.findFirst({
    where: eq(words.lemma, normalizedLemma),
  });

  if (existing) {
    throw new Error(`Ya existe una palabra con el lema "${normalizedLemma}"`);
  }

  // Insert the word
  const [wordRecord] = await db
    .insert(words)
    .values({
      lemma: normalizedLemma,
      root: normalizedRoot || null,
      letter: normalizedLetter,
      status,
      createdBy,
      assignedTo,
    })
    .returning();

  // Insert meanings
  for (const def of newWord.values) {
    await insertMeaning(wordRecord.id, def);
  }

  return { success: true, wordId: wordRecord.id, lemma: normalizedLemma, letter: normalizedLetter };
}

/**
 * Delete a word by lemma (cascade delete will remove meanings)
 */
export async function deleteWordByLemma(lemma: string) {
  const existingWord = await db.query.words.findFirst({
    where: eq(words.lemma, lemma),
  });

  if (!existingWord) {
    throw new Error(`Word not found: ${lemma}`);
  }

  await db.delete(words).where(eq(words.id, existingWord.id));
  return { success: true };
}

/**
 * Add a note (comment) to a word identified by lemma
 */
export async function addNoteToWord(lemma: string, noteValue: string, userId: number | null) {
  const existingWord = await db.query.words.findFirst({
    where: eq(words.lemma, lemma),
    columns: { id: true },
  });

  if (!existingWord) {
    throw new Error(`Word not found: ${lemma}`);
  }

  const [inserted] = await db
    .insert(notes)
    .values({
      wordId: existingWord.id,
      note: noteValue,
      userId,
    })
    .returning({ id: notes.id });

  const created = await db.query.notes.findFirst({
    where: eq(notes.id, inserted.id),
    with: {
      user: true,
    },
  });

  if (!created) {
    throw new Error('Failed to retrieve the created note');
  }

  return created;
}
