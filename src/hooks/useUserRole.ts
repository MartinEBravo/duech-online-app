/**
 * Custom hook for fetching and managing user role information.
 *
 * Fetches the current user's role from the API and provides
 * role-based flags for conditional rendering and access control.
 *
 * @module hooks/useUserRole
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches and manages user role information.
 *
 * @param editorMode - Whether the application is in editor mode
 * @returns Object with role flags and user info
 *
 * @example
 * ```tsx
 * const { isAdmin, isLexicographer, username } = useUserRole(true);
 *
 * if (isAdmin) {
 *   // Show admin-only features
 * }
 * ```
 */
export function useUserRole(editorMode: boolean) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLexicographer, setIsLexicographer] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<number | null>(null);
  const fetchUser = useCallback(async () => {
    if (!editorMode) {
      setIsAdmin(false);

      setIsLexicographer(false);
      setUsername('');
      setCreatedBy(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role;
        const username = data.user?.name;
        const createdBy = data.user?.id ? parseInt(data.user.id, 10) : null;
        setCreatedBy(createdBy);
        setIsAdmin(role === 'admin' || role === 'superadmin');

        setIsLexicographer(role === 'lexicographer');
        setUsername(username || '');
      } else {
        setIsAdmin(false);

        setIsLexicographer(false);
      }
    } catch {
      setIsAdmin(false);

      setIsLexicographer(false);
      setUsername('');
      setCreatedBy(null);
    }
  }, [editorMode]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    isAdmin,

    isLexicographer,
    username,
    currentId: createdBy,
  };
}
