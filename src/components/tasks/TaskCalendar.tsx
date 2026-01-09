import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Eye, EyeOff, Focus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';
import { useWatch } from '@/contexts/WatchContext';

interface TaskCalendarProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
}

const statusConfig = {
  'todo': { label: 'Todo', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' },
  'in-progress': { label: 'In Progress', color: 'bg-info', textColor: 'text-info' },
  'review': { label: 'Review', color: 'bg-warning', textColor: 'text-warning' },
  'done': { label: 'Done', color: 'bg-success', textColor: 'text-success' },
};

const priorityConfig = {
  'low': { label: 'Low', color: 'bg-muted-foreground' },
  'medium': { label: 'Medium', color: 'bg-warning' },
  'high': { label: 'High', color: 'bg-destructive' },
};

export function TaskCalendar({ tasks, teamMembers, onTaskEdit }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const { isWatching, toggleWatch } = useWatch();

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const focusTask = (task: Task) => {
    const targetDate = task.startDate || task.dueDate;
    if (targetDate) {
      setCurrentMonth(new Date(targetDate));
      setFocusedTaskId(task.id);
      // Clear focus highlight after a moment
      setTimeout(() => setFocusedTaskId(null), 2000);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getTasksForDay = (day: Date) => {
    return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex gap-4">
      {/* Left Sidebar - Task List */}
      <div className="w-72 flex-shrink-0 rounded-lg border border-border bg-card overflow-visible">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">All Tasks</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{tasks.length} tasks</p>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {tasks.map((task) => {
              const assignee = getAssignee(task.assigneeId);
              const watching = isWatching(task.id, 'task');
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskEdit(task)}
                  className="group rounded-lg p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", statusConfig[task.status].color)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium text-foreground truncate",
                        task.status === 'done' && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            task.status === 'done' && "bg-success/20 text-success",
                            task.status === 'in-progress' && "bg-info/20 text-info",
                            task.status === 'todo' && "bg-muted text-muted-foreground",
                            task.status === 'review' && "bg-warning/20 text-warning"
                          )}
                        >
                          {statusConfig[task.status].label}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(task.startDate || task.dueDate) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusTask(task);
                          }}
                          title="Focus on calendar"
                        >
                          <Focus className="h-3 w-3" />
                        </Button>
                      )}
                      {watching && (
                        <Eye className="h-3 w-3 text-primary" />
                      )}
                      {assignee && (
                        <div 
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground"
                          title={assignee.name}
                        >
                          {assignee.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Calendar */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="font-display text-lg font-semibold text-foreground ml-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[90px] border-b border-r border-border p-1.5",
                  !isCurrentMonth && "bg-muted/20",
                  index % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex items-center justify-end gap-1 mb-1">
                  {isToday && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary">
                      Today
                    </Badge>
                  )}
                  <span className={cn(
                    "text-sm",
                    isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
                    !isToday && !isCurrentMonth && "text-muted-foreground",
                    !isToday && isCurrentMonth && "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map((task) => {
                    const assignee = getAssignee(task.assigneeId);
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskEdit(task)}
                        className={cn(
                          "group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-all",
                          task.status === 'done' && "bg-success/10",
                          task.status === 'in-progress' && "bg-info/10",
                          task.status === 'todo' && "bg-muted/50",
                          task.status === 'review' && "bg-warning/10",
                          "hover:opacity-80",
                          focusedTaskId === task.id && "ring-2 ring-primary ring-offset-1 bg-primary/20"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusConfig[task.status].color)} />
                        <span className={cn(
                          "flex-1 truncate text-foreground",
                          task.status === 'done' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </span>
                        {assignee && (
                          <div 
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-medium text-accent-foreground flex-shrink-0"
                            title={assignee.name}
                          >
                            {assignee.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 border-t border-border bg-muted/20 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Status:</span>
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", config.color)} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Priority:</span>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", config.color)} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
