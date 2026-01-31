import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Calendar, 
  MoreVertical, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Link2,
  ExternalLink,
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Task, TeamMember, Milestone } from '@/types/portfolio';
import { useNavigate } from 'react-router-dom';

interface MilestoneCardProps {
  milestone: Milestone;
  tasks: Task[];
  availableTasks: Task[];
  index: number;
  projectName: string;
  teamMembers: TeamMember[];
  daysInfo: { text: string; isOverdue: boolean };
  onLinkTask: (milestoneId: string, taskId: string) => void;
  onUnlinkTask: (milestoneId: string, taskId: string) => void;
  onCreateTask: (milestoneId: string, title: string) => void;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestoneId: string) => void;
}

export function MilestoneCard({
  milestone,
  tasks,
  availableTasks,
  index,
  projectName,
  teamMembers,
  daysInfo,
  onLinkTask,
  onUnlinkTask,
  onCreateTask,
  onEdit,
  onDelete,
}: MilestoneCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const isComplete = tasks.length > 0 && tasks.every(t => t.status === 'done');

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      onCreateTask(milestone.id, newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return teamMembers.find(m => m.id === assigneeId);
  };

  const statusColors = {
    'todo': 'bg-muted text-muted-foreground',
    'in-progress': 'bg-info/10 text-info',
    'review': 'bg-warning/10 text-warning',
    'done': 'bg-success/10 text-success',
  };

  return (
    <>
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
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={isExpanded ? 'Collapse milestone' : 'Expand milestone'}
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
              {completedTasks}/{tasks.length} tasks completed
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
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Milestone options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(milestone)}>
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                Link Existing Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </DropdownMenuItem>
              )}
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
              className="border-t border-border bg-muted"
            >
              <div className="p-4 pl-14 space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No tasks linked to this milestone</p>
                ) : (
                  tasks.map((task) => {
                    const assignee = getAssignee(task.assigneeId);
                    const isTaskDone = task.status === 'done';
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 group"
                      >
                        <Checkbox
                          checked={isTaskDone}
                          disabled
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm",
                            isTaskDone && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1", statusColors[task.status])}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
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
                          onClick={() => navigate(`/projects/${task.projectId}`)}
                          title="View in project"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onUnlinkTask(milestone.id, task.id)}
                          title="Unlink from milestone"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })
                )}

                {/* Add/Link Task Section */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50 mt-3">
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Create new task for this milestone"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTask();
                      }
                    }}
                    className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowLinkDialog(true)}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Link Existing
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Link Existing Task Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Task to Milestone</DialogTitle>
            <DialogDescription>
              Select an existing task from {projectName} to link to "{milestone.title}"
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {availableTasks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No available tasks to link</p>
                <p className="text-sm mt-1">All tasks in this project are already linked to milestones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTasks.map((task) => {
                  const assignee = getAssignee(task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        onLinkTask(milestone.id, task.id);
                        setShowLinkDialog(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1", statusColors[task.status])}>
                            {task.status}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                      {assignee && (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                          title={assignee.name}
                        >
                          {assignee.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                      )}
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{milestone.title}&quot; will be removed. Linked tasks will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.(milestone.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
