import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { api, configureApi } from './api/axios';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StartupCreate from './pages/StartupCreate';
import StartupDetail from './pages/StartupDetail';
import useAuthStore from './store/authStore';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppShell() {
  const { refresh, fetchMe } = useAuth();
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      try {
        const token = await refresh();
        if (active && token) {
          await fetchMe();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [fetchMe, refresh, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups/new"
          element={
            <ProtectedRoute>
              <StartupCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups/:id"
          element={
            <ProtectedRoute>
              <StartupDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups/:id/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BrowserRouter>
  );
}

function App() {
  useEffect(() => {
    configureApi({
      getToken: () => useAuthStore.getState().accessToken,
      refresh: async () => {
        try {
          const { data } = await api.post('/auth/refresh');
          const token = data?.data?.accessToken;
          if (token) {
            useAuthStore.getState().setToken(token);
          }
          return token || null;
        } catch {
          useAuthStore.getState().clearAuth();
          return null;
        }
      },
      onAuthFailure: () => {
        useAuthStore.getState().clearAuth();
        window.location.assign('/login');
      },
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

export default App;
