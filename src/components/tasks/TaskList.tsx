import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  Check,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { Task, TeamMember, Subtask } from '@/types/portfolio';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const statusConfig: Record<Task['status'], { label: string; color: string }> = {
  todo: { label: 'todo', color: 'text-muted-foreground' },
  'in-progress': { label: 'in-progress', color: 'text-info' },
  review: { label: 'review', color: 'text-warning' },
  done: { label: 'done', color: 'text-success' },
};

const priorityColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-muted',
};

export function TaskList({ tasks, teamMembers, onTaskUpdate, onTaskEdit, onTaskDelete }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

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
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const addSubtask = (task: Task) => {
    const title = newSubtaskInputs[task.id]?.trim();
    if (!title) return;
    
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title,
      completed: false,
    };
    onTaskUpdate(task.id, { subtasks: [...task.subtasks, newSubtask] });
    setNewSubtaskInputs(prev => ({ ...prev, [task.id]: '' }));
  };

  const deleteSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const getCompletedSubtasks = (subtasks: Subtask[]) => {
    return subtasks.filter(st => st.completed).length;
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const assignee = getAssignee(task.assigneeId);
        const isExpanded = expandedTasks.has(task.id);
        const completedSubtasks = getCompletedSubtasks(task.subtasks);
        
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="rounded-lg border border-border bg-card shadow-card overflow-hidden"
          >
            {/* Task Row */}
            <div className={cn(
              "flex items-center gap-3 p-4",
              task.status === 'done' && "opacity-60"
            )}>
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
                  onTaskUpdate(task.id, { status: newStatus });
                }}
                className="h-5 w-5"
              />
              
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-medium text-foreground",
                    task.status === 'done' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h4>
                  <Badge variant="outline" className={cn('text-xs border', priorityColors[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
                {task.subtasks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedSubtasks}/{task.subtasks.length} subtasks
                  </p>
                )}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-xs text-muted-foreground",
                  new Date(task.dueDate) < new Date() && task.status !== 'done' && "text-destructive"
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}

              {/* Assignee */}
              {assignee && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                  title={assignee.name}
                >
                  {assignee.name.split(' ').map((n) => n[0]).join('')}
                </div>
              )}

              {/* Status Dropdown */}
              <Select 
                value={task.status} 
                onValueChange={(value) => onTaskUpdate(task.id, { status: value as Task['status'] })}
              >
                <SelectTrigger className={cn(
                  "w-[110px] h-7 text-xs border-0 bg-transparent",
                  statusConfig[task.status].color
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">todo</SelectItem>
                  <SelectItem value="in-progress">in-progress</SelectItem>
                  <SelectItem value="review">review</SelectItem>
                  <SelectItem value="done">done</SelectItem>
                </SelectContent>
              </Select>

              {/* Kebab Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
                  className="border-t border-border bg-muted/30"
                >
                  <div className="p-4 pl-14 space-y-2">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 group"
                      >
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
                      </div>
                    ))}

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
          </motion.div>
        );
      })}
    </div>
  );
}
