import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  project_id: string;
  program_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneWithRelations extends Milestone {
  projects?: { id: string; name: string } | null;
  programs?: { id: string; name: string } | null;
}

export function useMilestones(projectId?: string, programId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['milestones', organization?.id, projectId, programId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('milestones')
        .select(`
          *,
          projects:project_id (id, name),
          programs:program_id (id, name)
        `)
        .eq('org_id', organization.id)
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MilestoneWithRelations[];
    },
    enabled: !!organization?.id,
  });
}

export function useMilestone(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['milestone', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('milestones')
        .select(`
          *,
          projects:project_id (id, name),
          programs:program_id (id, name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as MilestoneWithRelations | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      description?: string;
      due_date: string;
      project_id: string;
      program_id: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: milestone, error } = await supabase
        .from('milestones')
        .insert({
          title: data.title,
          description: data.description || null,
          due_date: data.due_date,
          project_id: data.project_id,
          program_id: data.program_id,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create milestone: ' + error.message);
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      title?: string; 
      description?: string;
      due_date?: string;
    }) => {
      const { data: milestone, error } = await supabase
        .from('milestones')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return milestone;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['milestone', data.id] });
      toast.success('Milestone updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update milestone: ' + error.message);
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete milestone: ' + error.message);
    },
  });
}
