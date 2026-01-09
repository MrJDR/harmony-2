import { motion } from 'framer-motion';
import { Project } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, Pause } from 'lucide-react';

interface ProjectsTimelineProps {
  projects: Project[];
}

const statusConfig = {
  planning: { icon: Clock, color: 'text-info', bg: 'bg-info/10' },
  active: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  'on-hold': { icon: Pause, color: 'text-warning', bg: 'bg-warning/10' },
  completed: { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function ProjectsTimeline({ projects }: ProjectsTimelineProps) {
  const navigate = useNavigate();

  const sortedProjects = [...projects].sort((a, b) => {
    const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    return aEnd - bEnd;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-display text-lg font-semibold text-card-foreground">Project Timeline</h3>
      <p className="mt-1 text-sm text-muted-foreground">Active and upcoming project deadlines</p>

      <div className="mt-6 space-y-4">
        {sortedProjects.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          const endDate = project.endDate ? new Date(project.endDate) : null;
          const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null;
          const isOverdue = endDate && isPast(endDate) && project.status !== 'completed';

          return (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', statusConfig[project.status].bg)}>
                    <StatusIcon className={cn('h-4 w-4', statusConfig[project.status].color)} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{project.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {project.status}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {format(new Date(project.startDate), 'MMM d')} — {endDate ? format(endDate, 'MMM d, yyyy') : 'Ongoing'}
                  </span>
                  <span className="text-muted-foreground">
                    {project.tasks.length} tasks
                  </span>
                </div>
                {daysRemaining !== null && (
                  <span className={cn(
                    'font-medium',
                    isOverdue ? 'text-destructive' : daysRemaining <= 14 ? 'text-warning' : 'text-muted-foreground'
                  )}>
                    {isOverdue ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </span>
                    ) : (
                      `${daysRemaining}d remaining`
                    )}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all',
                    project.status === 'completed' ? 'bg-success' :
                    isOverdue ? 'bg-destructive' :
                    project.progress >= 75 ? 'bg-success' :
                    project.progress >= 50 ? 'bg-primary' :
                    project.progress >= 25 ? 'bg-warning' : 'bg-info'
                  )}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
