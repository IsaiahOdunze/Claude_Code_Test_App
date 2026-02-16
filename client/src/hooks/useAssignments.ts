import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { format } from 'date-fns';

export interface Assignment {
  id: string;
  choreId: string;
  userId: string;
  assignedDate: string;
  rotationOrder: number | null;
  chore: {
    id: string;
    title: string;
    description: string | null;
    recurrenceType: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  completion: {
    id: string;
    userId: string;
    completedAt: string;
    notes: string | null;
  } | null;
}

export function useAssignments(start: Date | null, end: Date | null) {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', start?.toISOString(), end?.toISOString()],
    queryFn: async () => {
      if (!start || !end) return [];
      const { data } = await api.get('/assignments', {
        params: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
        },
      });
      return data;
    },
    enabled: !!start && !!end,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { choreId: string; userId: string; assignedDate: string }) => {
      const { data } = await api.post('/assignments', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assignments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}
