import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import useAuthStore from '../store/authStore';

/**
 * useAuth — the single place that mutates auth state in the store and
 * tells the axios client where to get the token from. Components use the
 * Zustand selectors directly for reads; mutations go through this hook.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  /**
   * Try to restore a session from the httpOnly refresh cookie. Called
   * once on app boot. Returns the new token (or null on failure).
   */
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data?.data?.accessToken;
      if (newToken) {
        setToken(newToken);
      }
      return newToken || null;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, setToken]);

  /**
   * Login, register, or refresh — anything that produces a user + token
   * pair. Updates the store and the axios client.
   */
  const applyAuth = useCallback((payload) => {
    const user = payload?.user || null;
    const accessToken = payload?.accessToken || null;
    if (user && accessToken) {
      setAuth(user, accessToken);
    } else if (accessToken) {
      setToken(accessToken);
    }
  }, [setAuth, setToken]);

  /**
   * Call /auth/me and stash the user. Cheap when the access token is
   * still warm.
   */
  const fetchMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    const user = data?.data?.user;
    if (user) setUser(user);
    return user;
  }, [setUser]);

  /**
   * Clear the in-memory session and blow away the query cache. Used on
   * explicit logout and on a hard auth failure.
   */
  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Server-side cookie clear is best-effort.
    }
    queryClient.clear();
    clearAuth();
  }, [clearAuth, queryClient]);

  return useMemo(() => ({
    refresh,
    applyAuth,
    fetchMe,
    signOut,
    setLoading,
  }), [applyAuth, fetchMe, refresh, setLoading, signOut]);
}
