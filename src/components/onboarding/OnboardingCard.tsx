import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Rocket, ChevronRight, X, AlertCircle } from 'lucide-react';
import type { OnboardingProgress } from './OnboardingWizard';

// Order: Portfolios → Programs → Projects (matches OnboardingWizard)
const STEPS = [
  { id: 'org_setup', label: 'Organization', path: '/onboarding' },
  { id: 'invite_team', label: 'Team', path: '/onboarding' },
  { id: 'resources', label: 'Resources', path: '/onboarding' },
  { id: 'portfolios', label: 'Portfolios', path: '/portfolio' },
  { id: 'programs', label: 'Programs', path: '/programs' },
  { id: 'projects', label: 'Projects', path: '/projects' },
];

export function OnboardingCard() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    
    const stored = localStorage.getItem(`onboarding_${organization.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setProgress(parsed);
    } else {
      // No onboarding started yet - show the card
      setProgress({
        org_setup: false,
        invite_team: false,
        resources: false,
        portfolios: false,
        programs: false,
        projects: false,
        completed: false,
        skipped_steps: [],
      });
    }

    const dismissedKey = localStorage.getItem(`onboarding_dismissed_${organization.id}`);
    setDismissed(dismissedKey === 'true');
  }, [organization?.id]);

  const handleDismiss = () => {
    if (organization?.id) {
      localStorage.setItem(`onboarding_dismissed_${organization.id}`, 'true');
    }
    setDismissed(true);
  };

  const handleReopen = () => {
    if (organization?.id) {
      localStorage.removeItem(`onboarding_dismissed_${organization.id}`);
    }
    setDismissed(false);
  };

  // Don't show if no progress loaded
  if (!progress) {
    return null;
  }

  const completedCount = STEPS.filter(
    step => progress[step.id as keyof OnboardingProgress] === true
  ).length;
  
  const skippedSteps = STEPS.filter(
    step => progress.skipped_steps?.includes(step.id)
  );
  
  const progressPercent = (completedCount / STEPS.length) * 100;

  // If completed but has skipped steps, show a minimal reminder card
  if (progress.completed && skippedSteps.length > 0 && !dismissed) {
    return (
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-transparent dark:border-amber-900 dark:from-amber-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-medium text-sm">
                  {skippedSteps.length} section{skippedSteps.length > 1 ? 's' : ''} skipped during setup
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skippedSteps.map((step) => (
                    <Badge 
                      key={step.id} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-primary/10"
                      onClick={() => navigate(step.path)}
                    >
                      {step.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/onboarding')}
              >
                Complete Setup
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If completed and dismissed or no skipped steps, don't show
  if (progress.completed) {
    return null;
  }

  // If dismissed but not completed, show a minimal "reopen" option
  if (dismissed) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Complete Your Setup</CardTitle>
              <CardDescription>
                {completedCount === 0 
                  ? "Let's get your organization ready" 
                  : `${completedCount} of ${STEPS.length} steps complete`
                }
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercent} className="h-2" />
        
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((step) => {
            const isComplete = progress[step.id as keyof OnboardingProgress] === true;
            const isSkipped = progress.skipped_steps?.includes(step.id);
            
            return (
              <Badge 
                key={step.id}
                variant={isComplete ? 'default' : 'outline'}
                className={`text-xs ${isComplete ? 'bg-primary' : isSkipped ? 'text-amber-600 border-amber-300' : ''}`}
              >
                {step.label}
                {isSkipped && ' (skipped)'}
              </Badge>
            );
          })}
        </div>

        <Button onClick={() => navigate('/onboarding')} className="w-full">
          {completedCount === 0 ? 'Start Setup' : 'Continue Setup'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
