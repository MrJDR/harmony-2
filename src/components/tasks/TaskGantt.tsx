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

export function TaskGantt({ tasks, teamMembers, onTaskEdit }: TaskGanttProps) {
  const headerTimelineRef = useRef<HTMLDivElement>(null);
  const bodyTimelineRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);

  const getAssignee = (assigneeId?: string) => teamMembers.find((m) => m.id === assigneeId);

  // Fixed date range based on tasks (no zooming/spacing changes during scroll)
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

  const days = useMemo(() => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }), [dateRange]);

  const totalDays = days.length;
  const dayWidth = 100 / totalDays;

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
    const taskStartIndex = differenceInDays(dueDate, dateRange.start) - 7;
    if (taskStartIndex < 0 || taskStartIndex > totalDays) return;

    // IMPORTANT: use the timeline scroller width only (NOT including the left task column)
    const scrollWidth = bodyTimelineRef.current.scrollWidth;
    const pxPerDay = scrollWidth / totalDays;
    const targetLeft = Math.max(0, taskStartIndex * pxPerDay);

    headerTimelineRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
    bodyTimelineRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);
    const startDiff = differenceInDays(dueDate, dateRange.start) - 7; // Assume 7 days duration
    const endDiff = differenceInDays(dueDate, dateRange.start);

    if (endDiff < 0) return null;

    return {
      left: `${Math.max(0, startDiff) * dayWidth}%`,
      width: `${(endDiff - Math.max(0, startDiff) + 1) * dayWidth}%`,
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
            <div className="flex min-w-[800px]">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-shrink-0 text-center py-2 text-xs',
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/50' : '',
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-primary/10' : ''
                  )}
                  style={{ width: `${dayWidth}%` }}
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
        {/* Left task column (does NOT scroll horizontally) */}
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
          <div className="min-w-[800px]">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const position = getTaskPosition(task);

                return (
                  <div key={task.id} className="relative border-b border-border py-3 px-1 h-[60px]">
                    {position && (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-6 rounded-full cursor-pointer',
                          'transition-all hover:h-8',
                          statusColors[task.status]
                        )}
                        style={{ left: position.left, width: position.width, minWidth: '24px' }}
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
