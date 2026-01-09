import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import { Focus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';

interface TaskGanttProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
}

const statusColors = {
  todo: 'bg-muted-foreground/50',
  'in-progress': 'bg-info',
  review: 'bg-warning',
  done: 'bg-success',
};

const LEFT_COL_WIDTH_CLASS = 'w-64';
const DAY_PX = 44; // fixed spacing between dates (no zoom)
const ASSUMED_TASK_DURATION_DAYS = 7;
const ROW_HEIGHT_PX = 60;

export function TaskGantt({ tasks, teamMembers, onTaskEdit }: TaskGanttProps) {
  const headerTimelineRef = useRef<HTMLDivElement>(null);
  const bodyTimelineRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);

  const getAssignee = (assigneeId?: string) => teamMembers.find((m) => m.id === assigneeId);

  // Fixed date range based on tasks (no zoom/scale changes during scroll)
  const naturalEnd = useMemo(() => {
    const tasksWithDates = tasks.filter((t) => t.dueDate);
    if (tasksWithDates.length === 0) return endOfMonth(new Date());
    const dates = tasksWithDates.map((t) => new Date(t.dueDate!));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    return addDays(endOfMonth(maxDate), 7);
  }, [tasks]);

  const dateRange = useMemo(() => {
    const tasksWithDates = tasks.filter((t) => t.dueDate);
    if (tasksWithDates.length === 0) {
      return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    }

    const dates = tasksWithDates.map((t) => new Date(t.dueDate!));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));

    return {
      start: addDays(startOfMonth(minDate), -7),
      end: naturalEnd,
    };
  }, [tasks, naturalEnd]);

  const days = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange]
  );

  const totalDays = days.length;
  const timelineWidthPx = totalDays * DAY_PX;

  const syncHeaderToBody = () => {
    if (!headerTimelineRef.current || !bodyTimelineRef.current) return;
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    bodyTimelineRef.current.scrollLeft = headerTimelineRef.current.scrollLeft;
    requestAnimationFrame(() => (isSyncingScrollRef.current = false));
  };

  const syncBodyToHeader = () => {
    if (!headerTimelineRef.current || !bodyTimelineRef.current) return;
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    headerTimelineRef.current.scrollLeft = bodyTimelineRef.current.scrollLeft;
    requestAnimationFrame(() => (isSyncingScrollRef.current = false));
  };

  const handleFocusTask = (task: Task) => {
    if (!task.dueDate || !headerTimelineRef.current || !bodyTimelineRef.current) return;

    const dueDate = new Date(task.dueDate);
    const taskStartIndex = differenceInDays(dueDate, dateRange.start) - ASSUMED_TASK_DURATION_DAYS;
    if (taskStartIndex < 0 || taskStartIndex > totalDays) return;

    const targetLeft = Math.max(0, taskStartIndex * DAY_PX);

    headerTimelineRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
    bodyTimelineRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);
    const startDiff = differenceInDays(dueDate, dateRange.start) - ASSUMED_TASK_DURATION_DAYS;
    const endDiff = differenceInDays(dueDate, dateRange.start);

    if (endDiff < 0) return null;

    const safeStart = Math.max(0, startDiff);
    const durationDays = endDiff - safeStart + 1;

    return {
      leftPx: safeStart * DAY_PX,
      widthPx: Math.max(24, durationDays * DAY_PX),
    };
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="flex">
          <div className={cn(LEFT_COL_WIDTH_CLASS, 'shrink-0 border-r border-border px-4 py-2')}>
            <span className="text-sm font-medium text-foreground">Task</span>
          </div>

          {/* Timeline header scrolls horizontally */}
          <div
            ref={headerTimelineRef}
            className="flex-1 overflow-x-auto"
            onScroll={syncHeaderToBody}
          >
            <div className="flex" style={{ width: timelineWidthPx }}>
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-shrink-0 text-center py-2 text-xs border-l border-border/30',
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/50' : '',
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-primary/10' : ''
                  )}
                  style={{ width: DAY_PX }}
                >
                  <div className="text-muted-foreground">{format(day, 'd')}</div>
                  {day.getDate() === 1 && (
                    <div className="text-xs font-medium text-foreground">{format(day, 'MMM')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Left task column (fixed; does NOT scroll horizontally) */}
        <div className={cn(LEFT_COL_WIDTH_CLASS, 'shrink-0 border-r border-border')}>
          {tasks.length > 0 ? (
            tasks.map((task, index) => {
              const assignee = getAssignee(task.assigneeId);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border hover:bg-muted/20 transition-colors px-4 py-3"
                  style={{ height: ROW_HEIGHT_PX }}
                >
                  <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => onTaskEdit(task)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground line-clamp-1">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs h-5',
                          task.priority === 'high'
                            ? 'border-destructive/50 text-destructive'
                            : task.priority === 'medium'
                              ? 'border-warning/50 text-warning'
                              : 'border-muted text-muted-foreground'
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {assignee && <span className="text-xs text-muted-foreground truncate">{assignee.name}</span>}
                      {task.dueDate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusTask(task);
                          }}
                          title="Scroll to this task"
                        >
                          <Focus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">No tasks</div>
          )}
        </div>

        {/* Timeline body scrolls horizontally */}
        <div ref={bodyTimelineRef} className="flex-1 overflow-x-auto" onScroll={syncBodyToHeader}>
          <div style={{ width: timelineWidthPx }}>
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const position = getTaskPosition(task);

                return (
                  <div
                    key={task.id}
                    className="relative border-b border-border py-3 px-1"
                    style={{ height: ROW_HEIGHT_PX }}
                  >
                    {position && (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-6 rounded-full cursor-pointer',
                          'transition-all hover:h-8',
                          statusColors[task.status]
                        )}
                        style={{ left: position.leftPx, width: position.widthPx }}
                        onClick={() => onTaskEdit(task)}
                        title={`${task.title} - Due: ${task.dueDate}`}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No tasks with due dates to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
