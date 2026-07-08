/**
 * Auth store — holds the in-memory access token and the current user.
 *
 * Tokens live in Zustand only (never localStorage) so they vanish on a hard
 * reload — the httpOnly refresh cookie is the source of truth and we
 * rehydrate from /auth/refresh on app start.
 */

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // true until we've tried to refresh once
  // The interview page tracks its current session id here so that a page
  // reload (which loses React state) can re-hydrate from GET /interviews/:id.
  activeSessionId: null,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading: false,
    }),

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  setToken: (accessToken) =>
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    }),

  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      activeSessionId: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useAuthStore;
