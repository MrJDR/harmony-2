import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import type { OnboardingProgress } from '@/components/onboarding/OnboardingWizard';

interface TourStep {
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
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Tour definitions for each skipped section
const TOUR_DEFINITIONS: Record<string, TourStep[]> = {
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
  resources: [
    {
      target: '[data-tour="resources-nav"]',
      title: 'Manage Resources',
      content: 'Click here to view and manage your team resources and capacity.',
      placement: 'right',
    },
  ],
  projects: [
    {
      target: '[data-tour="projects-nav"]',
      title: 'Create Projects',
      content: 'Navigate to Projects to create and manage your work.',
      placement: 'right',
    },
  ],
  programs: [
    {
      target: '[data-tour="programs-nav"]',
      title: 'Organize with Programs',
      content: 'Programs help you group related projects together.',
      placement: 'right',
    },
  ],
  portfolios: [
    {
      target: '[data-tour="portfolio-nav"]',
      title: 'Portfolio Overview',
      content: 'Your portfolio gives you a high-level view of all programs and projects.',
      placement: 'right',
    },
  ],
};

// Map routes to skipped step IDs that should trigger tours
const ROUTE_TOUR_MAP: Record<string, string> = {
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

  // Check if we should start a tour based on current route
  useEffect(() => {
    if (!organization?.id || activeTour) return;

    const tourId = ROUTE_TOUR_MAP[location.pathname];
    if (!tourId || shownTours.has(tourId)) return;

    // Check if this step was skipped in onboarding
    const stored = localStorage.getItem(`onboarding_${organization.id}`);
    if (!stored) return;

    const progress: OnboardingProgress = JSON.parse(stored);
    if (!progress.completed || !progress.skipped_steps?.includes(tourId)) return;

    // Start the tour after a short delay
    setTimeout(() => {
      startTour(tourId);
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
