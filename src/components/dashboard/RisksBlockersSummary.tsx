/**
 * Risks & Blockers Summary – Masterbook "Uncertainty Brings Opportunity".
 * Active risks and blocked tasks; all dismissible / navigable.
 */

import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { useTaskDependencyIds } from '@/hooks/useTaskDependencies';
import { cn } from '@/lib/utils';

const severityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  critical: 'bg-destructive/20 text-destructive',
};

export function RisksBlockersSummary() {
  const navigate = useNavigate();
  const { tasks, projects } = usePortfolioData();
  const { getActiveRisks } = useMasterbook();
  const { getForTask } = useTaskDependencyIds();

  const activeRisks = getActiveRisks() ?? [];
  const highRisks = activeRisks.filter((r) => r.severity === 'high' || r.severity === 'critical');

  const safeTasks = tasks ?? [];
  const blockedTaskIds = new Set<string>();
  for (const t of safeTasks) {
    if (t.status === 'done') continue;
    const { blocks } = getForTask(t.id);
    if (blocks.length > 0) {
      const allPredecessorsDone = blocks.every((predId) => {
        const pred = safeTasks.find((x) => x.id === predId);
        return pred?.status === 'done';
      });
      if (!allPredecessorsDone) blockedTaskIds.add(t.id);
    }
  }
  const blockedTasks = safeTasks.filter((t) => blockedTaskIds.has(t.id)).slice(0, 5);
  const projectName = (id: string) => (projects ?? []).find((p) => p.id === id)?.name ?? '';

  if (activeRisks.length === 0 && blockedTasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Risks & Blockers
          {(activeRisks.length > 0 || blockedTasks.length > 0) && (
            <Badge variant="secondary" className="text-xs font-normal">
              {activeRisks.length} risk{activeRisks.length !== 1 ? 's' : ''}
              {blockedTasks.length > 0 && ` · ${blockedTasks.length} blocked`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {highRisks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              High / critical risks
            </p>
            <ul className="space-y-1.5">
              {highRisks.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(r.projectId ? `/projects/${r.projectId}` : '/programs')}
                    className="flex items-center gap-2 text-sm w-full text-left rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', r.severity === 'critical' ? 'text-destructive' : 'text-warning')} />
                    <span className="truncate flex-1">{r.title}</span>
                    <Badge variant="outline" className={cn('text-xs shrink-0', severityColors[r.severity])}>
                      {r.severity}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {blockedTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Blocked tasks
            </p>
            <ul className="space-y-1.5">
              {blockedTasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => navigate('/tasks')}
                    className="flex items-center gap-2 text-sm w-full text-left rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span className="truncate flex-1">{t.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{projectName(t.projectId)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => navigate('/programs')}>
          Risk register & timeline
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
