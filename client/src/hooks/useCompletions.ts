import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export function useCreateCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { assignmentId: string; notes?: string }) => {
      const { data } = await api.post('/completions', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useDeleteCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/completions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}
