/**
 * IdeaNexus API client.
 *
 * - Base URL from VITE_API_URL, fallback to http://localhost:5000/api.
 * - Attaches the in-memory access token from the Zustand store on every
 *   request that needs it.
 * - On 401, attempts a single refresh-token rotation, retries the original
 *   request once, then bails out (caller is responsible for redirecting).
 *
 * Why an explicit `setTokenGetter` rather than importing the store
 * directly: importing Zustand here would create a circular import
 * (store imports nothing from us, but the hooks depend on the client).
 * Passing the getter in keeps the dependency arrow pointing one way.
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true, // httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

let getAccessToken = () => null;
let onRefreshed = async () => null;
let onUnauthorized = () => {};

export function configureApi({
  getToken,
  refresh,
  onAuthFailure,
}) {
  if (getToken) getAccessToken = getToken;
  if (refresh) onRefreshed = refresh;
  if (onAuthFailure) onUnauthorized = onAuthFailure;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track in-flight refreshes so we don't fire the refresh endpoint N times
// when N requests 401 in parallel.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const originalRequest = config || {};

    if (response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on the refresh endpoint itself or on auth
    // endpoints that don't need a token to fail loudly.
    if (originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise || onRefreshed();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (!newToken) {
        onUnauthorized();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      onUnauthorized();
      return Promise.reject(refreshError);
    }
  },
);

/** Extract a human-readable message from any axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
