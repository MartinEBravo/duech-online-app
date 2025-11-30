/**
 * Word of the day display component.
 *
 * Shows a featured word with its first definition on the homepage.
 *
 * @module components/word-of-the-day
 */

'use client';

import { usePathname } from 'next/navigation';
import { GRAMMATICAL_CATEGORIES, type Word } from '@/lib/definitions';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import { ArrowRightIcon, BookOpenIcon } from '@/components/icons';
import { Button } from '@/components/common/button';
import { ChipList } from '@/components/common/chip';

/**
 * Data structure for word of the day.
 */
export interface WordOfTheDayData {
  /** The featured word */
  word: Word;
  /** Word's letter classification */
  letter: string;
}

/**
 * Props for the WordOfTheDay component.
 */
export interface WordOfTheDayProps {
  /** Word data to display (null if none available) */
  data: WordOfTheDayData | null;
  /** Whether in editor mode */
  editorMode?: boolean;
}

/**
 * Displays the featured word of the day.
 *
 * Shows word lemma, grammar category, truncated definition,
 * and a link to view the full entry.
 *
 * @example
 * ```tsx
 * <WordOfTheDay data={wordOfTheDay} editorMode={false} />
 * ```
 */
export default function WordOfTheDay({ data, editorMode = false }: WordOfTheDayProps) {
  const pathname = usePathname();
  const editorBasePath = editorMode && pathname.startsWith('/editor') ? '/editor' : '';

  if (!data) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-md">
        <p className="text-gray-700">Aún no hay una palabra destacada para mostrar.</p>
      </div>
    );
  }

  const { word } = data;
  const firstDefinition = word.values[0];
  const shortMeaning =
    firstDefinition.meaning.length > 150
      ? `${firstDefinition.meaning.substring(0, 150)}...`
      : firstDefinition.meaning;

  const viewHref = `${editorBasePath || ''}/palabra/${encodeURIComponent(word.lemma)}`;

  return (
    <div className="border-duech-gold card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
      <h2 className="text-duech-gold mb-6 flex items-center text-2xl font-bold">
        <BookOpenIcon className="text-duech-blue mr-3 h-8 w-8" />
        Palabra del Día
      </h2>
      <div className="mb-6">
        <h3 className="text-duech-blue mb-3 text-3xl font-bold">{word.lemma}</h3>
        {firstDefinition.grammarCategory && (
          <div className="mb-4">
            <ChipList
              items={[firstDefinition.grammarCategory]}
              labels={GRAMMATICAL_CATEGORIES}
              variant="category"
              editorMode={editorMode}
            />
          </div>
        )}
      </div>

      <div className="mb-6 text-lg leading-relaxed text-gray-800">
        <MarkdownRenderer content={shortMeaning} />
      </div>

      <Button
        href={viewHref}
        className="bg-duech-gold px-6 py-3 font-semibold text-gray-900 shadow-md hover:bg-yellow-500"
      >
        Ver definición completa
        <ArrowRightIcon className="ml-2 h-5 w-5 text-gray-900" />
      </Button>
    </div>
  );
}
