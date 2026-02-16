import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export interface Chore {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  startDate: string;
  endDate: string | null;
  autoRotate: boolean;
  assignments: { userId: string; user: { id: string; name: string } }[];
}

export function useChores() {
  return useQuery<Chore[]>({
    queryKey: ['chores'],
    queryFn: async () => {
      const { data } = await api.get('/chores');
      return data;
    },
  });
}

export function useCreateChore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      recurrenceType: string;
      startDate: string;
      endDate?: string;
      autoRotate: boolean;
      assignedUserIds: string[];
    }) => {
      const { data } = await api.post('/chores', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chores'] }),
  });
}

export function useUpdateChore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: any }) => {
      const { data } = await api.patch(`/chores/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chores'] }),
  });
}

export function useDeleteChore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/chores/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chores'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}
