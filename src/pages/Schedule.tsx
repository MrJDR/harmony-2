import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuietAlert } from '@/components/shared/QuietAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScheduleSidebar } from '@/components/schedule/ScheduleSidebar';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleBlocks, useCreateScheduleBlock, useUpdateScheduleBlock, useDeleteScheduleBlock } from '@/hooks/useScheduleBlocks';
import { setMinutes, setHours, differenceInMinutes, parseISO } from 'date-fns';
import { User, Users, Flag, Calendar } from 'lucide-react';
import { useTaskDependencyIds } from '@/hooks/useTaskDependencies';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ScheduleSidebarItem } from '@/components/schedule/ScheduleSidebar';
import type { ViewMode } from '@/components/schedule/ScheduleCalendar';

function toUtc(d: Date): string {
  return d.toISOString();
}

export default function Schedule() {
  const { programs, projects, tasks, milestones, teamMembers, updateTask } = usePortfolioData();
  const { user, organization } = useAuth();
  const currentTeamMemberId = useMemo(() => {
    const email = user?.email?.toLowerCase();
    if (!email) return null;
    return teamMembers.find((m) => m.email?.toLowerCase() === email)?.id ?? null;
  }, [teamMembers, user?.email]);

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('my-schedule');

  const { data: blocks = [] } = useScheduleBlocks(viewMode === 'my-schedule' ? currentTeamMemberId ?? undefined : undefined);
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const { getForTask } = useTaskDependencyIds();

  type CascadePreview = {
    taskId: string;
    taskTitle: string;
    newStartUtc: string;
    newEndUtc: string;
    oldStartUtc: string;
    oldEndUtc: string;
    successorIds: string[];
  };
  const [cascadePreview, setCascadePreview] = useState<CascadePreview | null>(null);

  const handleDropFromSidebar = useCallback(
    (item: ScheduleSidebarItem, date: Date, hour: number) => {
      const orgId = organization?.id;
      if (!orgId) return;
      const start = setMinutes(setHours(date, hour), 0);
      const end = setMinutes(setHours(date, hour + 1), 0);
      const startUtc = toUtc(start);
      const endUtc = toUtc(end);
      const assigneeId = item.assigneeId ?? currentTeamMemberId ?? null;

      if (item.type === 'task') {
        createBlock.mutate({
          org_id: orgId,
          title: item.title,
          start_utc: startUtc,
          end_utc: endUtc,
          source_type: 'task',
          source_id: item.id,
          assignee_id: assigneeId,
        });
        updateTask(item.id, { startDate: start.toISOString().slice(0, 10), dueDate: end.toISOString().slice(0, 10) });
      } else if (item.type === 'milestone') {
        createBlock.mutate({
          org_id: orgId,
          title: item.title,
          start_utc: startUtc,
          end_utc: endUtc,
          source_type: 'milestone',
          source_id: item.id,
          assignee_id: assigneeId,
        });
      } else {
        createBlock.mutate({
          org_id: orgId,
          title: item.title,
          start_utc: startUtc,
          end_utc: endUtc,
          source_type: 'manual',
          assignee_id: assigneeId,
        });
      }
    },
    [organization?.id, currentTeamMemberId, createBlock, updateTask]
  );

  const handleBlockMove = useCallback(
    (blockId: string, newStartUtc: string, newEndUtc: string) => {
      if (blockId.startsWith('task-')) {
        const taskId = blockId.slice(5);
        const startDate = new Date(newStartUtc).toISOString().slice(0, 10);
        const dueDate = new Date(newEndUtc).toISOString().slice(0, 10);
        updateTask(taskId, { startDate, dueDate });
      } else {
        updateBlock.mutate({ id: blockId, start_utc: newStartUtc, end_utc: newEndUtc });
      }
    },
    [updateBlock, updateTask]
  );

  const handleCreateBlock = useCallback(
    (payload: { title: string; startUtc: string; endUtc: string; assigneeId: string | null }) => {
      const orgId = organization?.id;
      if (!orgId) return;
      createBlock.mutate({
        org_id: orgId,
        title: payload.title,
        start_utc: payload.startUtc,
        end_utc: payload.endUtc,
        source_type: 'manual',
        assignee_id: payload.assigneeId,
      });
    },
    [organization?.id, createBlock]
  );

  const orgId = organization?.id;

  const hasAnyScheduleItem =
    blocks.length > 0 ||
    tasks.some((t) => t.startDate || t.dueDate) ||
    projects.some((p) => p.startDate && p.endDate) ||
    milestones.length > 0;

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Schedule"
          description={
            <>
              Drag items onto the calendar to schedule. Double-click a slot to add a block.
              <span className="ml-1 text-muted-foreground/80 text-xs">Times in your local timezone.</span>
            </>
          }
        />

        {conflictCount > 0 && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-border/80 bg-muted/30">
            <QuietAlert>
              {conflictCount} overlapping block{conflictCount !== 1 ? 's' : ''} (same person). Reschedule to resolve.
            </QuietAlert>
          </div>
        )}

        {cascadePreview && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-border/80 bg-muted/30">
            <QuietAlert className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                Moving &quot;{cascadePreview.taskTitle}&quot; will reschedule {cascadePreview.successorIds.length} successor(s):{' '}
                {tasks.filter((t) => cascadePreview.successorIds.includes(t.id)).map((t) => t.title).join(', ')}.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCascadeApply}
                  className="text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
                  aria-label="Apply reschedule to successors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleCascadeCancel}
                  className="text-xs font-medium text-muted-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
                  aria-label="Cancel cascade"
                >
                  Cancel
                </button>
              </div>
            </QuietAlert>
          </div>
        )}

        <div className="flex-1 flex min-h-0 p-4 gap-4">
          <aside className="w-72 flex-shrink-0 flex flex-col min-h-0">
            {programs.length === 0 ? (
              <EmptyState
                icon={Flag}
                title="No programs"
                description="Create a program and add projects to see items here."
              />
            ) : (
              <ScheduleSidebar
                programs={programs}
                projects={projects}
                tasks={tasks}
                milestones={milestones}
              />
            )}
          </aside>

          <main className="flex-1 flex flex-col min-h-0 min-w-0">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-shrink-0 mb-2">
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="my-schedule" className="gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" />
                  My schedule
                </TabsTrigger>
                <TabsTrigger value="my-team" className="gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  My team
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 min-h-0 flex flex-col">
              <ScheduleCalendar
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                blocks={blocks}
                tasks={tasks}
                projects={projects}
                milestones={milestones}
                teamMembers={teamMembers}
                currentAssigneeId={currentTeamMemberId}
                viewMode={viewMode}
                onDropFromSidebar={handleDropFromSidebar}
                onBlockMove={handleBlockMove}
                createBlock={orgId ? handleCreateBlock : undefined}
                updateTaskDates={(taskId, startDate, dueDate) => {
                  updateTask(taskId, { startDate: startDate ?? undefined, dueDate: dueDate ?? undefined });
                }}
                onConflictCountChange={setConflictCount}
              />
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
