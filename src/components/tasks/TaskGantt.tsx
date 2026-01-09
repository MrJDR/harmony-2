import { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks, subWeeks, startOfWeek, eachWeekOfInterval, eachDayOfInterval, subDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';
import { DateRange } from 'react-day-picker';

interface TaskGanttProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
}

const statusColors = {
  todo: 'bg-muted-foreground/60',
  'in-progress': 'bg-primary',
  review: 'bg-warning',
  done: 'bg-success',
};

export function TaskGantt({ tasks, teamMembers, onTaskEdit, onTaskUpdate }: TaskGanttProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<{ task: Task; newStartDate: string; newDueDate: string } | null>(null);

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

  // Generate days for grid lines
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const dayWidth = 100 / totalDays;

  const getTaskPosition = (task: Task, offset = 0) => {
    if (!task.dueDate && !task.startDate) return null;
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const startDate = task.startDate ? new Date(task.startDate) : (dueDate ? subDays(dueDate, 7) : null);
    
    if (!startDate) return null;
    const endDate = dueDate || addDays(startDate, 7);
    
    const taskStartDiff = differenceInDays(startDate, dateRange.start) + offset;
    const taskEndDiff = differenceInDays(endDate, dateRange.start) + offset;
    
    // Task is completely outside visible range
    if (taskEndDiff < 0 || taskStartDiff > totalDays) {
      return { outOfView: true };
    }
    
    // Clamp to visible range
    const visibleStart = Math.max(0, taskStartDiff);
    const visibleEnd = Math.min(totalDays - 1, taskEndDiff);
    
    
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

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, task: Task) => {
    if (!onTaskUpdate) return;
    e.preventDefault();
    setDraggingTask(task);
    setDragOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingTask || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = timelineRect.width;
    const dayWidthPx = timelineWidth / totalDays;
    
    // Calculate the offset in days based on mouse movement
    const mouseX = e.clientX - timelineRect.left;
    
    // Get original task position
    const originalStart = draggingTask.startDate 
      ? new Date(draggingTask.startDate) 
      : (draggingTask.dueDate ? subDays(new Date(draggingTask.dueDate), 7) : new Date());
    const originalStartDiff = differenceInDays(originalStart, dateRange.start);
    const originalStartPx = originalStartDiff * dayWidthPx;
    
    // Calculate new offset in days
    const newOffset = Math.round((mouseX - originalStartPx - 30) / dayWidthPx); // 30px for grabbing in middle
    setDragOffset(newOffset);
  };

  const handleDragEnd = () => {
    if (!draggingTask || dragOffset === 0) {
      setDraggingTask(null);
      setDragOffset(0);
      return;
    }

    // Calculate new dates
    const originalStart = draggingTask.startDate 
      ? new Date(draggingTask.startDate) 
      : (draggingTask.dueDate ? subDays(new Date(draggingTask.dueDate), 7) : new Date());
    const originalEnd = draggingTask.dueDate 
      ? new Date(draggingTask.dueDate) 
      : addDays(originalStart, 7);

    const newStartDate = addDays(originalStart, dragOffset);
    const newDueDate = addDays(originalEnd, dragOffset);

    setPendingUpdate({
      task: draggingTask,
      newStartDate: format(newStartDate, 'yyyy-MM-dd'),
      newDueDate: format(newDueDate, 'yyyy-MM-dd'),
    });

    setDraggingTask(null);
    setDragOffset(0);
  };

  const handleConfirmUpdate = () => {
    if (!pendingUpdate || !onTaskUpdate) return;

    const updatedTask: Task = {
      ...pendingUpdate.task,
      startDate: pendingUpdate.newStartDate,
      dueDate: pendingUpdate.newDueDate,
    };

    onTaskUpdate(updatedTask);
    setPendingUpdate(null);
  };

  const handleCancelUpdate = () => {
    setPendingUpdate(null);
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 px-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  } else if (range?.from) {
                    setDateRange({ start: range.from, end: addWeeks(range.from, 8) });
                  }
                }}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Gantt Chart */}
      <div 
        className="rounded-lg border border-border bg-card overflow-hidden"
        onMouseMove={draggingTask ? handleDragMove : undefined}
        onMouseUp={draggingTask ? handleDragEnd : undefined}
        onMouseLeave={draggingTask ? handleDragEnd : undefined}
      >
        {/* Column Headers - Week view */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex min-w-[900px]">
            <div className="w-72 shrink-0 border-r border-border px-4 py-2">
              <span className="text-sm font-medium text-foreground">Task</span>
            </div>
            <div className="flex-1 flex">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center py-2 text-sm border-r border-border last:border-r-0",
                    isToday(week) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {format(week, 'MMM d')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day Headers - Shows when dragging */}
        {draggingTask && (
          <div className="border-b border-border bg-primary/5">
            <div className="flex min-w-[900px]">
              <div className="w-72 shrink-0 border-r border-border px-4 py-1">
                <span className="text-xs text-primary font-medium">Dragging: {draggingTask.title}</span>
              </div>
              <div className="flex-1 flex">
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center py-1 text-[10px] border-r border-border/30 last:border-r-0",
                      isToday(day) ? "bg-primary/20 text-primary font-bold" : 
                      day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50 text-muted-foreground" : "text-muted-foreground"
                    )}
                    style={{ width: `${dayWidth}%` }}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task Rows */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {tasks.length > 0 ? (
              tasks.map((task, index) => {
                const assignee = getAssignee(task.assigneeId);
                const isDragging = draggingTask?.id === task.id;
                const position = getTaskPosition(task, isDragging ? dragOffset : 0);

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
                          {(task.dueDate || task.startDate) && (
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

                    {/* Timeline Column */}
                    <div ref={index === 0 ? timelineRef : undefined} className="flex-1 relative py-3 px-2">
                      {/* Day grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {days.map((day, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "border-r last:border-r-0",
                              day.getDay() === 0 ? "border-border" : "border-border/20",
                              day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/30" : "",
                              isToday(day) ? "bg-primary/10" : ""
                            )}
                            style={{ width: `${dayWidth}%` }}
                          />
                        ))}
                      </div>

                      {position && position.outOfView ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground italic">Out of view</span>
                        </div>
                      ) : position ? (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-7 rounded",
                            "flex items-center justify-center text-xs font-medium text-white px-2",
                            "select-none",
                            statusColors[task.status],
                            isDragging 
                              ? "opacity-80 shadow-lg cursor-grabbing z-10 ring-2 ring-primary ring-offset-2" 
                              : onTaskUpdate 
                                ? "cursor-grab hover:h-9 hover:shadow-md transition-all" 
                                : "cursor-pointer hover:h-9 hover:shadow-md transition-all"
                          )}
                          style={{ left: position.left, width: position.width, minWidth: '60px' }}
                          onMouseDown={(e) => onTaskUpdate ? handleDragStart(e, task) : undefined}
                          onClick={() => !onTaskUpdate && onTaskEdit(task)}
                          title={onTaskUpdate ? "Drag to reschedule" : `${task.title}${task.startDate ? ` | Start: ${task.startDate}` : ''}${task.dueDate ? ` | Due: ${task.dueDate}` : ''}`}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingUpdate} onOpenChange={(open) => !open && handleCancelUpdate()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Task</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingUpdate && (
                  <>
                    <span>Move <strong>"{pendingUpdate.task.title}"</strong> to:</span>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Start Date:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-[160px] justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(new Date(pendingUpdate.newStartDate), 'MMM d, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(pendingUpdate.newStartDate)}
                              onSelect={(date) => {
                                if (date) {
                                  setPendingUpdate(prev => prev ? { ...prev, newStartDate: format(date, 'yyyy-MM-dd') } : null);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Due Date:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-[160px] justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(new Date(pendingUpdate.newDueDate), 'MMM d, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(pendingUpdate.newDueDate)}
                              onSelect={(date) => {
                                if (date) {
                                  setPendingUpdate(prev => prev ? { ...prev, newDueDate: format(date, 'yyyy-MM-dd') } : null);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
