import { createContext, useContext, useMemo } from 'react';
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from '@/hooks/usePortfolios';
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/usePrograms';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/hooks/useMilestones';
import { useContacts } from '@/hooks/useContacts';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import type { 
  Program, 
  Project, 
  Task, 
  TeamMember, 
  Milestone,
  Contact,
  Portfolio,
  dbTaskToLegacy,
  dbMilestoneToLegacy,
  dbTeamMemberToLegacy,
  dbProjectToLegacy,
  dbProgramToLegacy,
} from '@/types/portfolio';

type PortfolioDataContextType = {
  // Legacy-compatible data structures (for backwards compat with existing pages)
  portfolios: Portfolio[];
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  milestones: Milestone[];
  contacts: Contact[];
  portfolio: Portfolio | null;
  
  // Loading state
  isLoading: boolean;
  
  // Setters (for local state updates - will be replaced with mutations)
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  
  // Portfolio operations
  addPortfolio: (data: { name: string; description: string }) => Promise<{ id: string } | undefined>;
  updatePortfolio: (id: string, data: { name?: string; description?: string }) => void;
  deletePortfolio: (id: string) => void;
  
  // Program operations
  addProgram: (data: Omit<Program, 'id' | 'projects'>) => Program;
  updateProgram: (id: string, data: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  
  // Project operations  
  addProject: (data: Omit<Project, 'id' | 'tasks'>, programId: string) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Task operations
  addTask: (data: Partial<Task>, projectId: string) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Milestone operations
  addMilestone: (data: Omit<Milestone, 'id'>) => void;
  updateMilestone: (id: string, data: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
};

const PortfolioDataContext = createContext<PortfolioDataContextType | null>(null);

export function PortfolioDataProvider({ children }: { children: React.ReactNode }) {
  // Fetch raw data from database
  const { data: dbPortfolios = [], isLoading: loadingPortfolios } = usePortfolios();
  const { data: dbPrograms = [], isLoading: loadingPrograms } = usePrograms();
  const { data: dbProjects = [], isLoading: loadingProjects } = useProjects();
  const { data: dbTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: dbTeamMembers = [], isLoading: loadingTeamMembers } = useTeamMembers();
  const { data: dbMilestones = [], isLoading: loadingMilestones } = useMilestones();
  const { data: dbContacts = [], isLoading: loadingContacts } = useContacts();
  
  // Mutations
  const createPortfolioMutation = useCreatePortfolio();
  const updatePortfolioMutation = useUpdatePortfolio();
  const deletePortfolioMutation = useDeletePortfolio();
  
  const createProgram = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();
  
  const createProject = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  
  const createTask = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  const createMilestone = useCreateMilestone();
  const updateMilestoneMutation = useUpdateMilestone();
  const deleteMilestoneMutation = useDeleteMilestone();
  
  const isLoading = loadingPortfolios || loadingPrograms || loadingProjects || loadingTasks || loadingTeamMembers || loadingMilestones || loadingContacts;

  // Convert database types to legacy types
  const tasks: Task[] = useMemo(() => {
    return dbTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      weight: task.weight,
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
    }));
  }, [dbTasks]);

  const milestones: Milestone[] = useMemo(() => {
    return dbMilestones.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description || undefined,
      dueDate: m.due_date,
      projectId: m.project_id,
      programId: m.program_id,
    }));
  }, [dbMilestones]);

  const teamMembers: TeamMember[] = useMemo(() => {
    // Calculate project assignments from project_members or tasks
    const projectAssignments: Record<string, string[]> = {};
    
    dbTasks.forEach(task => {
      if (task.assignee_id) {
        if (!projectAssignments[task.assignee_id]) {
          projectAssignments[task.assignee_id] = [];
        }
        if (!projectAssignments[task.assignee_id].includes(task.project_id)) {
          projectAssignments[task.assignee_id].push(task.project_id);
        }
      }
    });

    return dbTeamMembers.map(m => ({
      id: m.id,
      contactId: m.contact_id,
      name: m.contacts?.name || '',
      email: m.contacts?.email || '',
      role: m.contacts?.role || '',
      avatar: m.contacts?.avatar_url || undefined,
      allocation: m.allocation || 0,
      capacity: m.capacity,
      projectIds: projectAssignments[m.id] || [],
    }));
  }, [dbTeamMembers, dbTasks]);

  const contacts: Contact[] = useMemo(() => {
    return dbContacts.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email || '',
      expertise: c.expertise || '',
      role: c.role || '',
      avatar: c.avatar_url || undefined,
    }));
  }, [dbContacts]);

  const projects: Project[] = useMemo(() => {
    return dbProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: p.status,
      progress: p.progress,
      startDate: p.start_date || '',
      endDate: p.end_date || undefined,
      programId: p.program_id,
      teamIds: [...new Set(tasks.filter(t => t.projectId === p.id && t.assigneeId).map(t => t.assigneeId!))],
      tasks: tasks.filter(t => t.projectId === p.id),
    }));
  }, [dbProjects, tasks]);

  const programs: Program[] = useMemo(() => {
    return dbPrograms.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: p.status,
      portfolioId: p.portfolio_id,
      ownerId: p.owner_id || '',
      projects: projects.filter(proj => proj.programId === p.id),
    }));
  }, [dbPrograms, projects]);

  const portfolios: Portfolio[] = useMemo(() => {
    return dbPortfolios.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      programs: programs.filter(prog => prog.portfolioId === p.id),
    }));
  }, [dbPortfolios, programs]);

  const portfolio: Portfolio | null = useMemo(() => {
    if (portfolios.length === 0) return null;
    return portfolios[0];
  }, [portfolios]);

  // No-op setters (data comes from database, mutations handle updates)
  const setPrograms = () => {};
  const setProjects = () => {};
  const setTeamMembers = () => {};
  const setMilestones = () => {};

  // Portfolio operations
  const addPortfolio = async (data: { name: string; description: string }): Promise<{ id: string } | undefined> => {
    try {
      const result = await createPortfolioMutation.mutateAsync({
        name: data.name,
        description: data.description,
      });
      return result ? { id: result.id } : undefined;
    } catch {
      return undefined;
    }
  };

  const updatePortfolio = (id: string, data: { name?: string; description?: string }) => {
    updatePortfolioMutation.mutate({
      id,
      name: data.name,
      description: data.description,
    });
  };

  const deletePortfolio = (id: string) => {
    deletePortfolioMutation.mutate(id);
  };

  // Program operations
  const addProgram = (data: Omit<Program, 'id' | 'projects'>): Program => {
    const newProgram: Program = {
      ...data,
      id: `prog-${Date.now()}`,
      projects: [],
    };
    
    createProgram.mutate({
      name: data.name,
      description: data.description,
      portfolio_id: data.portfolioId,
      status: data.status,
      owner_id: data.ownerId || undefined,
    });
    
    return newProgram;
  };

  const updateProgram = (id: string, data: Partial<Program>) => {
    updateProgramMutation.mutate({
      id,
      name: data.name,
      description: data.description,
      status: data.status,
      owner_id: data.ownerId,
    });
  };

  const deleteProgram = (id: string) => {
    deleteProgramMutation.mutate(id);
  };

  // Project operations
  const addProject = (data: Omit<Project, 'id' | 'tasks'>, programId: string): Project => {
    const newProject: Project = {
      ...data,
      id: `p-${Date.now()}`,
      tasks: [],
      programId,
    };
    
    createProject.mutate({
      name: data.name,
      description: data.description,
      program_id: programId,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate,
    });
    
    return newProject;
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    updateProjectMutation.mutate({
      id,
      name: data.name,
      description: data.description,
      status: data.status,
      progress: data.progress,
      start_date: data.startDate,
      end_date: data.endDate,
    });
  };

  const deleteProject = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  // Task operations
  const addTask = (data: Partial<Task>, projectId: string) => {
    createTask.mutate({
      title: data.title || '',
      description: data.description,
      project_id: projectId,
      status: data.status,
      priority: data.priority,
      weight: data.weight,
      assignee_id: data.assigneeId,
      due_date: data.dueDate,
      milestone_id: data.milestoneId,
    });
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    updateTaskMutation.mutate({
      id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      weight: data.weight,
      assignee_id: data.assigneeId || null,
      due_date: data.dueDate || null,
      milestone_id: data.milestoneId || null,
    });
  };

  const deleteTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  // Milestone operations
  const addMilestone = (data: Omit<Milestone, 'id'>) => {
    createMilestone.mutate({
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
      project_id: data.projectId,
      program_id: data.programId,
    });
  };

  const updateMilestone = (id: string, data: Partial<Milestone>) => {
    updateMilestoneMutation.mutate({
      id,
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
    });
  };

  const deleteMilestone = (id: string) => {
    deleteMilestoneMutation.mutate(id);
  };

  const value = useMemo(
    () => ({
      portfolios,
      programs,
      projects,
      tasks,
      teamMembers,
      milestones,
      contacts,
      portfolio,
      isLoading,
      setPrograms: setPrograms as any,
      setProjects: setProjects as any,
      setTeamMembers: setTeamMembers as any,
      setMilestones: setMilestones as any,
      addPortfolio,
      updatePortfolio,
      deletePortfolio,
      addProgram,
      updateProgram,
      deleteProgram,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addMilestone,
      updateMilestone,
      deleteMilestone,
    }),
    [portfolios, programs, projects, tasks, teamMembers, milestones, contacts, portfolio, isLoading]
  );

  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>;
}

export function usePortfolioData() {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
  return ctx;
}
