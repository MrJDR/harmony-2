import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockPortfolio, mockTeamMembers, mockMilestones } from '@/data/mockData';
import type { Project, TeamMember, Program, Milestone } from '@/types/portfolio';

type PortfolioDataContextType = {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  addProgram: (program: Omit<Program, 'id' | 'projects'>) => Program;
  updateProgram: (id: string, data: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'tasks'>, programId: string) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
};

const PortfolioDataContext = createContext<PortfolioDataContextType | null>(null);

function calculateAllocations(projects: Project[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const project of projects) {
    for (const task of project.tasks) {
      const assigneeId = task.assigneeId;
      if (!assigneeId) continue;
      totals[assigneeId] = (totals[assigneeId] || 0) + (task.weight || 0);
    }
  }

  return totals;
}

export function PortfolioDataProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>(() => mockPortfolio.programs);
  const [projects, setProjects] = useState<Project[]>(() => mockPortfolio.programs.flatMap((p) => p.projects));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => mockTeamMembers);
  const [milestones, setMilestones] = useState<Milestone[]>(() => mockMilestones);

  // Keep projects in sync with programs
  useEffect(() => {
    const allProjects = programs.flatMap((p) => p.projects);
    setProjects(allProjects);
  }, [programs]);

  // Keep `teamMembers[].allocation` in sync with task assignments.
  useEffect(() => {
    const allocations = calculateAllocations(projects);
    setTeamMembers((prev) =>
      prev.map((m) => ({
        ...m,
        allocation: allocations[m.id] ?? 0,
      }))
    );
  }, [projects]);

  const addProgram = (programData: Omit<Program, 'id' | 'projects'>): Program => {
    const newProgram: Program = {
      ...programData,
      id: `prog-${Date.now()}`,
      projects: [],
    };
    setPrograms((prev) => [...prev, newProgram]);
    return newProgram;
  };

  const updateProgram = (id: string, data: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const deleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    // Also remove milestones for deleted program's projects
    setMilestones((prev) => {
      const program = programs.find((p) => p.id === id);
      if (!program) return prev;
      const projectIds = program.projects.map((p) => p.id);
      return prev.filter((m) => !projectIds.includes(m.projectId));
    });
  };

  const addProject = (projectData: Omit<Project, 'id' | 'tasks'>, programId: string): Project => {
    const newProject: Project = {
      ...projectData,
      id: `p-${Date.now()}`,
      tasks: [],
      programId,
    };
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId ? { ...p, projects: [...p.projects, newProject] } : p
      )
    );
    return newProject;
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setPrograms((prev) =>
      prev.map((program) => ({
        ...program,
        projects: program.projects.map((project) =>
          project.id === id ? { ...project, ...data } : project
        ),
      }))
    );
  };

  const deleteProject = (id: string) => {
    setPrograms((prev) =>
      prev.map((program) => ({
        ...program,
        projects: program.projects.filter((project) => project.id !== id),
      }))
    );
    setMilestones((prev) => prev.filter((m) => m.projectId !== id));
  };

  const value = useMemo(
    () => ({
      programs,
      setPrograms,
      projects,
      setProjects,
      teamMembers,
      setTeamMembers,
      milestones,
      setMilestones,
      addProgram,
      updateProgram,
      deleteProgram,
      addProject,
      updateProject,
      deleteProject,
    }),
    [programs, projects, teamMembers, milestones]
  );

  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>;
}

export function usePortfolioData() {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
  return ctx;
}
