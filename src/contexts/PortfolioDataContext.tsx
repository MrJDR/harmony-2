import { createContext, useContext, useMemo, useState } from 'react';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import type { Project, TeamMember } from '@/types/portfolio';

type PortfolioDataContextType = {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
};

const PortfolioDataContext = createContext<PortfolioDataContextType | null>(null);

export function PortfolioDataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => mockPortfolio.programs.flatMap(p => p.projects));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => mockTeamMembers);

  const value = useMemo(
    () => ({ projects, setProjects, teamMembers, setTeamMembers }),
    [projects, teamMembers]
  );

  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>;
}

export function usePortfolioData() {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
  return ctx;
}
