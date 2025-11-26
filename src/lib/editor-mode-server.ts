/**
 * Server-side editor mode detection utilities.
 *
 * These functions check request headers set by the middleware to determine
 * if the current request is in editor mode (authenticated workspace).
 *
 * @module lib/editor-mode-server
 */

import { headers } from 'next/headers';

/**
 * Checks if the current request is in editor mode.
 * Uses the x-editor-mode header set by middleware.
 *
 * @returns True if in editor mode, false otherwise
 */
export async function isEditorMode(): Promise<boolean> {
  const headersList = await headers();
  const editorModeHeader = headersList.get('x-editor-mode');
  return editorModeHeader === 'true';
}

/**
 * Checks if in editor mode using provided headers object.
 * Useful when headers are already available.
 *
 * @param headersList - The headers object to check
 * @returns True if in editor mode, false otherwise
 */
export function isEditorModeFromHeaders(headersList: Headers): boolean {
  return headersList.get('x-editor-mode') === 'true';
}

/**
 * Gets the editor base path prefix for the current request.
 * Returns empty string when not using the /editor prefix.
 *
 * @returns The editor base path or empty string
 */
export async function getEditorBasePath(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-editor-base-path') ?? '';
}
