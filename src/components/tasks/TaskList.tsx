import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  ChevronRight, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  User,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { useWatch } from '@/contexts/WatchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Task, TeamMember, Subtask } from '@/types/portfolio';
import { format } from 'date-fns';
import { AssignmentActions } from './AssignmentActions';

interface TaskListProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTasksReorder?: (reorderedTasks: Task[]) => void;
  onSubtasksReorder?: (taskId: string, reorderedSubtasks: Subtask[]) => void;
  statusOptions?: Array<{ id: Task['status']; label: string; color: 'muted' | 'info' | 'success' | 'warning' | 'destructive' }>;
  priorityOptions?: Array<{ id: Task['priority']; label: string; color: 'muted' | 'info' | 'success' | 'warning' | 'destructive' }>;
}

import { defaultTaskPriorities, defaultTaskStatuses, taskPriorityMeta, taskStatusMeta } from '@/lib/workflow';

export function TaskList({
  tasks,
  teamMembers,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onTasksReorder,
  onSubtasksReorder,
  statusOptions,
  priorityOptions,
}: TaskListProps) {
  const { toast } = useToast();
  const { isWatching, toggleWatch } = useWatch();
  const { user } = useAuth();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);
  const [orderedSubtasks, setOrderedSubtasks] = useState<Record<string, Subtask[]>>({});
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Keep ordered tasks in sync with props using useEffect
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  // Keep ordered subtasks in sync with task subtasks
  useEffect(() => {
    const newOrderedSubtasks: Record<string, Subtask[]> = {};
    tasks.forEach(task => {
      newOrderedSubtasks[task.id] = task.subtasks || [];
    });
    setOrderedSubtasks(newOrderedSubtasks);
  }, [tasks]);

  // Build priority/status styling maps from options (custom or defaults)
  const priorityColors: Record<string, string> = {};
  (priorityOptions ?? defaultTaskPriorities).forEach((opt) => {
    const meta = taskPriorityMeta(opt.id, priorityOptions);
    priorityColors[opt.id] = `border-${meta.color} text-${meta.color}`;
  });

  const statusConfig: Record<string, { label: string; color: string }> = {};
  (statusOptions ?? defaultTaskStatuses).forEach((opt) => {
    const meta = taskStatusMeta(opt.id, statusOptions);
    statusConfig[opt.id] = { label: meta.label, color: `text-${meta.color}` };
  });

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse YYYY-MM-DD string to Date without timezone shift
  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const startEditingTitle = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveTitle = (taskId: string) => {
    if (editingTitle.trim()) {
      onTaskUpdate(taskId, { title: editingTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };
  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const toggleExpanded = (taskId: string) => {
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
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updates: Partial<Task> = { subtasks: updatedSubtasks };
    // Auto-complete task when all subtasks are done
    const allComplete = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    if (allComplete && task.status !== 'done') {
      updates.status = 'done';
      toast({
        title: "Task completed",
        description: `"${task.title}" marked done — all subtasks complete`,
      });
    }
    // Reopen task when unchecking a subtask on a completed task
    const anyIncomplete = updatedSubtasks.some(st => !st.completed);
    if (anyIncomplete && task.status === 'done') {
      updates.status = 'in-progress';
      toast({
        title: "Task reopened",
        description: `"${task.title}" moved to in-progress`,
      });
    }
    onTaskUpdate(task.id, updates);
  };

  const addSubtask = (task: Task) => {
    const title = newSubtaskInputs[task.id]?.trim();
    if (!title) return;
    
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title,
      completed: false,
    };
    const updates: Partial<Task> = { subtasks: [...task.subtasks, newSubtask] };
    // Reopen task when adding a new subtask to a completed task
    if (task.status === 'done') {
      updates.status = 'in-progress';
      toast({
        title: "Task reopened",
        description: `"${task.title}" moved to in-progress — new subtask added`,
      });
    }
    onTaskUpdate(task.id, updates);
    setNewSubtaskInputs(prev => ({ ...prev, [task.id]: '' }));
  };

  const deleteSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const getCompletedSubtasks = (subtasks: Subtask[]) => {
    return subtasks.filter(st => st.completed).length;
  };

  // Use refs to avoid stale closure issues in drag end handlers
  const orderedTasksRef = useRef<Task[]>(orderedTasks);
  const orderedSubtasksRef = useRef<Record<string, Subtask[]>>(orderedSubtasks);

  // Keep refs in sync with state
  useEffect(() => {
    orderedTasksRef.current = orderedTasks;
  }, [orderedTasks]);

  useEffect(() => {
    orderedSubtasksRef.current = orderedSubtasks;
  }, [orderedSubtasks]);

  const handleReorder = (reordered: Task[]) => {
    setOrderedTasks(reordered);
  };

  const handleReorderEnd = () => {
    if (onTasksReorder) {
      onTasksReorder(orderedTasksRef.current);
    }
  };

  const handleSubtasksReorder = (taskId: string, reordered: Subtask[]) => {
    setOrderedSubtasks(prev => ({ ...prev, [taskId]: reordered }));
  };

  const handleSubtasksReorderEnd = (taskId: string) => {
    if (onSubtasksReorder && orderedSubtasksRef.current[taskId]) {
      onSubtasksReorder(taskId, orderedSubtasksRef.current[taskId]);
    }
  };

  return (
    <div className="space-y-2" ref={dragConstraintsRef}>
      <Reorder.Group axis="y" values={orderedTasks} onReorder={handleReorder} className="space-y-2">
        {orderedTasks.map((task, index) => {
          const assignee = getAssignee(task.assigneeId);
          const isExpanded = expandedTasks.has(task.id);
          const completedSubtasks = getCompletedSubtasks(task.subtasks);
        
          return (
            <Reorder.Item
              key={task.id}
              value={task}
              onDragEnd={handleReorderEnd}
              className="rounded-lg border border-border bg-card shadow-card overflow-hidden group/card hover:border-primary/50 transition-colors cursor-pointer"
              whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
            >
              {/* Task Row */}
              <div 
                className={cn(
                  "flex items-center gap-3 p-4",
                  task.status === 'done' && "opacity-60"
                )}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button, input, [role="checkbox"], [role="combobox"], [data-radix-collection-item], [data-drag-handle]')) return;
                  onTaskEdit(task);
                }}
              >
                {/* Drag Handle */}
                <div 
                  data-drag-handle
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              {/* Expand/Collapse */}
              <button
                onClick={() => toggleExpanded(task.id)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )} 
                />
              </button>

              {/* Checkbox */}
              <Checkbox
                checked={task.status === 'done'}
                onCheckedChange={() => {
                  const newStatus = task.status === 'done' ? 'todo' : 'done';
                  const updates: Partial<Task> = { status: newStatus };
                  // Mark all subtasks complete when task is marked done
                  if (newStatus === 'done' && task.subtasks.length > 0) {
                    updates.subtasks = task.subtasks.map(st => ({ ...st, completed: true }));
                  }
                  onTaskUpdate(task.id, updates);
                }}
                className="h-5 w-5"
              />
              
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {editingTaskId === task.id ? (
                    <Input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => saveTitle(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(task.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="h-7 text-sm font-medium"
                    />
                  ) : (
                    <h4 
                      className={cn(
                        "font-medium text-foreground cursor-text hover:bg-muted px-1 -mx-1 rounded",
                        task.status === 'done' && "line-through text-muted-foreground"
                      )}
                      onClick={() => startEditingTitle(task)}
                    >
                      {task.title}
                    </h4>
                  )}
                  {/* Priority Dropdown */}
                  <Select 
                    value={task.priority} 
                    onValueChange={(value) => onTaskUpdate(task.id, { priority: value as Task['priority'] })}
                  >
                    <SelectTrigger className={cn(
                      "h-6 w-auto px-2 text-xs border cursor-pointer",
                      priorityColors[task.priority]
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {(priorityOptions ?? defaultTaskPriorities).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {task.subtasks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedSubtasks}/{task.subtasks.length} subtasks
                  </p>
                )}
              </div>

              {/* Due Date Picker */}
              <Popover 
                open={openDatePopover === task.id} 
                onOpenChange={(open) => setOpenDatePopover(open ? task.id : null)}
              >
                <PopoverTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer",
                    task.dueDate && parseDateLocal(task.dueDate) < new Date() && task.status !== 'done' 
                      ? "text-destructive" 
                      : "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {task.dueDate ? format(parseDateLocal(task.dueDate), 'MMM d') : 'Set date'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover pointer-events-auto" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={task.dueDate ? parseDateLocal(task.dueDate) : undefined}
                    onSelect={(date) => {
                      onTaskUpdate(task.id, {
                        dueDate: date ? formatDateLocal(date) : undefined,
                      });
                      setOpenDatePopover(null);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Assignee Dropdown */}
              <Select 
                value={task.assigneeId || 'unassigned'} 
                onValueChange={(value) => onTaskUpdate(task.id, { assigneeId: value === 'unassigned' ? undefined : value })}
              >
                <SelectTrigger className="h-7 w-auto px-2 border-0 bg-transparent cursor-pointer">
                  {task.assigneeId && getAssignee(task.assigneeId) ? (
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                      title={getAssignee(task.assigneeId)?.name}
                    >
                      {getAssignee(task.assigneeId)?.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/50">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Dropdown */}
              <Select 
                value={task.status} 
                onValueChange={(value) => {
                  const newStatus = value as Task['status'];
                  const updates: Partial<Task> = { status: newStatus };
                  // Mark all subtasks complete when task is marked done
                  if (newStatus === 'done' && task.subtasks.length > 0) {
                    updates.subtasks = task.subtasks.map(st => ({ ...st, completed: true }));
                  }
                  onTaskUpdate(task.id, updates);
                }}
              >
                <SelectTrigger className={cn(
                  "w-[110px] h-7 text-xs border-0 bg-transparent",
                  statusConfig[task.status].color
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {(statusOptions ?? defaultTaskStatuses).map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assignment Actions */}
              {task.assigneeId && (
                <AssignmentActions
                  taskId={task.id}
                  taskTitle={task.title}
                  assigneeId={task.assigneeId}
                  assigneeName={getAssignee(task.assigneeId)?.name}
                  teamMembers={teamMembers}
                  currentUserId={user?.id}
                  onAccept={() => {
                    toast({
                      title: 'Assignment accepted',
                      description: `You've accepted "${task.title}"`,
                    });
                  }}
                  onDecline={(newAssigneeId) => {
                    onTaskUpdate(task.id, { assigneeId: newAssigneeId || undefined });
                  }}
                  onReassign={(newAssigneeId) => {
                    onTaskUpdate(task.id, { assigneeId: newAssigneeId });
                  }}
                  compact
                />
              )}

              {/* Kebab Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleWatch(task.id, 'task', task.title)}>
                    {isWatching(task.id, 'task') ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Unwatch Task
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Watch Task
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit in Modal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Subtasks */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border bg-muted"
                >
                  <div className="p-4 pl-14 space-y-2">
                    <Reorder.Group 
                      axis="y" 
                      values={orderedSubtasks[task.id] || task.subtasks} 
                      onReorder={(reordered) => handleSubtasksReorder(task.id, reordered)}
                      className="space-y-2"
                    >
                      {(orderedSubtasks[task.id] || task.subtasks).map((subtask) => (
                        <Reorder.Item
                          key={subtask.id}
                          value={subtask}
                          onDragEnd={() => handleSubtasksReorderEnd(task.id)}
                          className="flex items-center gap-3 group bg-muted rounded"
                          whileDrag={{ scale: 1.02, backgroundColor: 'var(--card)' }}
                        >
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-background/50 rounded transition-colors"
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => toggleSubtask(task, subtask.id)}
                            className="h-4 w-4"
                          />
                          <span className={cn(
                            "flex-1 text-sm",
                            subtask.completed && "line-through text-muted-foreground"
                          )}>
                            {subtask.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteSubtask(task, subtask.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>

                    {/* Add Subtask */}
                    <div className="flex items-center gap-2 pt-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Add subtask"
                        value={newSubtaskInputs[task.id] || ''}
                        onChange={(e) => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addSubtask(task)}
                        className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reorder.Item>
        );
      })}
      </Reorder.Group>
    </div>
  );
}
