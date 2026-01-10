import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import type { OnboardingProgress } from '@/components/onboarding/OnboardingWizard';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
  activeTour: string | null;
  currentStep: number;
  tourSteps: TourStep[];
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTourHistory: (tourId?: string) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Comprehensive tour definitions for each page
export const TOUR_DEFINITIONS: Record<string, TourStep[]> = {
  dashboard: [
    {
      target: '[data-tour="stats-cards"]',
      title: 'Quick Stats',
      content: 'See your key metrics at a glance — programs, projects, tasks, and team members.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="active-projects"]',
      title: 'Active Projects',
      content: 'View your currently active projects with progress indicators.',
      placement: 'top',
    },
    {
      target: '[data-tour="resource-chart"]',
      title: 'Resource Allocation',
      content: 'Monitor your team\'s workload distribution across projects.',
      placement: 'left',
    },
  ],
  portfolio: [
    {
      target: '[data-tour="portfolio-nav"]',
      title: 'Portfolio Overview',
      content: 'Your portfolio provides a high-level view of all strategic initiatives.',
      placement: 'right',
    },
    {
      target: '[data-tour="portfolio-health"]',
      title: 'Portfolio Health',
      content: 'Monitor the overall health and status of your portfolio at a glance.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="program-cards"]',
      title: 'Programs',
      content: 'Each program groups related projects together under a common goal.',
      placement: 'top',
    },
  ],
  programs: [
    {
      target: '[data-tour="programs-nav"]',
      title: 'Programs Overview',
      content: 'Programs help you organize related projects that share common objectives.',
      placement: 'right',
    },
    {
      target: '[data-tour="program-list"]',
      title: 'Your Programs',
      content: 'View all your programs, their progress, and the projects within them.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="new-program"]',
      title: 'Create Programs',
      content: 'Click here to create a new program and assign projects to it.',
      placement: 'bottom',
    },
  ],
  projects: [
    {
      target: '[data-tour="projects-nav"]',
      title: 'Projects Overview',
      content: 'Projects are where the work happens — each contains tasks, teams, and timelines.',
      placement: 'right',
    },
    {
      target: '[data-tour="project-list"]',
      title: 'Your Projects',
      content: 'Browse all your projects organized by status and program.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="new-project"]',
      title: 'Create Projects',
      content: 'Click here to create a new project and assign it to a program.',
      placement: 'bottom',
    },
  ],
  resources: [
    {
      target: '[data-tour="resources-nav"]',
      title: 'Resource Management',
      content: 'Manage your team\'s capacity and allocation across projects.',
      placement: 'right',
    },
    {
      target: '[data-tour="team-overview"]',
      title: 'Team Overview',
      content: 'See each team member\'s current allocation and availability.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="allocation-chart"]',
      title: 'Allocation Visualization',
      content: 'Visual breakdown of how resources are distributed across work.',
      placement: 'left',
    },
  ],
  settings: [
    {
      target: '[data-tour="settings-nav"]',
      title: 'Settings',
      content: 'Configure your organization, team, and personal preferences.',
      placement: 'right',
    },
    {
      target: '[data-tour="org-settings"]',
      title: 'Organization Settings',
      content: 'Manage organization details, members, and permissions.',
      placement: 'bottom',
    },
  ],
  crm: [
    {
      target: '[data-tour="crm-nav"]',
      title: 'Contact Management',
      content: 'Manage your organization\'s contacts and relationships.',
      placement: 'right',
    },
    {
      target: '[data-tour="contacts-table"]',
      title: 'Contacts List',
      content: 'View and filter all your contacts with quick actions.',
      placement: 'bottom',
    },
  ],
  tasks: [
    {
      target: '[data-tour="tasks-nav"]',
      title: 'Task Management',
      content: 'View and manage all tasks across your projects.',
      placement: 'right',
    },
    {
      target: '[data-tour="task-views"]',
      title: 'Multiple Views',
      content: 'Switch between List, Kanban, Calendar, and Gantt views.',
      placement: 'bottom',
    },
  ],
  // Legacy mappings for skipped onboarding steps
  invite_team: [
    {
      target: '[data-tour="settings-nav"]',
      title: 'Invite Team Members',
      content: 'Go to Settings to invite new team members to your organization.',
      placement: 'right',
    },
    {
      target: '[data-tour="org-members"]',
      title: 'Organization Members',
      content: 'In the Organization tab, you can invite members, change roles, and manage your team.',
      placement: 'bottom',
    },
  ],
  portfolios: [
    {
      target: '[data-tour="portfolio-nav"]',
      title: 'Portfolio Overview',
      content: 'Your portfolio gives you a high-level view of all programs and projects.',
      placement: 'right',
    },
    {
      target: '[data-tour="portfolio-health"]',
      title: 'Portfolio Health',
      content: 'Track key KPIs like active programs, projects, task completion, and risk.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="program-cards"]',
      title: 'Programs',
      content: 'Programs group related projects under strategic goals. Click any program to drill in.',
      placement: 'top',
    },
  ],
  email: [
    {
      target: '[data-tour="email-nav"]',
      title: 'Email',
      content: 'Central place for sending and tracking communications.',
      placement: 'right',
    },
    {
      target: '[data-tour="email-folders"]',
      title: 'Folders',
      content: 'Switch between Inbox, Sent, Archive, and Trash.',
      placement: 'right',
    },
    {
      target: '[data-tour="email-list"]',
      title: 'Messages',
      content: 'Your emails list with unread indicators and quick scanning.',
      placement: 'bottom',
    },
  ],
  reports: [
    {
      target: '[data-tour="reports-nav"]',
      title: 'Reports',
      content: 'Analytics and insights across tasks, projects, programs, and resources.',
      placement: 'right',
    },
    {
      target: '[data-tour="reports-tabs"]',
      title: 'Report Types',
      content: 'Switch between overview and detailed report categories.',
      placement: 'bottom',
    },
  ],
};

// Map routes to tour IDs
const ROUTE_TOUR_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/portfolio': 'portfolios',
  '/programs': 'programs',
  '/projects': 'projects',
  '/resources': 'resources',
  '/settings': 'settings',
  '/crm': 'crm',
  '/tasks': 'tasks',
  '/email': 'email',
  '/reports': 'reports',
};

// Map routes to skipped step IDs for auto-triggering
const ROUTE_SKIPPED_MAP: Record<string, string> = {
  '/settings': 'invite_team',
  '/resources': 'resources',
  '/projects': 'projects',
  '/programs': 'programs',
  '/portfolio': 'portfolios',
};

export function TourProvider({ children }: { children: ReactNode }) {
  const { organization } = useAuth();
  const location = useLocation();
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [shownTours, setShownTours] = useState<Set<string>>(new Set());

  // Load shown tours from localStorage
  useEffect(() => {
    if (!organization?.id) return;
    
    const stored = localStorage.getItem(`shown_tours_${organization.id}`);
    if (stored) {
      setShownTours(new Set(JSON.parse(stored)));
    }
  }, [organization?.id]);

  // Check if we should auto-start a tour based on skipped onboarding steps
  useEffect(() => {
    if (!organization?.id || activeTour) return;

    const skippedStepId = ROUTE_SKIPPED_MAP[location.pathname];
    if (!skippedStepId || shownTours.has(skippedStepId)) return;

    // Check if this step was skipped in onboarding
    const stored = localStorage.getItem(`onboarding_${organization.id}`);
    if (!stored) return;

    const progress: OnboardingProgress = JSON.parse(stored);
    if (!progress.completed || !progress.skipped_steps?.includes(skippedStepId)) return;

    // Start the tour after a short delay
    setTimeout(() => {
      startTour(skippedStepId);
    }, 500);
  }, [location.pathname, organization?.id, activeTour, shownTours]);

  const startTour = (tourId: string) => {
    const steps = TOUR_DEFINITIONS[tourId];
    if (!steps || steps.length === 0) return;

    setTourSteps(steps);
    setCurrentStep(0);
    setActiveTour(tourId);
  };

  const endTour = () => {
    if (activeTour && organization?.id) {
      const newShown = new Set(shownTours);
      newShown.add(activeTour);
      setShownTours(newShown);
      localStorage.setItem(
        `shown_tours_${organization.id}`,
        JSON.stringify(Array.from(newShown))
      );
    }
    setActiveTour(null);
    setCurrentStep(0);
    setTourSteps([]);
  };

  const skipTour = () => {
    endTour();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetTourHistory = (tourId?: string) => {
    if (!organization?.id) return;
    
    if (tourId) {
      const newShown = new Set(shownTours);
      newShown.delete(tourId);
      setShownTours(newShown);
      localStorage.setItem(
        `shown_tours_${organization.id}`,
        JSON.stringify(Array.from(newShown))
      );
    } else {
      setShownTours(new Set());
      localStorage.removeItem(`shown_tours_${organization.id}`);
    }
  };

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStep,
        tourSteps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        resetTourHistory,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Helper to get the tour ID for the current route
export function getTourIdForRoute(pathname: string): string | null {
  // Exact matches first
  if (ROUTE_TOUR_MAP[pathname]) return ROUTE_TOUR_MAP[pathname];

  // Detail pages
  if (pathname.startsWith('/programs/')) return 'programs';
  if (pathname.startsWith('/projects/')) return 'projects';
  if (pathname.startsWith('/crm/')) return 'crm';

  return null;
}
