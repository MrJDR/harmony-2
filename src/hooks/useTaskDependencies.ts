import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskDependencyEdge } from '@/types/masterbook';

type DbRow = { id: string; org_id: string; predecessor_task_id: string; successor_task_id: string; type: string };

/** Fetches task dependency IDs (predecessor -> successor, type blocks). */
export function useTaskDependencyIds() {
  const { organization } = useAuth();
  const { data: rows = [] } = useQuery({
    queryKey: ['task_dependencies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('id, org_id, predecessor_task_id, successor_task_id, type')
        .eq('org_id', organization.id);
      if (error) throw error;
      return (data ?? []) as DbRow[];
    },
    enabled: !!organization?.id,
  });

  const getForTask = useMemo(() => {
    const byPredecessor = new Map<string, { blocks: string[]; relates: string[] }>();
    for (const r of rows) {
      if (!byPredecessor.has(r.predecessor_task_id)) {
        byPredecessor.set(r.predecessor_task_id, { blocks: [], relates: [] });
      }
      const entry = byPredecessor.get(r.predecessor_task_id)!;
      if (r.type === 'blocks') entry.blocks.push(r.successor_task_id);
      else entry.relates.push(r.successor_task_id);
    }
    return (taskId: string) => byPredecessor.get(taskId) ?? { blocks: [], relates: [] };
  }, [rows]);

  const edges: TaskDependencyEdge[] = useMemo(
    () =>
      rows.map((r: DbRow) => ({
        id: r.id,
        orgId: r.org_id,
        predecessorTaskId: r.predecessor_task_id,
        successorTaskId: r.successor_task_id,
        type: r.type as TaskDependencyEdge['type'],
      })),
    [rows]
  );

  return { getForTask, edges };
}
