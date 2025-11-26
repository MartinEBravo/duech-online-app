/**
 * Comment bubble (globe) component.
 *
 * Displays a single comment with user avatar, name, date,
 * and styled bubble with color based on user identity.
 *
 * @module components/word/comment/globe
 */

import React from 'react';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import type { WordNote } from '@/lib/definitions';

/**
 * Word comment type alias for WordNote.
 */
export type WordComment = WordNote;

/** @internal Color palette for user-based styling */
const COLOR_PALETTE = [
  {
    avatarBg: 'bg-blue-500/15',
    avatarText: 'text-blue-700',
    accentFrom: 'from-blue-500',
    accentVia: 'via-blue-400/80',
    accentTo: 'to-blue-300/70',
    bubbleBorder: 'border-blue-100',
    bubbleBg: 'bg-blue-50/80',
    label: 'text-blue-600',
    cardBorder: 'border-blue-100',
    cardBg: 'bg-blue-50/40',
  },
  {
    avatarBg: 'bg-emerald-500/15',
    avatarText: 'text-emerald-700',
    accentFrom: 'from-emerald-500',
    accentVia: 'via-emerald-400/80',
    accentTo: 'to-emerald-300/70',
    bubbleBorder: 'border-emerald-100',
    bubbleBg: 'bg-emerald-50/80',
    label: 'text-emerald-600',
    cardBorder: 'border-emerald-100',
    cardBg: 'bg-emerald-50/40',
  },
  {
    avatarBg: 'bg-amber-500/15',
    avatarText: 'text-amber-700',
    accentFrom: 'from-amber-500',
    accentVia: 'via-amber-400/80',
    accentTo: 'to-amber-300/70',
    bubbleBorder: 'border-amber-100',
    bubbleBg: 'bg-amber-50/80',
    label: 'text-amber-600',
    cardBorder: 'border-amber-100',
    cardBg: 'bg-amber-50/40',
  },
  {
    avatarBg: 'bg-purple-500/15',
    avatarText: 'text-purple-700',
    accentFrom: 'from-purple-500',
    accentVia: 'via-purple-400/80',
    accentTo: 'to-purple-300/70',
    bubbleBorder: 'border-purple-100',
    bubbleBg: 'bg-purple-50/80',
    label: 'text-purple-600',
    cardBorder: 'border-purple-100',
    cardBg: 'bg-purple-50/40',
  },
  {
    avatarBg: 'bg-rose-500/15',
    avatarText: 'text-rose-700',
    accentFrom: 'from-rose-500',
    accentVia: 'via-rose-400/80',
    accentTo: 'to-rose-300/70',
    bubbleBorder: 'border-rose-100',
    bubbleBg: 'bg-rose-50/80',
    label: 'text-rose-600',
    cardBorder: 'border-rose-100',
    cardBg: 'bg-rose-50/40',
  },
  {
    avatarBg: 'bg-slate-500/15',
    avatarText: 'text-slate-700',
    accentFrom: 'from-slate-500',
    accentVia: 'via-slate-400/80',
    accentTo: 'to-slate-300/70',
    bubbleBorder: 'border-slate-200',
    bubbleBg: 'bg-slate-50/80',
    label: 'text-slate-600',
    cardBorder: 'border-slate-200',
    cardBg: 'bg-slate-50/40',
  },
] as const;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getPaletteForUser = (userKey: string) =>
  COLOR_PALETTE[hashString(userKey) % COLOR_PALETTE.length];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'A';
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
};

const formatDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const minutes = String(date.getMinutes()).padStart(2, '0');
  let hours = date.getHours();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12 || 12;

  return `${day}-${month}-${year}, ${hours}:${minutes} ${period}`;
};

/**
 * Comment bubble displaying a single editorial comment.
 *
 * Shows user avatar with initials, username, timestamp,
 * and comment content with markdown rendering.
 *
 * @example
 * ```tsx
 * <Globe comment={{ id: 1, note: "Comment text", user: { username: "John" }, createdAt: "..." }} />
 * ```
 */
export default function Globe({ comment }: { comment: WordComment }) {
  const createdAt = new Date(comment.createdAt);
  const formattedDate = formatDateTime(createdAt);

  const username = comment.user?.username?.trim() || 'Anónimo';
  const userKey = comment.user?.id ? String(comment.user.id) : username;
  const palette = getPaletteForUser(userKey);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${palette.cardBorder} ${palette.cardBg} p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${palette.accentFrom} ${palette.accentVia} ${palette.accentTo}`}
      />

      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`${palette.avatarBg} ${palette.avatarText} flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold shadow-inner`}
          >
            {getInitials(username)}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-gray-900">{username}</span>
            </div>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
      </header>

      <MarkdownRenderer
        content={comment.note}
        className={`mt-4 ${palette.bubbleBorder} ${palette.bubbleBg} px-1 py-1 text-sm leading-relaxed text-gray-700`}
      />
    </article>
  );
}
