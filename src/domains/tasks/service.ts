// Tasks domain: task-related business logic lives here. Do not include UI or API calls.

import type { Task } from './model';

export type NewTaskInput = {
  title: string;
  description?: string;
  project_id: string;
  status?: Task['status'];
  priority?: Task['priority'];
  weight?: number;
  estimated_hours?: number;
  actual_cost?: number;
  assignee_id?: string;
  start_date?: string;
  due_date?: string;
  milestone_id?: string;
};

export interface NewTaskPayload {
  title: string;
  description: string | null;
  project_id: string;
  status: Task['status'];
  priority: Task['priority'];
  weight: number;
  estimated_hours: number;
  actual_cost: number;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  milestone_id: string | null;
  org_id: string;
}

/**
 * Build the canonical payload for inserting a new task row.
 * Keeps all defaults and null-handling in one place.
 * Extracted from src/hooks/useTasks.ts (useCreateTask).
 */
export function buildNewTaskPayload(input: NewTaskInput, orgId: string): NewTaskPayload {
  return {
    title: input.title,
    description: input.description ?? null,
    project_id: input.project_id,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    weight: input.weight ?? 1,
    estimated_hours: input.estimated_hours ?? 1,
    actual_cost: input.actual_cost ?? 0,
    assignee_id: input.assignee_id ?? null,
    start_date: input.start_date ?? null,
    due_date: input.due_date ?? null,
    milestone_id: input.milestone_id ?? null,
    org_id: orgId,
  };
}
