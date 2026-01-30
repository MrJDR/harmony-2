/**
 * Critical Path Summary – Masterbook "Flow Reveals Truth".
 * Shows top critical path tasks; click to go to tasks/schedule.
 */

import { useNavigate } from 'react-router-dom';
import { GitBranch, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCriticalPath } from '@/hooks/useCriticalPath';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { cn } from '@/lib/utils';

export function CriticalPathSummary() {
  const navigate = useNavigate();
  const { criticalPathNodes, circularResult } = useCriticalPath();
  const { projects } = usePortfolioData();

  const criticalTasks = criticalPathNodes.filter((n) => n.isCritical);
  const displayTasks = criticalTasks.slice(0, 5);
  const projectName = (id: string) => (projects ?? []).find((p) => p.id === id)?.name ?? '';

  if (criticalTasks.length === 0 && !circularResult.hasCycle) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          Critical Path
          {criticalTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {criticalTasks.length} task{criticalTasks.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {circularResult.hasCycle && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">Circular dependency detected</p>
            <p className="text-muted-foreground mt-1">
              Resolve the cycle to compute the critical path. Check dependency settings on tasks.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/schedule')}>
              Open Schedule
            </Button>
          </div>
        )}
        {displayTasks.length > 0 && (
          <ul className="space-y-1.5">
            {displayTasks.map((n) => (
              <li key={n.taskId}>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className={cn(
                    'flex items-center gap-2 text-sm w-full text-left rounded-md px-2 py-1.5 hover:bg-muted',
                    'border-l-2 border-primary'
                  )}
                >
                  <span className="truncate flex-1">{n.taskTitle}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{projectName(n.projectId)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {criticalTasks.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => navigate('/schedule')}>
            View full timeline
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
