import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  calculateMemberAllocation, 
  getStoredWeights,
  type TaskForAllocation 
} from '@/lib/allocationCalculator';

export interface TeamMember {
  id: string;
  contact_id: string;
  capacity: number;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithContact extends TeamMember {
  contacts: {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
    avatar_url: string | null;
  } | null;
  allocation?: number; // Calculated weighted allocation points
}

export function useTeamMembers() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['team_members', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Get team members with their contact info
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          contacts:contact_id (id, name, email, role, avatar_url)
        `)
        .eq('org_id', organization.id);

      if (membersError) throw membersError;

      // Get tasks with all fields needed for allocation calculation
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, assignee_id, estimated_hours, weight, priority, status, due_date')
        .eq('org_id', organization.id)
        .not('assignee_id', 'is', null);

      if (tasksError) throw tasksError;

      // Get stored allocation weights
      const weights = getStoredWeights();

      // Convert to TaskForAllocation format
      const tasksForAllocation: TaskForAllocation[] = (tasks || []).map(t => ({
        id: t.id,
        assignee_id: t.assignee_id,
        estimated_hours: t.estimated_hours ?? 1,
        weight: (t as any).weight ?? 1,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
      }));

      // Calculate weighted allocations for each member
      return (members as TeamMemberWithContact[]).map(member => ({
        ...member,
        allocation: calculateMemberAllocation(member.id, tasksForAllocation, weights),
      }));
    },
    enabled: !!organization?.id,
  });
}

export function useTeamMember(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['team_member', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          contacts:contact_id (id, name, email, role, avatar_url)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as TeamMemberWithContact | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      contact_id: string; 
      capacity?: number;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: member, error } = await supabase
        .from('team_members')
        .insert({
          contact_id: data.contact_id,
          capacity: data.capacity || 40,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Team member added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add team member: ' + error.message);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      capacity?: number;
    }) => {
      const { data: member, error } = await supabase
        .from('team_members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      queryClient.invalidateQueries({ queryKey: ['team_member', data.id] });
      toast.success('Team member updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update team member: ' + error.message);
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Team member removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove team member: ' + error.message);
    },
  });
}
