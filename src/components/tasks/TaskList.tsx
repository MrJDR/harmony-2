import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Circle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';

interface TaskListProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const statusConfig = {
  todo: { icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  'in-progress': { icon: Clock, color: 'text-info', bgColor: 'bg-info/10' },
  review: { icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10' },
  done: { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
};

const priorityColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-muted',
};

export function TaskList({ tasks, teamMembers, onTaskUpdate, onTaskEdit, onTaskDelete }: TaskListProps) {
  const getAssignee = (assigneeId?: string) => {
    return teamMembers.find((m) => m.id === assigneeId);
  };

  const toggleTaskDone = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onTaskUpdate(task.id, { status: newStatus });
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const StatusIcon = statusConfig[task.status].icon;
        const assignee = getAssignee(task.assigneeId);
        
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "group flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-card transition-all hover:shadow-md",
              task.status === 'done' && "opacity-60"
            )}
          >
            <Checkbox
              checked={task.status === 'done'}
              onCheckedChange={() => toggleTaskDone(task)}
              className="h-5 w-5"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium text-foreground truncate",
                  task.status === 'done' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h4>
                <Badge variant="outline" className={cn('text-xs border', priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {task.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", statusConfig[task.status].bgColor)}>
                  <StatusIcon className={cn("h-3 w-3", statusConfig[task.status].color)} />
                  <span className={statusConfig[task.status].color}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                {task.dueDate && (
                  <span className={cn(
                    new Date(task.dueDate) < new Date() && task.status !== 'done' && "text-destructive"
                  )}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {assignee && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                title={assignee.name}
              >
                {assignee.name.split(' ').map((n) => n[0]).join('')}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
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
          </motion.div>
        );
      })}
    </div>
  );
}
