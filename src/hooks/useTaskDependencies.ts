import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskDependencyEdge } from '@/types/masterbook';

// Note: task_dependencies table doesn't exist yet in the database schema
// This hook returns empty data until the migration is run

/** Fetches task dependency IDs (predecessor -> successor, type blocks). */
export function useTaskDependencyIds() {
  const { organization } = useAuth();

  // Return empty data since table doesn't exist yet
  const rows: { id: string; org_id: string; predecessor_task_id: string; successor_task_id: string; type: string }[] = [];

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
      rows.map((r) => ({
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
