import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

/** Fetches task dependency IDs (predecessor -> successor, type blocks). */
export function useTaskDependencyIds() {
  const { organization } = useAuth();
  const { data: rows = [] } = useQuery({
    queryKey: ['task_dependencies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('predecessor_task_id, successor_task_id, type')
        .eq('org_id', organization.id);
      if (error) throw error;
      return (data ?? []) as { predecessor_task_id: string; successor_task_id: string; type: string }[];
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

  return { getForTask };
}
