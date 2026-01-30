import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import type { ScheduleBlock, ScheduleBlockInsert, ScheduleBlockUpdate } from '@/domains/schedule/model';

export function useScheduleBlocks(assigneeId?: string | null) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(`realtime:schedule_blocks:${organization.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_blocks', filter: `org_id=eq.${organization.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['schedule_blocks', organization.id], exact: false });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const { data = [] } = useQuery({
    queryKey: ['schedule_blocks', organization?.id, assigneeId],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase.from('schedule_blocks').select('*').eq('org_id', organization.id).order('start_utc');
      if (assigneeId != null) q = q.eq('assignee_id', assigneeId);
      const { data: rows, error } = await q;
      if (error) throw error;
      return (rows ?? []) as ScheduleBlock[];
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
      const { data, error } = await supabase.from('schedule_blocks').insert(payload).select('id').single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from('schedule_blocks').update(updates).eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks', organization?.id] });
    },
  });
}
