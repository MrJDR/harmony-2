import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';
import { useWatch } from '@/contexts/WatchContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskKanbanProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  groupBy: 'status' | 'assignee';
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onAddTask: (defaults?: { status?: Task['status']; assigneeId?: string }) => void;
}

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'bg-muted', dotColor: 'bg-muted-foreground', borderColor: 'border-l-muted-foreground' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-info/20', dotColor: 'bg-info', borderColor: 'border-l-info' },
  { id: 'review', label: 'Review', color: 'bg-warning/20', dotColor: 'bg-warning', borderColor: 'border-l-warning' },
  { id: 'done', label: 'Done', color: 'bg-success/20', dotColor: 'bg-success', borderColor: 'border-l-success' },
];

export function TaskKanban({ 
  tasks, 
  teamMembers, 
  groupBy, 
  onTaskUpdate, 
  onTaskEdit, 
  onTaskDelete,
  onAddTask 
}: TaskKanbanProps) {
  const { isWatching, toggleWatch } = useWatch();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskValues, setNewSubtaskValues] = useState<{ [taskId: string]: string }>({});

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
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    const allCompleted = updatedSubtasks.every(st => st.completed);
    const anyIncomplete = updatedSubtasks.some(st => !st.completed);
    
    const updates: Partial<Task> = { subtasks: updatedSubtasks };
    
    if (allCompleted && updatedSubtasks.length > 0 && task.status !== 'done') {
      updates.status = 'done';
      toast.success('All subtasks completed! Task marked as done.');
    } else if (anyIncomplete && task.status === 'done') {
      updates.status = 'in-progress';
      toast.info('Task reopened as in-progress.');
    }
    
    onTaskUpdate(task.id, updates);
  };

  const addSubtask = (task: Task, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const value = newSubtaskValues[task.id]?.trim();
    if (!value) return;
    
    const newSubtask = {
      id: `subtask-${Date.now()}`,
      title: value,
      completed: false,
    };
    
    const updates: Partial<Task> = { 
      subtasks: [...task.subtasks, newSubtask] 
    };
    
    if (task.status === 'done') {
      updates.status = 'in-progress';
      toast.info('Task reopened as in-progress.');
    }
    
    onTaskUpdate(task.id, updates);
    setNewSubtaskValues(prev => ({ ...prev, [task.id]: '' }));
  };

  const deleteSubtask = (task: Task, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const columns = groupBy === 'status' 
    ? statusColumns 
    : [
        { id: 'unassigned', label: 'Unassigned', color: 'bg-muted', dotColor: 'bg-muted-foreground', borderColor: 'border-l-muted-foreground' },
        ...teamMembers.map((m) => ({ id: m.id, label: m.name, color: 'bg-accent/20', dotColor: 'bg-accent', borderColor: 'border-l-accent' })),
      ];

  const getTasksForColumn = (columnId: string) => {
    if (groupBy === 'status') {
      return tasks.filter((t) => t.status === columnId);
    }
    if (columnId === 'unassigned') {
      return tasks.filter((t) => !t.assigneeId);
    }
    return tasks.filter((t) => t.assigneeId === columnId);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    // Add a slight delay to allow the drag image to be created
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask) return;

    if (groupBy === 'status') {
      // Update task status
      if (draggedTask.status !== columnId) {
        const updates: Partial<Task> = { status: columnId as Task['status'] };
        // Mark all subtasks complete when task is moved to done
        if (columnId === 'done' && draggedTask.subtasks.length > 0) {
          updates.subtasks = draggedTask.subtasks.map(st => ({ ...st, completed: true }));
        }
        onTaskUpdate(draggedTask.id, updates);
      }
    } else {
      // Update task assignee
      const newAssigneeId = columnId === 'unassigned' ? undefined : columnId;
      if (draggedTask.assigneeId !== newAssigneeId) {
        onTaskUpdate(draggedTask.id, { assigneeId: newAssigneeId });
      }
    }
    
    setDraggedTask(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => {
        const columnTasks = getTasksForColumn(column.id);
        const isOver = dragOverColumn === column.id;
        
        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colIndex * 0.1 }}
            className="flex-shrink-0 w-72"
          >
            <div className={cn("rounded-t-lg px-3 py-2 border border-b-0 border-border", column.color)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.dotColor)} />
                  <h3 className="font-medium text-foreground">{column.label}</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
            </div>
            
            <div 
              className={cn(
                "min-h-[400px] rounded-b-lg border border-t-0 border-border bg-muted/30 p-2 space-y-2 transition-colors duration-200",
                isOver && "bg-primary/10 border-primary/30"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {columnTasks.map((task) => {
                const assignee = getAssignee(task.assigneeId);
                const watching = isWatching(task.id, 'task');
                const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                const totalSubtasks = task.subtasks.length;
                
                // Get border color based on status
                const taskBorderColor = statusColumns.find(s => s.id === task.status)?.borderColor || 'border-l-muted-foreground';
                
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskEdit(task)}
                      className={cn(
                        "group rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer active:cursor-grabbing animate-fade-in border-l-4",
                        taskBorderColor,
                        draggedTask?.id === task.id && "opacity-50 scale-95"
                      )}
                    >
                      <div className="p-3">
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            className="font-medium text-sm text-foreground line-clamp-2"
                          >
                            {task.title}
                          </h4>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleWatch(task.id, 'task', task.title); }}>
                              {watching ? (
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskEdit(task); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit in Modal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Footer: Due date, subtasks, assignee */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Due Date */}
                          {task.dueDate && (
                            <span className={cn(
                              "flex items-center gap-1 text-xs",
                              new Date(task.dueDate) < new Date() && task.status !== 'done' 
                                ? "text-destructive" 
                                : "text-muted-foreground"
                            )}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                          
                              {/* Subtasks count */}
                          {totalSubtasks > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {completedSubtasks}/{totalSubtasks} subtasks
                            </span>
                          )}
                        </div>
                        
                        {/* Assignee Avatar */}
                        {assignee && (
                          <div 
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                            title={assignee.name}
                          >
                            {assignee.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Expandable Subtasks Section */}
                    {totalSubtasks > 0 && (
                      <>
                        <button
                          onClick={(e) => toggleExpanded(task.id, e)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-border hover:bg-muted/50 transition-colors"
                        >
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              !expandedTasks.has(task.id) && "-rotate-180"
                            )} 
                          />
                          <span className="text-xs text-muted-foreground">
                            {expandedTasks.has(task.id) ? 'Hide' : 'Show'} subtasks
                          </span>
                        </button>
                        
                        <AnimatePresence>
                          {expandedTasks.has(task.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-border"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-2 space-y-1 bg-muted/30">
                                {task.subtasks.map((subtask) => (
                                  <div
                                    key={subtask.id}
                                    className="group/subtask flex items-center gap-2 p-1.5 rounded hover:bg-muted/50"
                                  >
                                    <Checkbox
                                      checked={subtask.completed}
                                      onCheckedChange={() => toggleSubtask(task, subtask.id)}
                                      className="h-3.5 w-3.5"
                                    />
                                    <span className={cn(
                                      "text-xs flex-1",
                                      subtask.completed && "line-through text-muted-foreground"
                                    )}>
                                      {subtask.title}
                                    </span>
                                    <button
                                      onClick={(e) => deleteSubtask(task, subtask.id, e)}
                                      className="opacity-0 group-hover/subtask:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                
                                {/* Add subtask input */}
                                <form onSubmit={(e) => addSubtask(task, e)} className="flex items-center gap-1 pt-1">
                                  <Input
                                    value={newSubtaskValues[task.id] || ''}
                                    onChange={(e) => setNewSubtaskValues(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    placeholder="Add subtask..."
                                    className="h-6 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button type="submit" size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </form>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* Drop indicator when dragging */}
              {isOver && draggedTask && (
                <div className="h-16 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center">
                  <span className="text-xs text-primary font-medium">Drop here</span>
                </div>
              )}
              
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (groupBy === 'status') {
                    onAddTask({ status: column.id as Task['status'] });
                  } else {
                    onAddTask({ assigneeId: column.id === 'unassigned' ? undefined : column.id });
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add task
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
