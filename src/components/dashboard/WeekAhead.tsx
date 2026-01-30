/**
 * Week Ahead – Masterbook: tasks, milestones, risks, suggested focus for the coming week.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Flag, AlertTriangle, Target, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useMasterbook } from '@/contexts/MasterbookContext';
import { useCriticalPath } from '@/hooks/useCriticalPath';
import { addDays, startOfWeek, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WeekAheadItem } from '@/types/masterbook';

export function WeekAhead() {
  const navigate = useNavigate();
  const { tasks, milestones, projects } = usePortfolioData();
  const { getActiveRisks } = useMasterbook();
  const { criticalPathTaskIds } = useCriticalPath();

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekAheadItems = useMemo((): WeekAheadItem[] => {
    const items: WeekAheadItem[] = [];
    const activeRisks = getActiveRisks() ?? [];
    const safeTasks = tasks ?? [];
    const safeMilestones = milestones ?? [];

    for (const t of safeTasks) {
      if (t.status === 'done') continue;
      const due = t.dueDate ? new Date(t.dueDate) : null;
      if (due && isWithinInterval(due, { start: weekStart, end: weekEnd })) {
        items.push({
          type: 'task',
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          projectId: t.projectId,
          isCritical: criticalPathTaskIds.has(t.id),
          isBlocked: false,
        });
      }
    }

    for (const m of safeMilestones) {
      const due = new Date(m.dueDate);
      if (isWithinInterval(due, { start: weekStart, end: weekEnd })) {
        items.push({
          type: 'milestone',
          id: m.id,
          title: m.title,
          dueDate: m.dueDate,
          projectId: m.projectId,
        });
      }
    }

    for (const r of activeRisks) {
      if (r.dueDate && isWithinInterval(new Date(r.dueDate), { start: weekStart, end: weekEnd })) {
        items.push({
          type: 'risk_review',
          id: r.id,
          title: r.title,
          dueDate: r.dueDate,
          projectId: r.projectId,
          riskId: r.id,
        });
      }
    }

    items.sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return da - db;
    });
    return items.slice(0, 12);
  }, [tasks, milestones, weekStart, weekEnd, getActiveRisks, criticalPathTaskIds]);

  const suggestedFocus = useMemo(() => {
    const critical = weekAheadItems.filter((i) => i.isCritical);
    if (critical.length > 0) return critical.slice(0, 3);
    return weekAheadItems.slice(0, 3);
  }, [weekAheadItems]);

  if (weekAheadItems.length === 0 && suggestedFocus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Week Ahead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tasks or milestones due this week. Focus on backlog or planning.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/tasks')}>
            View tasks <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Week Ahead
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedFocus.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Suggested focus
            </p>
            <ul className="space-y-1.5">
              {suggestedFocus.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      item.type === 'task'
                        ? navigate('/tasks')
                        : item.type === 'milestone'
                          ? navigate(`/projects/${item.projectId}`)
                          : undefined
                    }
                    className={cn(
                      'flex items-center gap-2 text-sm w-full text-left rounded-md px-2 py-1.5 hover:bg-muted',
                      item.isCritical && 'border-l-2 border-primary pl-2'
                    )}
                  >
                    {item.type === 'milestone' && <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    {item.type === 'risk_review' && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                    {item.type === 'task' && <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className="truncate flex-1">{item.title}</span>
                    {item.isCritical && <Badge variant="outline" className="text-xs shrink-0">Critical</Badge>}
                    {item.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(item.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => navigate('/tasks')}>
          View all tasks & schedule
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
