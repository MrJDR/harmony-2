import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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

const priorityColors = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

const statusColors = {
  todo: 'bg-muted-foreground/50',
  'in-progress': 'bg-info',
  review: 'bg-warning',
  done: 'bg-success',
};

export function TaskGantt({ tasks, teamMembers, onTaskEdit }: TaskGanttProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  // Calculate date range
  const dateRange = useMemo(() => {
    const tasksWithDates = tasks.filter((t) => t.dueDate);
    if (tasksWithDates.length === 0) {
      return {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      };
    }

    const dates = tasksWithDates.map((t) => new Date(t.dueDate!));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      start: addDays(startOfMonth(minDate), -7),
      end: addDays(endOfMonth(maxDate), 7),
    };
  }, [tasks]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const totalDays = days.length;
  const dayWidth = 100 / totalDays;

  const handleFocusTask = (task: Task) => {
    if (!task.dueDate || !scrollContainerRef.current) return;
    const dueDate = new Date(task.dueDate);
    const daysDiff = differenceInDays(dueDate, dateRange.start);
    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    const targetScroll = (daysDiff / totalDays) * container.scrollWidth - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, Math.min(scrollWidth, targetScroll)), behavior: 'smooth' });
    // Sync header scroll
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollTo({ left: Math.max(0, Math.min(scrollWidth, targetScroll)), behavior: 'smooth' });
    }
  };


  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const startDiff = differenceInDays(dueDate, dateRange.start) - 7; // Assume 7 days duration
    const endDiff = differenceInDays(dueDate, dateRange.start);
    
    return {
      left: `${Math.max(0, startDiff) * dayWidth}%`,
      width: `${(endDiff - Math.max(0, startDiff) + 1) * dayWidth}%`,
    };
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header with dates */}
      <div ref={headerScrollRef} className="border-b border-border bg-muted/30 overflow-x-auto">
        <div className="flex min-w-[800px]">
          <div className="w-64 shrink-0 border-r border-border px-4 py-2">
            <span className="text-sm font-medium text-foreground">Task</span>
          </div>
          <div className="flex-1 flex">
            {days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex-shrink-0 text-center py-2 text-xs",
                  day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : "",
                  format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "bg-primary/10" : ""
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

      {/* Task rows */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="min-w-[800px]">
          {tasks.length > 0 ? (
            tasks.map((task, index) => {
              const assignee = getAssignee(task.assigneeId);
              const position = getTaskPosition(task);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <div className="w-64 shrink-0 border-r border-border px-4 py-3">
                    <div 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onTaskEdit(task)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-1">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs h-5", 
                            task.priority === 'high' ? 'border-destructive/50 text-destructive' :
                            task.priority === 'medium' ? 'border-warning/50 text-warning' : 
                            'border-muted text-muted-foreground'
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {assignee && (
                          <span className="text-xs text-muted-foreground truncate">
                            {assignee.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocusTask(task);
                            }}
                            title="Focus on this task's date range"
                          >
                            <Focus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative py-3 px-1">
                    {position && (
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-6 rounded-full cursor-pointer",
                          "transition-all hover:h-8",
                          statusColors[task.status]
                        )}
                        style={{ left: position.left, width: position.width, minWidth: '24px' }}
                        onClick={() => onTaskEdit(task)}
                        title={`${task.title} - Due: ${task.dueDate}`}
                      />
                    )}
                  </div>
                </motion.div>
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
  );
}
