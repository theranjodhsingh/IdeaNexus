import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { getErrorMessage } from '../api/axios';

const STARTUPS_KEY = ['startups'];

export function useStartups() {
  return useQuery({
    queryKey: STARTUPS_KEY,
    queryFn: async () => {
      const { data } = await api.get('/startups');
      return data?.data?.startups || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartup(id) {
  return useQuery({
    queryKey: ['startup', id],
    queryFn: async () => {
      const { data } = await api.get(`/startups/${id}`);
      return data?.data?.startup || null;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStartup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/startups', payload);
      return data?.data?.startup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STARTUPS_KEY });
    },
  });
}

export { getErrorMessage };
