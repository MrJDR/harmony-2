import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => {
        const columnTasks = getTasksForColumn(column.id);
        
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
            
            <div className="min-h-[400px] rounded-b-lg border border-t-0 border-border bg-muted/30 p-2 space-y-2">
              {columnTasks.map((task, index) => {
                const assignee = getAssignee(task.assigneeId);
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onTaskEdit(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground line-clamp-2">
                        {task.title}
                      </h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskEdit(task); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
                  </motion.div>
                );
              })}
              
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
