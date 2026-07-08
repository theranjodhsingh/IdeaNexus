import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import useAuthStore from '../store/authStore';

/**
 * Interview hooks — all the live interview state lives here.
 *
 * The interview page owns a single active sessionId in the URL, so the
 * message-list query and the send-message mutation both know exactly
 * which session they're talking to.
 */

export function useStartInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (startupId) => {
      const { data } = await api.post('/interview/start', { startupId });
      return data?.data?.session;
    },
    onSuccess: (session) => {
      if (session?._id) {
        qc.setQueryData(['interview', session._id], session);
      }
      qc.invalidateQueries({ queryKey: ['startups'] });
      qc.invalidateQueries({ queryKey: ['startup'] });
    },
  });
}

export function useInterviewSession(sessionId) {
  return useQuery({
    queryKey: ['interview', sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/interview/${sessionId}`);
      return data?.data?.session;
    },
    enabled: Boolean(sessionId),
    staleTime: 30 * 1000,
  });
}

export function useSendMessage(sessionId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post(`/interview/${sessionId}/message`, { content });
      return {
        session: data?.data?.session,
        moduleComplete: Boolean(data?.data?.moduleComplete),
        extractedClaim: data?.data?.extractedClaim || null,
      };
    },
    onSuccess: ({ session }) => {
      if (session?._id) {
        qc.setQueryData(['interview', session._id], session);
      }
    },
  });
}

/**
 * Read the active session id straight from the URL via the auth store's
 * session pointer. The interview page writes to it on start/refresh; the
 * router uses it for reload-restore.
 */
export function useActiveSessionId() {
  return useAuthStore((s) => s.activeSessionId);
}

export function useSetActiveSessionId() {
  return useAuthStore((s) => s.setActiveSessionId);
}
