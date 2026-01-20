import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ProjectCustomStatus {
  id: string;
  label: string;
  color: 'info' | 'success' | 'warning' | 'muted' | 'destructive';
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  program_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  custom_statuses: ProjectCustomStatus[] | null;
  custom_task_statuses: ProjectCustomStatus[] | null;
  custom_task_priorities: ProjectCustomStatus[] | null;
  archived_at: string | null;
  budget: number | null;
  actual_cost: number | null;
}

export interface ProjectWithRelations extends Project {
  programs?: { id: string; name: string; portfolio_id: string } | null;
}

// Helper to safely parse JSON custom status arrays
function parseCustomStatuses(json: Json | null): ProjectCustomStatus[] | null {
  if (!json || !Array.isArray(json)) return null;
  return json as unknown as ProjectCustomStatus[];
}

// Helper to transform raw DB response to typed Project
function transformDbProject(raw: Record<string, unknown>): ProjectWithRelations {
  return {
    ...raw,
    custom_statuses: parseCustomStatuses(raw.custom_statuses as Json),
    custom_task_statuses: parseCustomStatuses(raw.custom_task_statuses as Json),
    custom_task_priorities: parseCustomStatuses(raw.custom_task_priorities as Json),
  } as ProjectWithRelations;
}

export function useProjects(programId?: string) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(`realtime:projects:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `org_id=eq.${organization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

  return useQuery({
    queryKey: ['projects', organization?.id, programId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('projects')
        .select(`
          *,
          programs:program_id (id, name, portfolio_id)
        `)
        .eq('org_id', organization.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map((row) => transformDbProject(row as unknown as Record<string, unknown>));
    },
    enabled: !!organization?.id,
  });
}

export function useProject(id: string | undefined) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organization?.id || !id) return;

    const channel = supabase
      .channel(`realtime:project:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', id] });
          queryClient.invalidateQueries({ queryKey: ['projects', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, id, queryClient]);

  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          programs:program_id (id, name, portfolio_id)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return transformDbProject(data as unknown as Record<string, unknown>);
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      program_id: string;
      status?: 'planning' | 'active' | 'on-hold' | 'completed';
      start_date?: string;
      end_date?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: data.name,
          description: data.description || null,
          program_id: data.program_id,
          status: data.status || 'planning',
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          progress: 0,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      // Invalidate all project queries to ensure list refreshes
      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      name?: string; 
      description?: string;
      status?: 'planning' | 'active' | 'on-hold' | 'completed';
      progress?: number;
      start_date?: string;
      end_date?: string;
      custom_statuses?: ProjectCustomStatus[] | null;
      custom_task_statuses?: ProjectCustomStatus[] | null;
      custom_task_priorities?: ProjectCustomStatus[] | null;
      budget?: number | null;
      actual_cost?: number | null;
    }) => {
      // Convert typed arrays to JSON for Supabase
      const updateData: Record<string, unknown> = { ...data };
      if (data.custom_statuses !== undefined) {
        updateData.custom_statuses = data.custom_statuses as unknown as Json;
      }
      if (data.custom_task_statuses !== undefined) {
        updateData.custom_task_statuses = data.custom_task_statuses as unknown as Json;
      }
      if (data.custom_task_priorities !== undefined) {
        updateData.custom_task_priorities = data.custom_task_priorities as unknown as Json;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project: ' + error.message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project: ' + error.message);
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['archivedProjects'] });
      toast.success('Project archived successfully');
    },
    onError: (error) => {
      toast.error('Failed to archive project: ' + error.message);
    },
  });
}

export function useArchivedProjects() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['archivedProjects', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          programs:program_id (id, name, portfolio_id)
        `)
        .eq('org_id', organization.id)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => transformDbProject(row as unknown as Record<string, unknown>));
    },
    enabled: !!organization?.id,
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ archived_at: null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['archivedProjects'] });
      toast.success('Project restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to restore project: ' + error.message);
    },
  });
}
