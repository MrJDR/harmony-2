import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, CheckCircle2, Briefcase } from 'lucide-react';
import { Program, Project, Task } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ProgramListProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  portfolios?: Array<{ id: string; name: string }>;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-info/10 text-info border-info/30',
  'on-hold': 'bg-warning/10 text-warning border-warning/30',
  completed: 'bg-success/10 text-success border-success/30',
};

export function ProgramList({ programs, projects, tasks, portfolios = [] }: ProgramListProps) {
  const navigate = useNavigate();

  // Calculate program stats
  const programStats = useMemo(() => {
    const stats = new Map<string, { projectCount: number; taskCount: number; completedTasks: number; avgProgress: number }>();
    
    programs.forEach((program) => {
      const programProjects = projects.filter((p) => p.programId === program.id);
      const programTasks = tasks.filter((t) => programProjects.some((p) => p.id === t.projectId));
      const completedTasks = programTasks.filter((t) => t.status === 'done').length;
      const avgProgress = programProjects.length > 0
        ? Math.round(programProjects.reduce((acc, p) => acc + p.progress, 0) / programProjects.length)
        : 0;

      stats.set(program.id, {
        projectCount: programProjects.length,
        taskCount: programTasks.length,
        completedTasks,
        avgProgress,
      });
    });

    return stats;
  }, [programs, projects, tasks]);

  const getPortfolioName = (portfolioId: string) => {
    return portfolios.find((p) => p.id === portfolioId)?.name || 'Unknown Portfolio';
  };

  return (
    <div className="space-y-2">
      {programs.map((program, index) => {
        const stats = programStats.get(program.id);

        return (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{program.name}</h3>
                      <Badge variant="outline" className={cn('text-xs shrink-0', statusColors[program.status])}>
                        {program.status}
                      </Badge>
                    </div>
                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {program.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{getPortfolioName(program.portfolioId)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        <span>{stats?.projectCount || 0} projects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{stats?.completedTasks || 0}/{stats?.taskCount || 0} tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-full sm:w-32 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{stats?.avgProgress || 0}%</span>
                    </div>
                    <Progress value={stats?.avgProgress || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {programs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No programs found</p>
        </div>
      )}
    </div>
  );
}
