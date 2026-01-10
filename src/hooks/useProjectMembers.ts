import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectMember {
  id: string;
  project_id: string;
  member_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'contributor';
  org_id: string;
  created_at: string;
}

export interface ProjectMemberWithDetails extends ProjectMember {
  team_members?: {
    id: string;
    capacity: number;
    contacts: {
      id: string;
      name: string;
      email: string | null;
      role: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export function useProjectMembers(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['project_members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          team_members:member_id (
            id,
            capacity,
            contacts:contact_id (id, name, email, role, avatar_url)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as ProjectMemberWithDetails[];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      project_id: string; 
      member_id: string;
      role?: 'owner' | 'admin' | 'editor' | 'viewer' | 'contributor';
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: member, error } = await supabase
        .from('project_members')
        .insert({
          project_id: data.project_id,
          member_id: data.member_id,
          role: data.role || 'contributor',
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.project_id] });
      toast.success('Team member added to project');
    },
    onError: (error) => {
      toast.error('Failed to add team member: ' + error.message);
    },
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id, ...data }: { 
      id: string; 
      project_id: string;
      role?: 'owner' | 'admin' | 'editor' | 'viewer' | 'contributor';
    }) => {
      const { data: member, error } = await supabase
        .from('project_members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...member, project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', data.project_id] });
      toast.success('Project member updated');
    },
    onError: (error) => {
      toast.error('Failed to update project member: ' + error.message);
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', data.project_id] });
      toast.success('Team member removed from project');
    },
    onError: (error) => {
      toast.error('Failed to remove team member: ' + error.message);
    },
  });
}
