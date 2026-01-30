/**
 * Contextual Insight – Masterbook "System Teaches by Use".
 * Dismissible inline teaching at point of action.
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMasterbook } from '@/contexts/MasterbookContext';
import type { ContextualInsight as ContextualInsightType } from '@/types/masterbook';
import { cn } from '@/lib/utils';

const INSIGHTS: Record<string, ContextualInsightType> = {
  dependency_impact: {
    id: 'dependency_impact',
    title: 'Dependency impact',
    body: 'Adding a dependency affects the critical path and downstream tasks. Moving the predecessor\'s dates will shift successors on the timeline.',
    dismissible: true,
  },
  critical_path_intro: {
    id: 'critical_path_intro',
    title: 'Critical path',
    body: 'Tasks on the critical path have zero slack—delays here push out the whole project. Focus on unblocking and completing these first.',
    dismissible: true,
  },
  circular_dependency: {
    id: 'circular_dependency',
    title: 'Circular dependency',
    body: 'A cycle means Task A blocks B and B blocks A, so the schedule can\'t be resolved. Remove one of the links to break the cycle.',
    dismissible: true,
  },
  first_dependency: {
    id: 'first_dependency',
    title: 'First dependency',
    body: 'Dependencies define the order of work. "Blocked by" means this task can\'t start until the other task is done.',
    dismissible: true,
  },
  first_risk: {
    id: 'first_risk',
    title: 'Risk register',
    body: 'Risks go through: Identified → Active → Mitigated or Realized. When a risk is realized, you can create a blocker task to track the impact.',
    dismissible: true,
  },
  first_change_request: {
    id: 'first_change_request',
    title: 'Scope change',
    body: 'Change requests need approval before implementation. This keeps an immutable record of what changed and why.',
    dismissible: true,
  },
};

interface ContextualInsightProps {
  insightId: keyof typeof INSIGHTS;
  variant?: 'default' | 'info' | 'warning';
  className?: string;
}

export function ContextualInsight({ insightId, variant = 'default', className }: ContextualInsightProps) {
  const { isInsightDismissed, dismissInsight } = useMasterbook();
  const insight = INSIGHTS[insightId];

  if (!insight || isInsightDismissed(insight.id)) {
    return null;
  }

  return (
    <Alert className={cn('relative', variant === 'info' && 'border-info/50 bg-info/5', variant === 'warning' && 'border-warning/50 bg-warning/5', className)}>
      <AlertTitle className="pr-8">{insight.title}</AlertTitle>
      <AlertDescription>{insight.body}</AlertDescription>
      {insight.dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-6 w-6"
          onClick={() => dismissInsight(insight.id)}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </Alert>
  );
}
