import { motion } from 'framer-motion';
import { Program } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ProgramHealthChartProps {
  programs: Program[];
}

const statusConfig = {
  planning: { color: 'bg-info', label: 'Planning', icon: Clock },
  active: { color: 'bg-success', label: 'Active', icon: CheckCircle2 },
  'on-hold': { color: 'bg-warning', label: 'On Hold', icon: AlertTriangle },
  completed: { color: 'bg-muted', label: 'Completed', icon: CheckCircle2 },
};

function getProgramHealth(program: Program): 'healthy' | 'at-risk' | 'critical' {
  const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = program.projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
    0
  );
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const avgProjectProgress = program.projects.reduce((acc, p) => acc + p.progress, 0) / program.projects.length;
  
  // Check for overdue tasks or at-risk projects
  const hasOverdueTasks = program.projects.some(p => 
    p.tasks.some(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done')
  );
  
  if (hasOverdueTasks || avgProjectProgress < 30) return 'critical';
  if (avgProjectProgress < 50) return 'at-risk';
  return 'healthy';
}

const healthColors = {
  healthy: 'text-success',
  'at-risk': 'text-warning',
  critical: 'text-destructive',
};

const healthBg = {
  healthy: 'bg-success/10',
  'at-risk': 'bg-warning/10',
  critical: 'bg-destructive/10',
};

export function ProgramHealthChart({ programs }: ProgramHealthChartProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-display text-lg font-semibold text-card-foreground">Program Health</h3>
      <p className="mt-1 text-sm text-muted-foreground">Status overview of all active programs</p>
      
      <div className="mt-6 space-y-4">
        {programs.map((program) => {
          const health = getProgramHealth(program);
          const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
          const completedTasks = program.projects.reduce(
            (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
            0
          );
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const StatusIcon = statusConfig[program.status].icon;

          return (
            <div
              key={program.id}
              onClick={() => navigate(`/programs/${program.id}`)}
              className="group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', healthBg[health])}>
                    <StatusIcon className={cn('h-4 w-4', healthColors[health])} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{program.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {program.projects.length} projects · {totalTasks} tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'capitalize',
                      health === 'healthy' && 'border-success/30 text-success',
                      health === 'at-risk' && 'border-warning/30 text-warning',
                      health === 'critical' && 'border-destructive/30 text-destructive'
                    )}
                  >
                    {health.replace('-', ' ')}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="mt-1.5 h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
