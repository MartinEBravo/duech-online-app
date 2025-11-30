/**
 * UI Components for search results display.
 *
 * Provides skeleton loaders, empty states, and result count display
 * for the search page.
 *
 * @module components/search/search-results-components
 */

import { SadFaceIcon, SearchIcon } from '@/components/icons';
import { WordCard } from '@/components/search/word-card';
import { type SearchResult } from '@/lib/definitions';

/**
 * Props for the SearchLoadingSkeleton component.
 */
export interface SearchLoadingSkeletonProps {
  /** Whether in editor mode (affects skeleton count) */
  editorMode: boolean;
  /** Number of skeleton items to show */
  count?: number;
}

/**
 * Loading skeleton displayed while search is in progress
 */
export function SearchLoadingSkeleton({ editorMode, count = 5 }: SearchLoadingSkeletonProps) {
  const itemCount = editorMode ? count : 3;

  return (
    <div className="space-y-4">
      {[...Array(itemCount)].map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-lg bg-white ${editorMode ? 'p-4' : 'p-6'} shadow`}
        >
          <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
          <div className={`${editorMode ? '' : 'mb-2'} h-4 w-3/4 rounded bg-gray-200`}></div>
          {!editorMode && <div className="h-4 w-1/2 rounded bg-gray-200"></div>}
        </div>
      ))}
    </div>
  );
}

/**
 * Props for the EmptySearchState component.
 */
export interface EmptySearchStateProps {
  /** Whether in editor mode (affects message) */
  editorMode: boolean;
}

/**
 * Empty state shown when no search has been performed yet
 */
export function EmptySearchState({ editorMode }: EmptySearchStateProps) {
  return (
    <div className="rounded-lg bg-white p-12 text-center shadow">
      <SearchIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">
        {editorMode ? 'Busca palabras para editar' : 'Busca palabras en el diccionario'}
      </h3>
      <p className="text-gray-600">
        Usa la búsqueda avanzada arriba para encontrar palabras por categorías, estilos, origen o
        letra.
      </p>
    </div>
  );
}

/**
 * Props for the NoResultsState component.
 */
export interface NoResultsStateProps {
  /** Whether in editor mode (affects styling) */
  editorMode: boolean;
}

/**
 * Empty state shown when search returns no results
 */
export function NoResultsState({ editorMode }: NoResultsStateProps) {
  return (
    <div className={`rounded-lg bg-white ${editorMode ? 'p-12' : 'p-8'} text-center shadow`}>
      <SadFaceIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron resultados</h3>
      <p className="text-gray-600">
        Ajusta tu término de búsqueda o modifica las opciones avanzadas.
      </p>
    </div>
  );
}

/**
 * Props for the SearchResultsCount component.
 */
export interface SearchResultsCountProps {
  /** Whether in editor mode (affects message format) */
  editorMode: boolean;
  /** Total number of results */
  totalResults: number;
  /** Search query string */
  query: string;
  /** Current page number */
  currentPage?: number;
  /** Results per page */
  pageSize?: number;
}

/**
 * Display count of search results
 */
export function SearchResultsCount({
  editorMode,
  totalResults,
  query,
  currentPage = 1,
  pageSize = 25,
}: SearchResultsCountProps) {
  const trimmedQuery = query.trim();

  const getMessage = () => {
    if (totalResults === 0) {
      return 'No se encontraron resultados con los criterios seleccionados';
    }

    // Calculate range for current page
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalResults);
    const rangeText = totalResults > pageSize ? `Mostrando ${start}-${end} de ` : '';

    if (editorMode) {
      return `${rangeText}${totalResults} palabra${totalResults !== 1 ? 's' : ''}`;
    }

    const baseMessage = `${rangeText}${totalResults} resultado${totalResults !== 1 ? 's' : ''}`;
    return trimmedQuery && totalResults > 0 ? `${baseMessage} para "${trimmedQuery}"` : baseMessage;
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="mb-6 text-gray-600">{getMessage()}</p>
    </div>
  );
}

interface WordResultsListProps {
  results: SearchResult[];
  editorMode?: boolean;
  currentUserId?: number | null;
  currentUserRole?: string | null;
}

/**
 * Reusable list component for displaying word search results
 */
export function WordResultsList({
  results,
  editorMode = false,
  currentUserId,
  currentUserRole,
}: WordResultsListProps) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <WordCard
          key={`${result.word.lemma}-${index}`}
          lemma={result.word.lemma}
          letter={result.letter}
          editorMode={editorMode}
          root={editorMode ? result.word.root : undefined}
          status={editorMode ? result.status : undefined}
          createdBy={editorMode ? result.createdBy : undefined}
          definitionsCount={editorMode ? result.word.values.length : undefined}
          assignedTo={editorMode ? result.assignedTo : undefined}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          dictionary={result.word.values[0]?.dictionary}
        />
      ))}
    </div>
  );
}
