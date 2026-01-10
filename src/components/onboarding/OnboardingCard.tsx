import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Rocket, ChevronRight, X } from 'lucide-react';
import type { OnboardingProgress } from './OnboardingWizard';

const STEPS = [
  { id: 'org_setup', label: 'Organization' },
  { id: 'invite_team', label: 'Team' },
  { id: 'resources', label: 'Resources' },
  { id: 'projects', label: 'Projects' },
  { id: 'programs', label: 'Programs' },
  { id: 'portfolios', label: 'Portfolios' },
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
        projects: false,
        programs: false,
        portfolios: false,
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

  // Don't show if completed or dismissed
  if (!progress || progress.completed || dismissed) {
    return null;
  }

  const completedCount = STEPS.filter(
    step => progress[step.id as keyof OnboardingProgress] === true
  ).length;
  
  const progressPercent = (completedCount / STEPS.length) * 100;

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
                className={`text-xs ${isComplete ? 'bg-primary' : isSkipped ? 'text-muted-foreground' : ''}`}
              >
                {step.label}
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
