import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff, Focus, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Task, TeamMember, Subtask } from '@/types/portfolio';
import { useWatch } from '@/contexts/WatchContext';
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';
import type { ScheduleBlock } from '@/domains/schedule/model';

interface TaskCalendarProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  scheduleBlocks?: ScheduleBlock[];
  activeFilters?: {
    status?: string | null;
    assignee?: string | null;
    priority?: string | null;
    dateRange?: boolean;
  };
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

export function TaskCalendar({ tasks, teamMembers, onTaskEdit, onTaskUpdate, scheduleBlocks = [], activeFilters }: TaskCalendarProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const { isWatching, toggleWatch } = useWatch();

  const toggleExpanded = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    if (!onTaskUpdate) return;
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updates: Partial<Task> = { subtasks: updatedSubtasks };
    const allComplete = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    if (allComplete && task.status !== 'done') {
      updates.status = 'done';
      toast({ title: "Task completed", description: `"${task.title}" marked done — all subtasks complete` });
    }
    const anyIncomplete = updatedSubtasks.some(st => !st.completed);
    if (anyIncomplete && task.status === 'done') {
      updates.status = 'in-progress';
      toast({ title: "Task reopened", description: `"${task.title}" moved to in-progress` });
    }
    onTaskUpdate(task.id, updates);
  };

  const addSubtask = (task: Task) => {
    if (!onTaskUpdate) return;
    const title = newSubtaskInputs[task.id]?.trim();
    if (!title) return;
    const newSubtask: Subtask = { id: `subtask-${Date.now()}`, title, completed: false };
    const updates: Partial<Task> = { subtasks: [...task.subtasks, newSubtask] };
    if (task.status === 'done') {
      updates.status = 'in-progress';
      toast({ title: "Task reopened", description: `"${task.title}" moved to in-progress — new subtask added` });
    }
    onTaskUpdate(task.id, updates);
    setNewSubtaskInputs(prev => ({ ...prev, [task.id]: '' }));
  };

  const deleteSubtask = (task: Task, subtaskId: string) => {
    if (!onTaskUpdate) return;
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  // Generate contextual title based on active filters
  const getContextualTitle = () => {
    const parts: string[] = [];
    
    if (activeFilters?.status) {
      const statusLabel = statusConfig[activeFilters.status as keyof typeof statusConfig]?.label;
      if (statusLabel) parts.push(statusLabel);
    }
    
    if (activeFilters?.priority) {
      parts.push(`${activeFilters.priority.charAt(0).toUpperCase() + activeFilters.priority.slice(1)} Priority`);
    }
    
    if (activeFilters?.assignee) {
      const member = teamMembers.find(m => m.id === activeFilters.assignee);
      if (member) parts.push(member.name.split(' ')[0] + "'s");
    }
    
    if (activeFilters?.dateRange) {
      parts.push("Date Filtered");
    }
    
    if (parts.length === 0) return "All Tasks";
    return parts.join(" · ") + " Tasks";
  };

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const focusTask = (task: Task) => {
    const targetDate = task.startDate || task.dueDate;
    if (targetDate) {
      setCurrentMonth(new Date(targetDate));
      setFocusedTaskId(task.id);
    }
  };

  const clearFocus = () => {
    setFocusedTaskId(null);
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

  const getBlocksForDay = (day: Date) => {
    return scheduleBlocks.filter((b) => {
      const start = parseISO(b.start_utc);
      const end = parseISO(b.end_utc);
      return isSameDay(start, day) || isSameDay(end, day) || (start <= day && end >= day);
    });
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
            <span className="font-medium text-foreground">{getContextualTitle()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{tasks.length} tasks</p>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {tasks.map((task) => {
              const assignee = getAssignee(task.assigneeId);
              const watching = isWatching(task.id, 'task');
              const isExpanded = expandedTasks.has(task.id);
              const completedSubtasks = task.subtasks.filter(st => st.completed).length;
              
              return (
                <div key={task.id}>
                  <div
                    onClick={() => onTaskEdit(task)}
                    className="group rounded-lg p-2 hover:bg-muted cursor-pointer transition-colors hover:ring-1 hover:ring-primary/30"
                  >
                    <div className="flex items-start gap-2">
                      {/* Chevron on far left */}
                      <div className="flex-shrink-0 w-5 flex items-center justify-center">
                        {task.subtasks.length > 0 ? (
                          <button
                            onClick={(e) => toggleExpanded(task.id, e)}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                          >
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                !isExpanded && "-rotate-90"
                              )} 
                            />
                          </button>
                        ) : (
                          <span className={cn("h-2 w-2 rounded-full", statusConfig[task.status].color)} />
                        )}
                      </div>
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
                          {task.subtasks.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {completedSubtasks}/{task.subtasks.length}
                            </span>
                          )}
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
                  
                  {/* Subtasks */}
                  <AnimatePresence>
                    {isExpanded && task.subtasks.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 pl-2 border-l border-border"
                      >
                        <div className="py-1 space-y-1">
                          {task.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="flex items-center gap-2 group py-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={() => toggleSubtask(task, subtask.id)}
                                className="h-3.5 w-3.5"
                              />
                              <span className={cn(
                                "flex-1 text-xs",
                                subtask.completed && "line-through text-muted-foreground"
                              )}>
                                {subtask.title}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteSubtask(task, subtask.id)}
                              >
                                <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                          {/* Add Subtask */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Add subtask"
                              value={newSubtaskInputs[task.id] || ''}
                              onChange={(e) => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addSubtask(task)}
                              className="h-5 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Calendar */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden" onClick={clearFocus}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
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
        <div className="grid grid-cols-7 border-b border-border bg-muted">
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
            const dayBlocks = getBlocksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[90px] border-b border-r border-border p-1.5",
                  !isCurrentMonth && "bg-muted",
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
                  {dayBlocks.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className="rounded px-1.5 py-0.5 text-xs bg-muted/80 text-muted-foreground truncate"
                      title={b.title}
                    >
                      {b.title}
                    </div>
                  ))}
                  {dayBlocks.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">+{dayBlocks.length - 2} blocks</div>
                  )}
                  {dayTasks.slice(0, 2).map((task) => {
                    const assignee = getAssignee(task.assigneeId);
                    
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskEdit(task);
                        }}
                        className={cn(
                          "group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-all",
                          task.status === 'done' && "bg-success/10",
                          task.status === 'in-progress' && "bg-info/10",
                          task.status === 'todo' && "bg-muted",
                          task.status === 'review' && "bg-warning/10",
                          "hover:opacity-80 hover:ring-1 hover:ring-primary/30",
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
        <div className="flex items-center gap-6 border-t border-border bg-muted px-4 py-2">
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
