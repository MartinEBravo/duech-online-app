import { useState, useEffect, useCallback } from 'react';

export function useUserRole(editorMode: boolean) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [isLexicographer, setIsLexicographer] = useState(false);
  const [username, setUsername] = useState<string>('');
  const fetchUser = useCallback(async () => {
    if (!editorMode) {
      setIsAdmin(false);
      setIsCoordinator(false);
      setIsLexicographer(false);
      setUsername('');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log('🔍 API Response completa:', data);
        console.log('🔍 data.user:', data.user);
        const role = data.user?.role;
        const username = data.user?.name;
        console.log('🔍 Role extraído:', role);
        console.log('🔍 Username extraído:', username);
        setIsAdmin(role === 'admin');
        setIsCoordinator(role === 'coordinator');
        setIsLexicographer(role === 'lexicographer');
        setUsername(username || '');
      } else {
        setIsAdmin(false);
        setIsCoordinator(false);
        setIsLexicographer(false);
      }
    } catch {
      setIsAdmin(false);
      setIsCoordinator(false);
      setIsLexicographer(false);
      setUsername('');
    }
  }, [editorMode]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    isAdmin,
    isCoordinator,
    isLexicographer,
    username,
  };
}
