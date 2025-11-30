/**
 * Word card component for search results.
 *
 * This component displays a word entry as a card in search results.
 * It adapts its layout and features based on whether it's in public
 * or editor mode, showing different information and actions.
 *
 * ## Public Mode
 * - Simple card design with lemma and arrow icon
 * - Entire card is clickable, links to word page
 * - Dictionary color-coded background (amber, white, etc.)
 * - Hover effects for visual feedback
 *
 * ## Editor Mode
 * - Expanded card with additional metadata
 * - Shows: lemma, letter badge, dictionary badge, root word
 * - Displays definition count and status badge
 * - Action buttons: Edit/Comment (based on permissions), View (if published)
 *
 * ## Permission Logic
 * - Superadmin: always can edit
 * - Admin: always can edit
 * - Creator: can edit if they created the word
 * - Assigned: can edit if assigned to them
 * - Others: can only comment
 *
 * @module components/search/word-card
 * @see {@link WordCard} - The main exported component
 * @see {@link WordCardProps} - Props interface
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightCircleIcon, EyeIcon, PencilIcon } from '@/components/icons';
import { STATUS_OPTIONS, DICTIONARY_COLORS } from '@/lib/definitions';
import { Button } from '@/components/common/button';

/**
 * Props for the WordCard component.
 *
 * @interface WordCardProps
 */
export interface WordCardProps {
  /**
   * The word's lemma (headword).
   * @type {string}
   */
  lemma: string;

  /**
   * The letter this word is filed under (a-z, ñ).
   * @type {string}
   */
  letter: string;

  /**
   * Whether to show editor mode layout with extra metadata.
   * @type {boolean}
   * @default false
   */
  editorMode?: boolean;

  /**
   * The word's root form (only shown in editor mode).
   * @type {string}
   */
  root?: string;

  /**
   * Word status (draft, preredacted, published, etc.).
   * Only used in editor mode for status badge.
   * @type {string}
   */
  status?: string;

  /**
   * User ID of the person who created this word.
   * Used for permission checks.
   * @type {number | null}
   */
  createdBy?: number | null;

  /**
   * Number of definitions/meanings for this word.
   * @type {number}
   */
  definitionsCount?: number;

  /**
   * Additional CSS classes for the card container.
   * @type {string}
   */
  className?: string;

  /**
   * User ID of person assigned to edit this word.
   * @type {number | null}
   */
  assignedTo?: number | null;

  /**
   * Current logged-in user's ID for permission checks.
   * @type {number | null}
   */
  currentUserId?: number | null;

  /**
   * Current logged-in user's role for permission checks.
   * @type {string | null}
   */
  currentUserRole?: string | null;

  /**
   * Dictionary source for color-coding the card.
   * @type {string | null}
   */
  dictionary?: string | null;
}

/**
 * Card displaying a word in search results.
 *
 * Renders different layouts for public and editor modes.
 * In editor mode, shows additional metadata and action buttons
 * based on the user's permissions.
 *
 * @function WordCard
 * @param {WordCardProps} props - Component props
 * @param {string} props.lemma - The word's headword
 * @param {string} props.letter - Filing letter
 * @param {boolean} [props.editorMode=false] - Enable editor layout
 * @param {string} [props.root] - Root word form
 * @param {string} [props.status] - Word status
 * @param {number | null} [props.createdBy] - Creator's user ID
 * @param {number} [props.definitionsCount] - Number of definitions
 * @param {string} [props.className] - Additional CSS classes
 * @param {number | null} [props.assignedTo] - Assigned user ID
 * @param {number | null} [props.currentUserId] - Current user's ID
 * @param {string | null} [props.currentUserRole] - Current user's role
 * @param {string | null} [props.dictionary] - Dictionary source
 * @returns {JSX.Element} Word card element
 *
 * @example
 * // Public mode - simple clickable card
 * <WordCard lemma="chilenismo" letter="c" />
 *
 * @example
 * // Editor mode with full permissions
 * <WordCard
 *   lemma="chilenismo"
 *   letter="c"
 *   editorMode={true}
 *   status="preredacted"
 *   definitionsCount={3}
 *   dictionary="DUECh"
 *   currentUserId={1}
 *   currentUserRole="admin"
 * />
 *
 * @example
 * // Editor mode - read-only (not assigned)
 * <WordCard
 *   lemma="chilenismo"
 *   letter="c"
 *   editorMode={true}
 *   status="draft"
 *   assignedTo={5}
 *   currentUserId={3}
 *   currentUserRole="lexicographer"
 * />
 */
export function WordCard({
  lemma,
  letter,
  editorMode = false,
  root,
  status,
  createdBy,
  definitionsCount,
  className = '',
  assignedTo,
  currentUserId,
  currentUserRole,
  dictionary,
}: WordCardProps) {
  const pathname = usePathname();
  const editorBasePath = pathname.startsWith('/editor') ? '/editor' : '';
  const isAdmin = currentUserRole === 'admin';
  const isCreator = createdBy === currentUserId;
  const isSAdmin = currentUserRole === 'superadmin';

  // Editor can edit if:
  // - Superadmin → always allowed
  // - Admin → always allowed
  // - Creator → allowed
  // - Assigned → allowed
  const canEdit =
    isSAdmin ||
    isAdmin ||
    (isCreator && !!assignedTo) ||
    (!!currentUserId && !!assignedTo && currentUserId === assignedTo);

  const isPublished = status === 'published';
  const viewUrl =
    editorMode && editorBasePath
      ? `${editorBasePath}/palabra/${encodeURIComponent(lemma)}`
      : `/palabra/${encodeURIComponent(lemma)}`;
  // In editor mode, we need the public domain URL for preview
  const publicPreviewUrl = editorMode
    ? `${process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000'}/palabra/${encodeURIComponent(lemma)}`
    : undefined;

  // Get status label and color for editor mode
  const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
  const statusLabel = statusOption?.label || status || 'Desconocido';

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    preredacted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-green-100 text-green-800',
  };
  const statusColor = statusColors[status || ''] || 'bg-gray-100 text-gray-800';

  // Determine background color based on dictionary
  const cardBgColor = dictionary ? DICTIONARY_COLORS[dictionary] || 'bg-amber-50' : 'bg-white';

  // Public mode: simple card with link to view page
  if (!editorMode) {
    return (
      <Link
        href={viewUrl}
        className={`border-duech-gold card-hover block rounded-xl border-l-4 ${cardBgColor} p-8 shadow-lg transition-all duration-200 hover:shadow-xl ${className}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-duech-blue text-2xl font-bold">{lemma}</h2>
          <ArrowRightCircleIcon className="text-duech-gold ml-6 h-6 w-6 flex-shrink-0" />
        </div>
      </Link>
    );
  }

  // Editor mode: same card style but with additional metadata
  return (
    <div
      className={`border-duech-gold card-hover relative rounded-xl border-l-4 ${cardBgColor} p-6 shadow-lg transition-all duration-200 hover:shadow-xl ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-duech-blue text-2xl font-bold">{lemma}</h2>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
              Letra {letter.toUpperCase()}
            </span>
            {dictionary && dictionary !== 'duech' && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                {dictionary}
              </span>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {root && root !== lemma && !editorMode && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Palabra base:</span>
                <span className="text-gray-900">{root}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="font-medium">Definiciones:</span>
              <span className="text-gray-900">
                {definitionsCount} {definitionsCount !== 1 ? 'definiciones' : 'definición'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Estado:</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            href={viewUrl}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              canEdit
                ? 'bg-duech-blue text-white hover:bg-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {canEdit ? (
              <>
                Editar
                <ArrowRightCircleIcon className="h-5 w-5" />
              </>
            ) : (
              <>
                Comentar
                <PencilIcon className="h-5 w-5" /> {/* Use the icon you prefer */}
              </>
            )}
          </Button>

          {isPublished && (
            <Button
              href={publicPreviewUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              title="Ver vista pública en nueva ventana"
            >
              Ver
              <EyeIcon className="h-4 w-4" />
            </Button>
          )}
          {/* ← Button visible only to admins */}
        </div>
      </div>
    </div>
  );
}
