/**
 * Critical path and dependency utilities – Masterbook "Flow Reveals Truth".
 * Computes critical path from tasks + dependency edges; detects circular deps; downstream impact.
 */

import type { Task } from '@/types/portfolio';
import type { TaskDependencyEdge, CriticalPathNode, DownstreamImpact, CircularDependencyResult } from '@/types/masterbook';

export interface TaskForCriticalPath {
  id: string;
  title: string;
  projectId: string;
  estimatedHours: number;
  startDate?: string;
  dueDate?: string;
}

/** Build adjacency: taskId -> list of successor task ids (type blocks only for CP). */
function buildSuccessorMap(edges: TaskDependencyEdge[], blocksOnly: boolean): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    if (blocksOnly && e.type !== 'blocks') continue;
    const list = map.get(e.predecessorTaskId) ?? [];
    if (!list.includes(e.successorTaskId)) list.push(e.successorTaskId);
    map.set(e.predecessorTaskId, list);
  }
  return map;
}

/** Build reverse: taskId -> list of predecessor task ids (blocks only). */
function buildPredecessorMap(edges: TaskDependencyEdge[], blocksOnly: boolean): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    if (blocksOnly && e.type !== 'blocks') continue;
    const list = map.get(e.successorTaskId) ?? [];
    if (!list.includes(e.predecessorTaskId)) list.push(e.predecessorTaskId);
    map.set(e.successorTaskId, list);
  }
  return map;
}

/** Detect cycle via DFS; returns one cycle (list of task ids) if any. */
function findCycle(
  taskIds: Set<string>,
  successorMap: Map<string, string[]>
): string[] {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(node: string): string[] | null {
    visited.add(node);
    stack.add(node);
    const successors = successorMap.get(node) ?? [];
    for (const succ of successors) {
      if (!taskIds.has(succ)) continue;
      if (!visited.has(succ)) {
        parent.set(succ, node);
        const cycle = dfs(succ);
        if (cycle.length) return cycle;
      } else if (stack.has(succ)) {
        const cycle: string[] = [succ];
        let cur: string = node;
        while (cur !== succ) {
          cycle.push(cur);
          cur = parent.get(cur)!;
        }
        return cycle.reverse();
      }
    }
    stack.delete(node);
    return [];
  }

  for (const id of taskIds) {
    if (visited.has(id)) continue;
    const cycle = dfs(id);
    if (cycle.length) return cycle;
  }
  return [];
}

/**
 * Detect circular dependencies and suggest which edge to remove to break the cycle.
 */
export function detectCircularDependencies(
  edges: TaskDependencyEdge[],
  taskIds: Set<string>
): CircularDependencyResult {
  const successorMap = buildSuccessorMap(edges, false);
  const cycle = findCycle(taskIds, successorMap);
  if (cycle.length === 0) {
    return { hasCycle: false, cycleTaskIds: [], suggestedAlternatives: [] };
  }

  const suggestedAlternatives: CircularDependencyResult['suggestedAlternatives'] = [];
  for (let i = 0; i < cycle.length; i++) {
    const pred = cycle[i];
    const succ = cycle[(i + 1) % cycle.length];
    const edge = edges.find(
      (e) => e.predecessorTaskId === pred && e.successorTaskId === succ
    );
    if (edge) {
      suggestedAlternatives.push({
        removeEdge: { pred, succ },
        reason: `Removing this dependency breaks the cycle: ${cycle.join(' → ')}`,
      });
    }
  }
  return {
    hasCycle: true,
    cycleTaskIds: cycle,
    suggestedAlternatives,
  };
}

/**
 * Compute critical path (forward/backward pass). Uses only 'blocks' edges.
 * Assumes tasks have estimatedHours; uses 1 if missing.
 */
export function computeCriticalPath(
  tasks: TaskForCriticalPath[],
  edges: TaskDependencyEdge[]
): CriticalPathNode[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const successorMap = buildSuccessorMap(edges, true);
  const predecessorMap = buildPredecessorMap(edges, true);

  const duration = (t: TaskForCriticalPath) => Math.max(1, t.estimatedHours ?? 1);
  const nodes: CriticalPathNode[] = tasks.map((t) => ({
    taskId: t.id,
    taskTitle: t.title,
    projectId: t.projectId,
    earliestStart: 0,
    earliestFinish: 0,
    latestStart: 0,
    latestFinish: 0,
    slack: 0,
    isCritical: false,
    durationHours: duration(t),
  }));

  const nodeMap = new Map(nodes.map((n) => [n.taskId, n]));

  // Forward pass: topological order (simplified: multiple passes until no change)
  let updated = true;
  while (updated) {
    updated = false;
    for (const n of nodes) {
      const preds = predecessorMap.get(n.taskId) ?? [];
      const predNodes = preds.map((id) => nodeMap.get(id)).filter(Boolean) as CriticalPathNode[];
      const maxPredFinish = predNodes.length
        ? Math.max(...predNodes.map((p) => p.earliestFinish))
        : 0;
      const newES = maxPredFinish;
      const newEF = newES + n.durationHours;
      if (newEF > n.earliestFinish) {
        n.earliestStart = newES;
        n.earliestFinish = newEF;
        updated = true;
      }
    }
  }

  const projectFinish = Math.max(...nodes.map((n) => n.earliestFinish), 0);

  // Backward pass
  updated = true;
  while (updated) {
    updated = false;
    for (const n of nodes) {
      const succs = successorMap.get(n.taskId) ?? [];
      const succNodes = succs.map((id) => nodeMap.get(id)).filter(Boolean) as CriticalPathNode[];
      const minSuccStart = succNodes.length
        ? Math.min(...succNodes.map((s) => s.latestStart))
        : projectFinish;
      const newLF = minSuccStart;
      const newLS = newLF - n.durationHours;
      if (n.latestFinish === 0 || newLS < n.latestStart) {
        n.latestFinish = newLF;
        n.latestStart = newLS;
        updated = true;
      }
    }
  }

  for (const n of nodes) {
    n.slack = n.latestStart - n.earliestStart;
    n.isCritical = n.slack <= 0;
  }

  return nodes;
}

/**
 * Get downstream tasks (successors via blocks) with depth and optional milestone ids.
 */
export function getDownstreamImpact(
  taskId: string,
  edges: TaskDependencyEdge[],
  tasks: TaskForCriticalPath[],
  milestoneByTaskId: (taskId: string) => string[]
): DownstreamImpact[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const successorMap = buildSuccessorMap(edges, true);
  const result: DownstreamImpact[] = [];
  const visited = new Set<string>();

  function visit(id: string, depth: number) {
    if (visited.has(id)) return;
    visited.add(id);
    const t = taskMap.get(id);
    if (t) {
      result.push({
        taskId: t.id,
        taskTitle: t.title,
        projectId: t.projectId,
        depth,
        affectedMilestoneIds: milestoneByTaskId(t.id),
      });
    }
    const succs = successorMap.get(id) ?? [];
    for (const s of succs) visit(s, depth + 1);
  }

  const succs = successorMap.get(taskId) ?? [];
  for (const s of succs) visit(s, 1);
  return result;
}

/**
 * Get set of task ids that are on the critical path.
 */
export function getCriticalPathTaskIds(nodes: CriticalPathNode[]): Set<string> {
  return new Set(nodes.filter((n) => n.isCritical).map((n) => n.taskId));
}

/**
 * Check if adding edge (predecessorId -> successorId) would create a cycle.
 */
export function wouldCreateCycle(
  edges: TaskDependencyEdge[],
  taskIds: Set<string>,
  predecessorId: string,
  successorId: string
): boolean {
  const extendedEdges: TaskDependencyEdge[] = [
    ...edges,
    {
      id: 'candidate',
      orgId: '',
      predecessorTaskId: predecessorId,
      successorTaskId: successorId,
      type: 'blocks',
    },
  ];
  const result = detectCircularDependencies(extendedEdges, taskIds);
  return result.hasCycle;
}
