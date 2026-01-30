/**
 * Critical path and dependency insights – Masterbook "Flow Reveals Truth".
 */

import { useMemo, useCallback } from 'react';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useTaskDependencyIds } from '@/hooks/useTaskDependencies';
import {
  computeCriticalPath,
  detectCircularDependencies,
  getCriticalPathTaskIds,
  getDownstreamImpact,
  wouldCreateCycle as wouldCreateCycleFn,
} from '@/lib/criticalPath';
import type { Task } from '@/types/portfolio';
import type { CriticalPathNode, DownstreamImpact as DownstreamImpactType } from '@/types/masterbook';

export function useCriticalPath() {
  const { tasks, milestones } = usePortfolioData();
  const { edges } = useTaskDependencyIds();

  const taskForCp = useMemo(
    () =>
      (tasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        estimatedHours: t.estimatedHours ?? 1,
        startDate: t.startDate ?? undefined,
        dueDate: t.dueDate ?? undefined,
      })),
    [tasks]
  );

  const taskIds = useMemo(() => new Set(taskForCp.map((t) => t.id)), [taskForCp]);

  const criticalPathNodes = useMemo(
    () => computeCriticalPath(taskForCp, edges),
    [taskForCp, edges]
  );

  const criticalPathTaskIds = useMemo(
    () => getCriticalPathTaskIds(criticalPathNodes),
    [criticalPathNodes]
  );

  const circularResult = useMemo(
    () => detectCircularDependencies(edges, taskIds),
    [edges, taskIds]
  );

  const milestoneByTaskId = useMemo(() => {
    const map = new Map<string, string[]>();
    const safeTasks = tasks ?? [];
    const safeMilestones = milestones ?? [];
    for (const m of safeMilestones) {
      const taskIdsForM = safeTasks.filter((t) => t.milestoneId === m.id).map((t) => t.id);
      for (const tid of taskIdsForM) {
        const list = map.get(tid) ?? [];
        if (!list.includes(m.id)) list.push(m.id);
        map.set(tid, list);
      }
    }
    return (taskId: string) => map.get(taskId) ?? [];
  }, [tasks, milestones]);

  const getDownstreamForTask = useMemo(
    () => (taskId: string): DownstreamImpactType[] =>
      getDownstreamImpact(taskId, edges, taskForCp, milestoneByTaskId),
    [edges, taskForCp, milestoneByTaskId]
  );

  const wouldCreateCycle = useCallback(
    (predecessorId: string, successorId: string) =>
      wouldCreateCycleFn(edges, taskIds, predecessorId, successorId),
    [edges, taskIds]
  );

  return {
    criticalPathNodes,
    criticalPathTaskIds,
    isOnCriticalPath: (taskId: string) => criticalPathTaskIds.has(taskId),
    circularResult,
    getDownstreamForTask,
    wouldCreateCycle,
    edges,
    taskForCp,
  };
}
