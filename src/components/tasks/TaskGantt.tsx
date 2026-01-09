import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks, subWeeks, startOfWeek, eachWeekOfInterval, subDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';

interface TaskGanttProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
}

const statusColors = {
  todo: 'bg-muted-foreground/60',
  'in-progress': 'bg-primary',
  review: 'bg-warning',
  done: 'bg-success',
};

const statusLabels = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function TaskGantt({ tasks, teamMembers, onTaskEdit }: TaskGanttProps) {
  // Calculate initial date range from tasks
  const initialRange = useMemo(() => {
    const tasksWithDates = tasks.filter((t) => t.dueDate || t.startDate);
    if (tasksWithDates.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(subWeeks(today, 1)),
        end: addWeeks(today, 8),
      };
    }

    const allDates: Date[] = [];
    tasksWithDates.forEach((t) => {
      if (t.startDate) allDates.push(new Date(t.startDate));
      if (t.dueDate) allDates.push(new Date(t.dueDate));
    });
    
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    return {
      start: startOfWeek(subDays(minDate, 7)),
      end: addWeeks(maxDate, 4),
    };
  }, [tasks]);

  const [dateRange, setDateRange] = useState(initialRange);

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const handleFocusTask = (task: Task) => {
    if (!task.dueDate && !task.startDate) return;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const taskStart = task.startDate ? new Date(task.startDate) : (dueDate ? subDays(dueDate, 7) : new Date());
    const taskEnd = dueDate || addDays(taskStart, 7);
    
    setDateRange({
      start: startOfWeek(subDays(taskStart, 7)),
      end: addWeeks(taskEnd, 2),
    });
  };

  const navigateRange = (direction: 'prev' | 'next') => {
    const weeksToMove = 4;
    setDateRange(prev => ({
      start: direction === 'prev' ? subWeeks(prev.start, weeksToMove) : addWeeks(prev.start, weeksToMove),
      end: direction === 'prev' ? subWeeks(prev.end, weeksToMove) : addWeeks(prev.end, weeksToMove),
    }));
  };

  const goToToday = () => {
    const today = new Date();
    setDateRange({
      start: startOfWeek(subWeeks(today, 1)),
      end: addWeeks(today, 8),
    });
  };

  // Generate weeks for column headers
  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate && !task.startDate) return null;
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const startDate = task.startDate ? new Date(task.startDate) : (dueDate ? subDays(dueDate, 7) : null);
    
    if (!startDate) return null;
    const endDate = dueDate || addDays(startDate, 7);
    
    const taskStartDiff = differenceInDays(startDate, dateRange.start);
    const taskEndDiff = differenceInDays(endDate, dateRange.start);
    
    // Task is completely outside visible range
    if (taskEndDiff < 0 || taskStartDiff > totalDays) {
      return { outOfView: true };
    }
    
    // Clamp to visible range
    const visibleStart = Math.max(0, taskStartDiff);
    const visibleEnd = Math.min(totalDays - 1, taskEndDiff);
    
    const dayWidth = 100 / totalDays;
    
    return {
      outOfView: false,
      left: `${visibleStart * dayWidth}%`,
      width: `${Math.max(1, (visibleEnd - visibleStart + 1)) * dayWidth}%`,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  const todayInRange = isWithinInterval(new Date(), { start: dateRange.start, end: dateRange.end });

  return (
    <div className="space-y-4">
      {/* Date Range Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateRange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateRange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Column Headers */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex min-w-[900px]">
            <div className="w-72 shrink-0 border-r border-border px-4 py-3">
              <span className="text-sm font-medium text-foreground">Task</span>
            </div>
            <div className="flex-1 flex">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center py-3 text-sm border-r border-border last:border-r-0",
                    isToday(week) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {format(week, 'MMM d')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {tasks.length > 0 ? (
              tasks.map((task, index) => {
                const assignee = getAssignee(task.assigneeId);
                const position = getTaskPosition(task);
                const initials = assignee?.name.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    {/* Task Info Column */}
                    <div className="w-72 shrink-0 border-r border-border px-4 py-3">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onTaskEdit(task)}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium text-sm line-clamp-1",
                            task.status === 'done' && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-xs h-5 px-1.5",
                                task.status === 'done' && "bg-success/20 text-success",
                                task.status === 'in-progress' && "bg-primary/20 text-primary",
                                task.status === 'review' && "bg-warning/20 text-warning",
                                task.status === 'todo' && "bg-muted text-muted-foreground"
                              )}
                            >
                              {statusLabels[task.status]}
                            </Badge>
                            {(task.dueDate || task.startDate) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFocusTask(task);
                                }}
                                title="Focus on this task"
                              >
                                <Focus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Column */}
                    <div className="flex-1 relative py-3 px-2">
                      {/* Week grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {weeks.map((_, i) => (
                          <div key={i} className="flex-1 border-r border-border/50 last:border-r-0" />
                        ))}
                      </div>

                      {position && position.outOfView ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground italic">Out of view</span>
                        </div>
                      ) : position ? (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-7 rounded cursor-pointer",
                            "transition-all hover:h-9 hover:shadow-md",
                            "flex items-center justify-center text-xs font-medium text-white px-2",
                            statusColors[task.status]
                          )}
                          style={{ left: position.left, width: position.width, minWidth: '60px' }}
                          onClick={() => onTaskEdit(task)}
                          title={`${task.title}${task.startDate ? ` | Start: ${task.startDate}` : ''}${task.dueDate ? ` | Due: ${task.dueDate}` : ''}`}
                        >
                          <span className="truncate">{task.title}</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No tasks to display
              </div>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted-foreground/60" />
              <span className="text-muted-foreground">Todo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-warning" />
              <span className="text-muted-foreground">Review</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-muted-foreground">Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
