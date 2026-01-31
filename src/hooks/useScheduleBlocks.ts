import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { ScheduleBlock, ScheduleBlockInsert, ScheduleBlockUpdate } from '@/domains/schedule/model';

// Note: schedule_blocks table doesn't exist yet in the database schema
// These hooks return empty data until the migration is run

export function useScheduleBlocks(assigneeId?: string | null) {
  const { organization } = useAuth();

  // Return empty data since table doesn't exist yet
  const { data = [] } = useQuery({
    queryKey: ['schedule_blocks', organization?.id, assigneeId],
    queryFn: async () => {
      // Table doesn't exist yet - return empty array
      return [] as ScheduleBlock[];
    },
    enabled: !!organization?.id,
  });
  return { data };
}

export function useCreateScheduleBlock() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  return useMutation({
    mutationFn: async (payload: ScheduleBlockInsert) => {
      console.warn('schedule_blocks table not yet created');
      return { id: '' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks', organization?.id] });
    },
  });
}

export function useUpdateScheduleBlock() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ScheduleBlockUpdate & { id: string }) => {
      console.warn('schedule_blocks table not yet created');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks', organization?.id] });
    },
  });
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      console.warn('schedule_blocks table not yet created');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks', organization?.id] });
    },
  });
}
