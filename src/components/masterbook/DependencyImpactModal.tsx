/**
 * Dependency Impact Modal – Masterbook "Flow Reveals Truth" / "Guided Flexibility".
 * Shows contextual impact when adding a dependency; circular dependency alternatives; downstream effects.
 */

import { useMemo } from 'react';
import { GitBranch, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCriticalPath } from '@/hooks/useCriticalPath';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import type { Task } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface DependencyImpactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Predecessor task (blocker) */
  predecessorTask: Task;
  /** Successor task (blocked) */
  successorTask: Task;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DependencyImpactModal({
  open,
  onOpenChange,
  predecessorTask,
  successorTask,
  onConfirm,
  onCancel,
}: DependencyImpactModalProps) {
  const { projects, milestones } = usePortfolioData();
  const { getDownstreamForTask, wouldCreateCycle, isOnCriticalPath } = useCriticalPath();

  const projectName = (id: string) => (projects ?? []).find((p) => p.id === id)?.name ?? '';
  const milestoneName = (id: string) => (milestones ?? []).find((m) => m.id === id)?.title ?? '';

  const downstream = useMemo(
    () => getDownstreamForTask(successorTask.id),
    [getDownstreamForTask, successorTask.id]
  );

  const createsCycle = wouldCreateCycle(predecessorTask.id, successorTask.id);

  const predCritical = isOnCriticalPath(predecessorTask.id);
  const succCritical = isOnCriticalPath(successorTask.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Dependency impact
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Adding: <strong>{predecessorTask.title}</strong> blocks <strong>{successorTask.title}</strong>.
          </p>

          {createsCycle && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Circular dependency</p>
                <p className="text-muted-foreground mt-1">
                  This link would create a cycle. Consider removing an existing dependency in the chain instead.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(predCritical && 'border-primary text-primary')}>
              {projectName(predecessorTask.projectId)}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={cn(succCritical && 'border-primary text-primary')}>
              {projectName(successorTask.projectId)}
            </Badge>
            {(predCritical || succCritical) && (
              <span className="text-xs text-muted-foreground">(Critical path)</span>
            )}
          </div>

          {downstream.length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-2">Downstream tasks ({downstream.length})</p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {downstream.slice(0, 8).map((d) => (
                  <li key={d.taskId} className="flex items-center gap-2 text-muted-foreground">
                    <span className="truncate">{d.taskTitle}</span>
                    <span className="text-xs shrink-0">depth {d.depth}</span>
                  </li>
                ))}
                {downstream.length > 8 && <li className="text-xs text-muted-foreground">+{downstream.length - 8} more</li>}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Moving the predecessor&apos;s dates will affect the successor and downstream tasks on the timeline.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onCancel(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false); }} disabled={createsCycle}>
            Add dependency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
