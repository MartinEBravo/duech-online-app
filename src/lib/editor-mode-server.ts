import { headers } from 'next/headers';

/**
 * Check if current request is in editor mode (server components).
 * Relies on the middleware adding the x-editor-mode header.
 */
export async function isEditorMode(): Promise<boolean> {
  const headersList = await headers();
  const editorModeHeader = headersList.get('x-editor-mode');
  return editorModeHeader === 'true';
}

/**
 * Retrieve the editor base path for the current request, if any.
 * Returns an empty string when not using the /editor prefix.
 */
export async function getEditorBasePath(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-editor-base-path') ?? '';
}
