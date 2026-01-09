export interface Contact {
  id: string;
  name: string;
  email: string;
  expertise: string;
  role: string;
  avatar?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  weight: number; // Story points / effort points
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  subtasks: Subtask[];
  projectId: string;
  milestoneId?: string; // Links task to a milestone
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  programId: string;
  description?: string;
}

export interface ProjectStatus {
  id: string;
  label: string;
  color: 'info' | 'success' | 'warning' | 'muted' | 'destructive';
}

export interface TaskStatus {
  id: string;
  label: string;
  color: 'info' | 'success' | 'warning' | 'muted' | 'destructive';
}

export interface TaskPriority {
  id: string;
  label: string;
  color: 'info' | 'success' | 'warning' | 'muted' | 'destructive';
}

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectMember {
  memberId: string;
  role: ProjectRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  progress: number;
  startDate: string;
  endDate?: string;
  programId: string;
  teamIds: string[];
  tasks: Task[];
  customStatuses?: ProjectStatus[];
  customTaskStatuses?: TaskStatus[];
  customTaskPriorities?: TaskPriority[];
  projectMembers?: ProjectMember[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  portfolioId: string;
  projects: Project[];
  ownerId: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  programs: Program[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  allocation: number; // calculated from assigned task weights
  capacity: number; // max points this member can handle (e.g., 40 points)
  projectIds: string[];
}

export interface ResourceAllocation {
  memberId: string;
  projectId: string;
  allocation: number;
}
