// Database schema types (snake_case to match Supabase)

export interface DbContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  expertise: string | null;
  role: string | null;
  notes: string | null;
  avatar_url: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbSubtask {
  id: string;
  title: string;
  completed: boolean;
  assignee_id: string | null;
  task_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  weight: number;
  estimated_hours: number;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  project_id: string;
  milestone_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbMilestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  project_id: string;
  program_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  program_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  custom_statuses?: ProjectStatus[] | null;
  custom_task_statuses?: TaskStatus[] | null;
  custom_task_priorities?: TaskPriority[] | null;
}

export interface DbProgram {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  portfolio_id: string;
  owner_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
  custom_statuses?: ProjectStatus[] | null;
  custom_project_statuses?: ProjectStatus[] | null;
}

export interface DbPortfolio {
  id: string;
  name: string;
  description: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeamMember {
  id: string;
  contact_id: string;
  capacity: number;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbProjectMember {
  id: string;
  project_id: string;
  member_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'contributor';
  org_id: string;
  created_at: string;
}

// Extended types with relations
export interface TeamMemberWithContact extends DbTeamMember {
  contacts: {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
    avatar_url: string | null;
  } | null;
  allocation?: number;
}

export interface TaskWithRelations extends DbTask {
  projects?: { id: string; name: string; program_id: string } | null;
  assignee?: TeamMemberWithContact | null;
  subtasks?: DbSubtask[];
}

export interface ProjectWithRelations extends DbProject {
  programs?: { id: string; name: string; portfolio_id: string } | null;
}

export interface MilestoneWithRelations extends DbMilestone {
  projects?: { id: string; name: string } | null;
  programs?: { id: string; name: string } | null;
}

export interface ProgramWithRelations extends DbProgram {
  portfolios?: { name: string } | null;
  owner?: { first_name: string | null; last_name: string | null; email: string } | null;
}

// Legacy types for backwards compatibility with old components
// These can be gradually phased out as components are updated

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  expertise: string;
  role: string;
  notes?: string;
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
  weight: number;
  estimatedHours: number;
  actualCost?: number;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  subtasks: Subtask[];
  projectId: string;
  milestoneId?: string;
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
  budget?: number;
  actualCost?: number;
  allocatedBudget?: number;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  portfolioId: string;
  projects: Project[];
  ownerId: string;
  customStatuses?: ProjectStatus[];
  customProjectStatuses?: ProjectStatus[];
  budget?: number;
  allocatedBudget?: number;
  actualCost?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  programs: Program[];
}

export interface TeamMember {
  id: string;
  contactId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  allocation: number;
  capacity: number;
  projectIds: string[];
}

export interface ResourceAllocation {
  memberId: string;
  projectId: string;
  allocation: number;
}

// Helper functions to convert between database and legacy types
export function dbTaskToLegacy(task: TaskWithRelations): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    weight: task.weight,
    estimatedHours: task.estimated_hours ?? 1,
    assigneeId: task.assignee_id || undefined,
    startDate: task.start_date || undefined,
    dueDate: task.due_date || undefined,
    projectId: task.project_id,
    milestoneId: task.milestone_id || undefined,
    subtasks: (task.subtasks || []).map(s => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      assigneeId: s.assignee_id || undefined,
    })),
  };
}

export function dbMilestoneToLegacy(milestone: MilestoneWithRelations): Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description || undefined,
    dueDate: milestone.due_date,
    projectId: milestone.project_id,
    programId: milestone.program_id,
  };
}

export function dbTeamMemberToLegacy(member: TeamMemberWithContact, projectIds: string[] = []): TeamMember {
  return {
    id: member.id,
    contactId: member.contact_id,
    name: member.contacts?.name || '',
    email: member.contacts?.email || '',
    role: member.contacts?.role || '',
    avatar: member.contacts?.avatar_url || undefined,
    allocation: member.allocation || 0,
    capacity: member.capacity,
    projectIds,
  };
}

export function dbProjectToLegacy(project: ProjectWithRelations, tasks: TaskWithRelations[], teamIds: string[]): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    status: project.status,
    progress: project.progress,
    startDate: project.start_date || '',
    endDate: project.end_date || undefined,
    programId: project.program_id,
    teamIds,
    tasks: tasks.filter(t => t.project_id === project.id).map(dbTaskToLegacy),
    customStatuses: project.custom_statuses || undefined,
    customTaskStatuses: project.custom_task_statuses || undefined,
    customTaskPriorities: project.custom_task_priorities || undefined,
  };
}

export function dbProgramToLegacy(
  program: ProgramWithRelations, 
  projects: ProjectWithRelations[], 
  tasks: TaskWithRelations[],
  projectMembers: Record<string, string[]>
): Program {
  const programProjects = projects.filter(p => p.program_id === program.id);
  return {
    id: program.id,
    name: program.name,
    description: program.description || '',
    status: program.status,
    portfolioId: program.portfolio_id,
    ownerId: program.owner_id || '',
    projects: programProjects.map(p => dbProjectToLegacy(p, tasks, projectMembers[p.id] || [])),
    customStatuses: program.custom_statuses || undefined,
    customProjectStatuses: program.custom_project_statuses || undefined,
  };
}
