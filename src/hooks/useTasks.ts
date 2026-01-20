import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  weight: number;
  estimated_hours: number;
  actual_cost: number | null;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  project_id: string;
  milestone_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  projects?: { id: string; name: string; program_id: string } | null;
  assignee?: { 
    id: string;
    contacts: { name: string; email: string; avatar_url: string | null } | null;
  } | null;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee_id: string | null;
  task_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function useTasks(projectId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['tasks', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (id, name, program_id),
          assignee:assignee_id (
            id,
            contacts:contact_id (name, email, avatar_url)
          ),
          subtasks (*)
        `)
        .eq('org_id', organization.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })
        .order('position', { ascending: true, referencedTable: 'subtasks' });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TaskWithRelations[];
    },
    enabled: !!organization?.id,
  });
}

export function useTask(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (id, name, program_id),
          assignee:assignee_id (
            id,
            contacts:contact_id (name, email, avatar_url)
          ),
          subtasks (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as TaskWithRelations | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      description?: string; 
      project_id: string;
      status?: 'todo' | 'in-progress' | 'review' | 'done';
      priority?: 'low' | 'medium' | 'high';
      weight?: number;
      estimated_hours?: number;
      actual_cost?: number;
      assignee_id?: string;
      start_date?: string;
      due_date?: string;
      milestone_id?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description || null,
          project_id: data.project_id,
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          weight: data.weight || 1,
          estimated_hours: data.estimated_hours || 1,
          actual_cost: data.actual_cost ?? 0,
          assignee_id: data.assignee_id || null,
          start_date: data.start_date || null,
          due_date: data.due_date || null,
          milestone_id: data.milestone_id || null,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['team_members'], exact: false });
      toast.success('Task created successfully');
      logActivity({
        type: 'task_created',
        category: 'tasks',
        title: `Created task "${task.title}"`,
        entityId: task.id,
        entityType: 'task',
      });
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      title?: string; 
      description?: string;
      status?: 'todo' | 'in-progress' | 'review' | 'done';
      priority?: 'low' | 'medium' | 'high';
      weight?: number;
      estimated_hours?: number;
      actual_cost?: number | null;
      assignee_id?: string | null;
      start_date?: string | null;
      due_date?: string | null;
      milestone_id?: string | null;
      position?: number;
    }) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          projects:project_id (id, name, program_id),
          assignee:assignee_id (
            id,
            contacts:contact_id (name, email, avatar_url)
          ),
          subtasks (*)
        `)
        .single();

      if (error) throw error;
      return task as TaskWithRelations;
    },
    onSuccess: (updated) => {
      // Ensure all task lists update immediately (some pages rely on context mapping over these queries).
      const queries = queryClient.getQueriesData({ queryKey: ['tasks'], exact: false });
      for (const [key] of queries) {
        queryClient.setQueryData(key, (old: TaskWithRelations[] | undefined) => {
          if (!old) return old;
          return old.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['task', updated.id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['team_members'], exact: false }); // Recalculate allocations
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['team_members'], exact: false }); // Recalculate allocations
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete task: ' + error.message);
    },
  });
}

// Subtask mutations
export function useCreateSubtask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      task_id: string;
      assignee_id?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: subtask, error } = await supabase
        .from('subtasks')
        .insert({
          title: data.title,
          task_id: data.task_id,
          assignee_id: data.assignee_id || null,
          completed: false,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return subtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to create subtask: ' + error.message);
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      title?: string;
      completed?: boolean;
      assignee_id?: string | null;
      position?: number;
    }) => {
      const { data: subtask, error } = await supabase
        .from('subtasks')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return subtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to update subtask: ' + error.message);
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to delete subtask: ' + error.message);
    },
  });
}

// Batch reorder tasks
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      // Update all positions in parallel
      const promises = updates.map(({ id, position }) =>
        supabase
          .from('tasks')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to reorder some tasks');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
    },
    onError: (error) => {
      toast.error('Failed to reorder tasks: ' + error.message);
    },
  });
}

// Batch reorder subtasks
export function useReorderSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      const promises = updates.map(({ id, position }) =>
        supabase
          .from('subtasks')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to reorder some subtasks');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
    },
    onError: (error) => {
      toast.error('Failed to reorder subtasks: ' + error.message);
    },
  });
}
