import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Calendar, 
  MoreVertical, 
  CheckCircle2, 
  Plus, 
  Trash2 
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TeamMember } from '@/types/portfolio';

interface MilestoneTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  tasks: MilestoneTask[];
}

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  projectName: string;
  teamMembers: TeamMember[];
  daysInfo: { text: string; isOverdue: boolean };
  onToggleTask: (milestoneId: string, taskId: string) => void;
  onAddTask: (milestoneId: string, title: string) => void;
  onDeleteTask: (milestoneId: string, taskId: string) => void;
}

export function MilestoneCard({
  milestone,
  index,
  projectName,
  teamMembers,
  daysInfo,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const isComplete = milestone.tasks.length > 0 && milestone.tasks.every(t => t.completed);
  const completedTasks = milestone.tasks.filter(t => t.completed).length;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(milestone.id, newTaskTitle);
      setNewTaskTitle('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card shadow-card overflow-hidden"
    >
      {/* Milestone Header */}
      <div className={cn(
        "flex items-center gap-3 p-4",
        isComplete && "opacity-60"
      )}>
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronRight 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )} 
          />
        </button>

        {/* Completion indicator */}
        <div className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
          isComplete 
            ? "border-success bg-success" 
            : "border-muted-foreground/30"
        )}>
          {isComplete && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
        </div>
        
        {/* Milestone Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-medium text-foreground",
              isComplete && "line-through text-muted-foreground"
            )}>
              {milestone.title}
            </h4>
            <Badge variant="outline" className="text-xs">
              {projectName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedTasks}/{milestone.tasks.length} tasks completed
          </p>
        </div>

        {/* Due Date */}
        <div className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded",
          isComplete 
            ? "text-muted-foreground" 
            : daysInfo.isOverdue 
              ? "text-destructive bg-destructive/10" 
              : "text-muted-foreground"
        )}>
          <Calendar className="h-3 w-3" />
          {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
        </div>

        {/* Status Badge */}
        {isComplete ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Completed
          </Badge>
        ) : daysInfo.isOverdue ? (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            Overdue
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            {daysInfo.text}
          </Badge>
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks */}
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
              {milestone.tasks.map((task) => {
                const assignee = teamMembers.find(m => m.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => onToggleTask(milestone.id, task.id)}
                      className="h-4 w-4"
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                    {assignee && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                        title={assignee.name}
                      >
                        {assignee.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteTask(milestone.id, task.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}

              {/* Add Task */}
              <div className="flex items-center gap-2 pt-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Add task to milestone"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTask();
                    }
                  }}
                  className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}