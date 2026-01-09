import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';
import { useWatch } from '@/contexts/WatchContext';

interface TaskKanbanProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  groupBy: 'status' | 'assignee';
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onAddTask: () => void;
}

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'bg-muted' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-info/20' },
  { id: 'review', label: 'Review', color: 'bg-warning/20' },
  { id: 'done', label: 'Done', color: 'bg-success/20' },
];

const priorityColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-muted',
};

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

  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const columns = groupBy === 'status' 
    ? statusColumns 
    : [
        { id: 'unassigned', label: 'Unassigned', color: 'bg-muted' },
        ...teamMembers.map((m) => ({ id: m.id, label: m.name, color: 'bg-accent/20' })),
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
        onTaskUpdate(draggedTask.id, { status: columnId as Task['status'] });
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
            <div className={cn("rounded-t-lg px-3 py-2", column.color)}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
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
                
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing animate-fade-in",
                      draggedTask?.id === task.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            className="font-medium text-sm text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onTaskEdit(task)}
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
                        
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs border', priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                          {groupBy === 'status' && task.dueDate && (
                            <span className={cn(
                              "text-xs text-muted-foreground",
                              new Date(task.dueDate) < new Date() && "text-destructive"
                            )}>
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {watching && (
                            <Eye className="h-3 w-3 text-primary" />
                          )}
                        </div>

                        {groupBy === 'status' && assignee && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                              {assignee.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
                onClick={onAddTask}
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
