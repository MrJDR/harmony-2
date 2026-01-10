import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Briefcase, 
  FolderKanban,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  SkipForward,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { OrgSetupStep } from './steps/OrgSetupStep';
import { InviteTeamStep } from './steps/InviteTeamStep';
import { ResourcesStep } from './steps/ResourcesStep';
import { ProjectsStep } from './steps/ProjectsStep';
import { ProgramsStep } from './steps/ProgramsStep';
import { PortfoliosStep } from './steps/PortfoliosStep';

export interface OnboardingProgress {
  org_setup: boolean;
  invite_team: boolean;
  resources: boolean;
  projects: boolean;
  programs: boolean;
  portfolios: boolean;
  completed: boolean;
  skipped_steps: string[];
}

const STEPS = [
  { id: 'org_setup', label: 'Organization', icon: Building2, description: 'Set up your organization details' },
  { id: 'invite_team', label: 'Team', icon: Users, description: 'Invite your team members' },
  { id: 'resources', label: 'Resources', icon: Briefcase, description: 'Define your team capacity' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, description: 'Create your first project' },
  { id: 'programs', label: 'Programs', icon: Layers, description: 'Group related projects' },
  { id: 'portfolios', label: 'Portfolios', icon: Sparkles, description: 'Organize at the highest level' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { organization, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress>({
    org_setup: false,
    invite_team: false,
    resources: false,
    projects: false,
    programs: false,
    portfolios: false,
    completed: false,
    skipped_steps: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [organization?.id]);

  const loadProgress = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem(`onboarding_${organization.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setProgress(parsed);
      
      // Find first incomplete step
      const firstIncomplete = STEPS.findIndex(
        step => !parsed[step.id as keyof OnboardingProgress] && !parsed.skipped_steps?.includes(step.id)
      );
      if (firstIncomplete !== -1) {
        setCurrentStep(firstIncomplete);
      }
    }
    setLoading(false);
  };

  const saveProgress = (newProgress: OnboardingProgress) => {
    if (organization?.id) {
      localStorage.setItem(`onboarding_${organization.id}`, JSON.stringify(newProgress));
    }
    setProgress(newProgress);
  };

  const markStepComplete = (stepId: string) => {
    const newProgress = {
      ...progress,
      [stepId]: true,
      skipped_steps: progress.skipped_steps.filter(s => s !== stepId),
    };
    saveProgress(newProgress);
  };

  const skipStep = (stepId: string) => {
    const newProgress = {
      ...progress,
      skipped_steps: [...progress.skipped_steps, stepId],
    };
    saveProgress(newProgress);
    goToNextStep();
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    const newProgress = { ...progress, completed: true };
    saveProgress(newProgress);
    
    toast({
      title: 'Welcome aboard! 🎉',
      description: progress.skipped_steps.length > 0 
        ? "You're all set! We'll guide you through the sections you skipped when you visit them."
        : "Your organization is fully set up. Let's get started!",
    });
    
    navigate('/');
  };

  const completedCount = STEPS.filter(
    step => progress[step.id as keyof OnboardingProgress] === true
  ).length;
  
  const progressPercent = (completedCount / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  const isCurrentStepComplete = progress[currentStepData.id as keyof OnboardingProgress] === true;
  const isCurrentStepSkipped = progress.skipped_steps.includes(currentStepData.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to {organization?.name || 'Your Organization'}
          </h1>
          <p className="text-muted-foreground">
            Let's get you set up in just a few steps
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-muted-foreground">
              {completedCount} completed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Step Navigation Pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {STEPS.map((step, index) => {
            const isComplete = progress[step.id as keyof OnboardingProgress] === true;
            const isSkipped = progress.skipped_steps.includes(step.id);
            const isCurrent = index === currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all
                  ${isCurrent 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : isComplete 
                      ? 'bg-primary/10 text-primary'
                      : isSkipped
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                  }
                `}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                {isSkipped && <Badge variant="outline" className="text-xs">Skipped</Badge>}
              </button>
            );
          })}
        </div>

        {/* Main Content Card */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <currentStepData.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentStepData.label}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
              {isCurrentStepComplete && (
                <Badge className="ml-auto bg-green-500">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 0 && (
                  <OrgSetupStep 
                    onComplete={() => markStepComplete('org_setup')} 
                    isComplete={progress.org_setup}
                  />
                )}
                {currentStep === 1 && (
                  <InviteTeamStep 
                    onComplete={() => markStepComplete('invite_team')} 
                    isComplete={progress.invite_team}
                  />
                )}
                {currentStep === 2 && (
                  <ResourcesStep 
                    onComplete={() => markStepComplete('resources')} 
                    isComplete={progress.resources}
                  />
                )}
                {currentStep === 3 && (
                  <ProjectsStep 
                    onComplete={() => markStepComplete('projects')} 
                    isComplete={progress.projects}
                  />
                )}
                {currentStep === 4 && (
                  <ProgramsStep 
                    onComplete={() => markStepComplete('programs')} 
                    isComplete={progress.programs}
                  />
                )}
                {currentStep === 5 && (
                  <PortfoliosStep 
                    onComplete={() => markStepComplete('portfolios')} 
                    isComplete={progress.portfolios}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {!isCurrentStepComplete && !isCurrentStepSkipped && (
              <Button
                variant="ghost"
                onClick={() => skipStep(currentStepData.id)}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for now
              </Button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={goToNextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={finishOnboarding}>
                Finish Setup
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
