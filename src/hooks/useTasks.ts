import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import type { Task, TaskWithRelations, Subtask } from '@/domains/tasks/model';
import { buildNewTaskPayload } from '@/domains/tasks/service';
import { useEffect } from 'react';

export function useTasks(projectId?: string) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for tasks (like useProjects does)
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(`realtime:tasks:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `org_id=eq.${organization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', organization.id], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

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
      // Always return a new array reference to ensure React detects changes
      return (data || []) as TaskWithRelations[];
    },
    enabled: !!organization?.id,
    // Keep query in cache longer and ensure it's always observed
    staleTime: 0, // Always consider data stale to allow refetches
    gcTime: Infinity, // Never garbage collect - keep in cache as long as component is mounted
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
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

      const payload = buildNewTaskPayload(data, organization.id);

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(payload)
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
  const { organization } = useAuth();

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
    // Optimistic update: update UI immediately, then sync to database
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'], exact: false });
      
      // Snapshot the previous value for rollback
      const previousTasks = queryClient.getQueriesData<TaskWithRelations[]>({ 
        queryKey: ['tasks'], 
        exact: false 
      });
      
      // The query might not be in cache, so we need to fetch it first or ensure it exists
      // Since PortfolioDataContext uses useTasks(), the query should be active
      // Let's try to ensure the query exists by fetching it if needed
      if (organization?.id) {
        const tasksQueryKey = ['tasks', organization.id, undefined];
        let currentData = queryClient.getQueryData<TaskWithRelations[]>(tasksQueryKey);
        
        // If query doesn't exist in cache, try to get it from active queries
        if (!currentData) {
          // Try to fetch it from the query cache
          const query = queryClient.getQueryCache().find({ 
            queryKey: tasksQueryKey,
            exact: true 
          });
          
          if (query && query.state.data) {
            currentData = query.state.data as TaskWithRelations[];
          }
        }
        
        // If we have data, update it optimistically
        if (currentData && Array.isArray(currentData)) {
          const taskIndex = currentData.findIndex(t => t.id === variables.id);
          if (taskIndex !== -1) {
            const optimisticTask = {
              ...currentData[taskIndex],
              ...variables,
              assignee_id: variables.assignee_id !== undefined ? variables.assignee_id : currentData[taskIndex].assignee_id,
            } as TaskWithRelations;
            
            const newData = [
              ...currentData.slice(0, taskIndex),
              optimisticTask,
              ...currentData.slice(taskIndex + 1)
            ];
            
            queryClient.setQueryData(tasksQueryKey, newData);
          }
        }
      }
      
      // Also update any other tasks queries (with projectId) using setQueriesData
      queryClient.setQueriesData<TaskWithRelations[]>(
        { queryKey: ['tasks'], exact: false },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          
          const taskIndex = oldData.findIndex(t => t.id === variables.id);
          if (taskIndex === -1) return oldData;
          
          const optimisticTask = {
            ...oldData[taskIndex],
            ...variables,
            assignee_id: variables.assignee_id !== undefined ? variables.assignee_id : oldData[taskIndex].assignee_id,
          } as TaskWithRelations;
          
          return [
            ...oldData.slice(0, taskIndex),
            optimisticTask,
            ...oldData.slice(taskIndex + 1)
          ];
        }
      );
      
      // Also update single task query optimistically
      const previousTask = queryClient.getQueryData<TaskWithRelations>(['task', variables.id]);
      if (previousTask) {
        queryClient.setQueryData(['task', variables.id], {
          ...previousTask,
          ...variables,
          assignee_id: variables.assignee_id !== undefined ? variables.assignee_id : previousTask.assignee_id,
        } as TaskWithRelations);
      }
      
      // Return context with snapshot for potential rollback
      return { previousTasks, previousTask };
    },
    onSuccess: async (updated) => {
      // Update single task query
      queryClient.setQueryData(['task', updated.id], updated);
      
      // Invalidate all tasks queries - this marks them as stale
      // The realtime subscription will also trigger a refetch automatically
      queryClient.invalidateQueries({ 
        queryKey: ['tasks'], 
        exact: false
      });
      
      // Force refetch of all matching queries to ensure immediate UI update
      await queryClient.refetchQueries({ 
        queryKey: ['tasks'], 
        exact: false
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['team_members'], exact: false });
      
      toast.success('Task updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousTask) {
        queryClient.setQueryData(['task', variables.id], context.previousTask);
      }
      toast.error('Failed to update task: ' + error.message);
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
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
