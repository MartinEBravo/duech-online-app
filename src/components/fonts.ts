/**
 * Font configuration for the application.
 *
 * Exports pre-configured Google Fonts for use throughout the app.
 *
 * @module components/fonts
 */

import { Lusitana } from 'next/font/google';

/**
 * Lusitana font for dictionary/headword styling.
 *
 * A serif font used for word titles and headings.
 *
 * @example
 * ```tsx
 * <h1 className={dictionary.className}>Word Title</h1>
 * ```
 */
export const dictionary = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});
