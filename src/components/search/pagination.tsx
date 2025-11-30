/**
 * Pagination component for search results.
 *
 * This component provides navigation controls for paginated content.
 * It displays page numbers with smart ellipsis handling for large
 * page counts, ensuring the UI stays clean and usable.
 *
 * ## Features
 *
 * ### Page Number Display
 * - Shows up to 7 page numbers at once
 * - Always shows first and last pages
 * - Uses ellipsis (...) for skipped ranges
 * - Highlights current page with primary color
 *
 * ### Navigation Buttons
 * - "Anterior" (Previous) button on left
 * - "Siguiente" (Next) button on right
 * - Disabled states when at boundaries
 *
 * ## Ellipsis Logic
 * - Small page counts (≤7): shows all pages
 * - Current near start: shows 1, 2, 3, 4, ..., last
 * - Current near end: shows 1, ..., n-3, n-2, n-1, n
 * - Current in middle: shows 1, ..., c-1, c, c+1, ..., last
 *
 * @module components/search/pagination
 * @see {@link Pagination} - The main exported component
 * @see {@link PaginationProps} - Props interface
 */

'use client';

/**
 * Props for the Pagination component.
 *
 * @interface PaginationProps
 */
export interface PaginationProps {
  /**
   * Current active page number (1-indexed).
   * @type {number}
   */
  currentPage: number;

  /**
   * Total number of pages available.
   * @type {number}
   */
  totalPages: number;

  /**
   * Callback fired when a page is selected.
   * @param {number} page - The new page number (1-indexed)
   * @returns {void}
   */
  onPageChange: (page: number) => void;

  /**
   * Whether there is a next page (currentPage < totalPages).
   * Controls the "Siguiente" button enabled state.
   * @type {boolean}
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page (currentPage > 1).
   * Controls the "Anterior" button enabled state.
   * @type {boolean}
   */
  hasPrev: boolean;
}

/**
 * Pagination controls with numbered pages and prev/next buttons.
 *
 * Renders a horizontal pagination bar with previous/next buttons
 * and clickable page numbers. Uses smart ellipsis for large page
 * counts to keep the UI manageable.
 *
 * @function Pagination
 * @param {PaginationProps} props - Component props
 * @param {number} props.currentPage - Current page (1-indexed)
 * @param {number} props.totalPages - Total page count
 * @param {Function} props.onPageChange - Page change callback
 * @param {boolean} props.hasNext - Has next page
 * @param {boolean} props.hasPrev - Has previous page
 * @returns {JSX.Element | null} Pagination bar or null if single page
 *
 * @example
 * // Basic usage
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   hasNext={true}
 *   hasPrev={true}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 *
 * @example
 * // With derived hasNext/hasPrev
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   hasNext={currentPage < totalPages}
 *   hasPrev={currentPage > 1}
 *   onPageChange={handlePageChange}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Página anterior"
      >
        Anterior
      </button>

      {/* Page Numbers */}
      <div className="flex gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-10 w-10 items-center justify-center text-gray-500"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-duech-blue text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-label={`Página ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </div>
  );
}
