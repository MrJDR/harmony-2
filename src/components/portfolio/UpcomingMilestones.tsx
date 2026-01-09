import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Milestone, Task, Project } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

interface UpcomingMilestonesProps {
  milestones: Milestone[];
  tasks: Task[];
  projects: Project[];
}

export function UpcomingMilestones({ milestones, tasks, projects }: UpcomingMilestonesProps) {
  const getMilestoneStatus = (milestone: Milestone) => {
    const milestoneTasks = tasks.filter(t => t.milestoneId === milestone.id);
    const completedTasks = milestoneTasks.filter(t => t.status === 'done').length;
    const totalTasks = milestoneTasks.length;
    const isComplete = totalTasks > 0 && completedTasks === totalTasks;
    const dueDate = new Date(milestone.dueDate);
    const isOverdue = isPast(dueDate) && !isToday(dueDate);
    const daysUntil = differenceInDays(dueDate, new Date());

    return { isComplete, isOverdue, daysUntil, completedTasks, totalTasks };
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">Upcoming Milestones</h3>
          <p className="mt-1 text-sm text-muted-foreground">Track key deliverables across all programs</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sortedMilestones.slice(0, 5).map((milestone) => {
          const project = projects.find(p => p.id === milestone.projectId);
          const status = getMilestoneStatus(milestone);

          return (
            <div
              key={milestone.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-3"
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                status.isComplete ? 'bg-success/10' : status.isOverdue ? 'bg-destructive/10' : 'bg-warning/10'
              )}>
                {status.isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : status.isOverdue ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{milestone.title}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {project?.name} · {status.completedTasks}/{status.totalTasks} tasks
                </p>
              </div>
              <div className="text-right">
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    status.isComplete && 'border-success/30 text-success',
                    status.isOverdue && !status.isComplete && 'border-destructive/30 text-destructive',
                    !status.isComplete && !status.isOverdue && 'border-warning/30 text-warning'
                  )}
                >
                  {status.isComplete 
                    ? 'Complete' 
                    : status.isOverdue 
                      ? 'Overdue' 
                      : status.daysUntil === 0 
                        ? 'Today' 
                        : `${status.daysUntil}d left`}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(milestone.dueDate), 'MMM d')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
