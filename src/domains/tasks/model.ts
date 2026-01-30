// Tasks domain: core task entities and invariants live here. Do not include UI or API calls.
// Extracted from src/hooks/useTasks.ts

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

export interface TaskWithRelations extends Task {
  projects?: { id: string; name: string; program_id: string } | null;
  assignee?: {
    id: string;
    contacts: { name: string; email: string; avatar_url: string | null } | null;
  } | null;
  subtasks?: Subtask[];
}
