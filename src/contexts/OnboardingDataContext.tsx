import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  allocationPoints: number;
  isOwner: boolean;
  isPending: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  portfolioId: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  programId: string | null;
}

interface OnboardingDataContextValue {
  teamMembers: TeamMember[];
  portfolios: Portfolio[];
  programs: Program[];
  projects: Project[];
  setTeamMembers: (members: TeamMember[]) => void;
  setPortfolios: (portfolios: Portfolio[]) => void;
  setPrograms: (programs: Program[]) => void;
  setProjects: (projects: Project[]) => void;
  addPortfolio: (portfolio: Omit<Portfolio, 'id'>) => void;
  addProgram: (program: Omit<Program, 'id'>) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  removePortfolio: (id: string) => void;
  removeProgram: (id: string) => void;
  removeProject: (id: string) => void;
  updateProgram: (id: string, data: Partial<Program>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  loadTeamMembers: () => Promise<void>;
  loading: boolean;
}

const OnboardingDataContext = createContext<OnboardingDataContextValue | null>(null);

export function OnboardingDataProvider({ children }: { children: ReactNode }) {
  const { organization, user, profile } = useAuth();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load team members from database - includes pending invites with their team_member records
  const loadTeamMembers = async () => {
    if (!organization?.id || !user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get pending invites
      const { data: invites } = await supabase
        .from('org_invites')
        .select('email, role')
        .eq('org_id', organization.id)
        .is('accepted_at', null);

      // Get team members with their contacts (for capacity info)
      const { data: dbTeamMembers } = await supabase
        .from('team_members')
        .select(`
          id,
          capacity,
          contact:contacts(id, email, name)
        `)
        .eq('org_id', organization.id);

      const members: TeamMember[] = [];

      // Add owner
      members.push({
        id: user.id,
        email: profile?.email || user.email || '',
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'You',
        role: 'owner',
        allocationPoints: 40,
        isOwner: true,
        isPending: false,
      });

      // Add pending invites - merge with team_member capacity if available
      if (invites) {
        invites.forEach((invite) => {
          // Find matching team_member by email
          const matchingTeamMember = dbTeamMembers?.find(
            tm => (tm.contact as any)?.email?.toLowerCase() === invite.email.toLowerCase()
          );
          
          members.push({
            id: matchingTeamMember?.id || invite.email,
            email: invite.email,
            name: (matchingTeamMember?.contact as any)?.name || invite.email.split('@')[0],
            role: invite.role,
            allocationPoints: matchingTeamMember?.capacity || 40,
            isOwner: false,
            isPending: true,
          });
        });
      }

      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id && user?.id) {
      loadTeamMembers();
    }
  }, [organization?.id, user?.id]);

  // Load from localStorage on mount
  useEffect(() => {
    if (organization?.id) {
      const stored = localStorage.getItem(`onboarding_data_${organization.id}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.portfolios) setPortfolios(data.portfolios);
          if (data.programs) setPrograms(data.programs);
          if (data.projects) setProjects(data.projects);
        } catch (e) {
          console.error('Error parsing onboarding data:', e);
        }
      }
    }
  }, [organization?.id]);

  // Save to localStorage on change
  useEffect(() => {
    if (organization?.id) {
      localStorage.setItem(`onboarding_data_${organization.id}`, JSON.stringify({
        portfolios,
        programs,
        projects,
      }));
    }
  }, [portfolios, programs, projects, organization?.id]);

  const generateId = () => crypto.randomUUID();

  const addPortfolio = (portfolio: Omit<Portfolio, 'id'>) => {
    setPortfolios(prev => [...prev, { ...portfolio, id: generateId() }]);
  };

  const addProgram = (program: Omit<Program, 'id'>) => {
    setPrograms(prev => [...prev, { ...program, id: generateId() }]);
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    setProjects(prev => [...prev, { ...project, id: generateId() }]);
  };

  const removePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    // Unassign programs from this portfolio
    setPrograms(prev => prev.map(p => p.portfolioId === id ? { ...p, portfolioId: null } : p));
  };

  const removeProgram = (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id));
    // Unassign projects from this program
    setProjects(prev => prev.map(p => p.programId === id ? { ...p, programId: null } : p));
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const updateProgram = (id: string, data: Partial<Program>) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  return (
    <OnboardingDataContext.Provider value={{
      teamMembers,
      portfolios,
      programs,
      projects,
      setTeamMembers,
      setPortfolios,
      setPrograms,
      setProjects,
      addPortfolio,
      addProgram,
      addProject,
      removePortfolio,
      removeProgram,
      removeProject,
      updateProgram,
      updateProject,
      loadTeamMembers,
      loading,
    }}>
      {children}
    </OnboardingDataContext.Provider>
  );
}

export function useOnboardingData() {
  const context = useContext(OnboardingDataContext);
  if (!context) {
    throw new Error('useOnboardingData must be used within OnboardingDataProvider');
  }
  return context;
}
