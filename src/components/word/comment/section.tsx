/**
 * Word comments section component.
 *
 * This component manages the complete editorial comments experience for a word,
 * including displaying existing comments, loading states, error handling, and
 * adding new comments with optimistic updates.
 *
 * ## Features
 *
 * ### Data Management
 * - Loads comments from API on mount and when lemma changes
 * - Supports initial server-side comments for SSR
 * - Uses AbortController for clean request cancellation
 *
 * ### Optimistic Updates
 * - New comments appear immediately with temporary data
 * - On success: replaced with server response
 * - On error: removed from list with error message
 *
 * ### UI States
 * - Loading: Shows loading indicator when fetching
 * - Empty: Shows placeholder with call-to-action in editor mode
 * - Error: Displays error message in red alert box
 * - Populated: Renders list of Globe comment bubbles
 *
 * @module components/word/comment/section
 * @see {@link WordCommentSection} - The main exported component (default export)
 * @see {@link WordCommentSectionProps} - Props interface
 * @see {@link Globe} - Individual comment display component
 * @see {@link NewComment} - New comment input component
 */

'use client';

import React, { useEffect, useState } from 'react';
import Globe, { WordComment } from '@/components/word/comment/globe';
import NewComment from '@/components/word/comment/new';

/**
 * Props for the WordCommentSection component.
 *
 * @interface WordCommentSectionProps
 */
export interface WordCommentSectionProps {
  /**
   * Whether the component is in editor mode.
   * Controls visibility of the add comment button.
   * @type {boolean}
   */
  editorMode: boolean;

  /**
   * Initial comments loaded from server (SSR).
   * Used to hydrate the component before client-side fetch.
   * @type {WordComment[]}
   * @default []
   */
  initial?: WordComment[];

  /**
   * The word lemma for API calls.
   * Used to fetch and post comments for this specific word.
   * @type {string}
   */
  lemma: string;
}

/**
 * Section displaying editorial comments for a word.
 *
 * This is the main container component for the comments feature.
 * It orchestrates data fetching, state management, and renders
 * the appropriate UI based on current state.
 *
 * ## API Integration
 * - GET `/api/words/{lemma}` - Fetches word data including comments
 * - PUT `/api/words/{lemma}` - Adds new comment via `{ comment: text }`
 *
 * @function WordCommentSection
 * @param {WordCommentSectionProps} props - Component props
 * @param {boolean} props.editorMode - Enable comment creation
 * @param {WordComment[]} [props.initial=[]] - Initial comments from server
 * @param {string} props.lemma - Word lemma for API calls
 * @returns {JSX.Element} Comments section with list and input
 *
 * @example
 * // Basic usage in word page
 * <WordCommentSection
 *   editorMode={true}
 *   initial={initialComments}
 *   lemma={word.lemma}
 * />
 *
 * @example
 * // Read-only mode (no add button)
 * <WordCommentSection
 *   editorMode={false}
 *   initial={comments}
 *   lemma="chilenismo"
 * />
 */
export default function WordCommentSection({
  editorMode,
  initial = [],
  lemma,
}: WordCommentSectionProps) {
  const [comments, setComments] = useState<WordComment[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setComments(initial);
  }, [initial]);

  useEffect(() => {
    if (!lemma) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/words/${encodeURIComponent(lemma)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }

        const body = (await response.json()) as {
          data?: { comments?: WordComment[] };
          success?: boolean;
        };

        if (!cancelled && Array.isArray(body.data?.comments)) {
          setComments(body.data.comments);
        }
      } catch (err) {
        if (!controller.signal.aborted && !cancelled) {
          console.error('Failed to load comments', err);
          setError('No pudimos cargar los comentarios.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lemma]);

  const addComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!lemma) {
      setError('No pudimos asociar el comentario a la palabra actual.');
      return;
    }

    setError(null);
    const optimistic: WordComment = {
      id: Date.now(),
      user: { username: 'Tú' },
      note: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch(`/api/words/${encodeURIComponent(lemma)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create comment. Status ${res.status}`);
      }

      const payload = (await res.json()) as { data?: { comment?: WordComment } };
      const saved = payload?.data?.comment;
      if (!saved) {
        throw new Error('Missing comment payload');
      }

      setComments((prev) => {
        const index = prev.findIndex((comment) => comment.id === optimistic.id);
        if (index === -1) {
          return [saved, ...prev];
        }
        const next = [...prev];
        next[index] = saved;
        return next;
      });
    } catch (err) {
      console.error('Failed to add comment', err);
      setComments((prev) => prev.filter((comment) => comment.id !== optimistic.id));
      setError('No pudimos guardar el comentario. Vuelve a intentarlo.');
    }
  };

  return (
    <section className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-duech-blue text-2xl font-semibold">Comentarios editoriales</h2>
        </div>
      </div>

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading && comments.length === 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-6 text-center text-sm text-gray-600">
            Cargando comentarios…
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-6 text-center text-sm text-gray-600">
            Aún no hay comentarios para esta palabra.
            {editorMode && (
              <div className="text-duech-blue mt-2 font-medium">
                Sé la primera persona en comentar.
              </div>
            )}
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((c) => (
              <Globe key={c.id} comment={c} />
            ))}
          </div>
        )}

        <NewComment onAdd={addComment} editorMode={editorMode} />
      </div>
    </section>
  );
}
