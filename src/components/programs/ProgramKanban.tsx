import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, CheckCircle2 } from 'lucide-react';
import { Program, Project, Task } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface ProgramKanbanProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  groupBy: 'status' | 'portfolio';
  portfolios?: Array<{ id: string; name: string }>;
}

const statusColumns = [
  { key: 'planning', label: 'Planning', color: 'bg-muted-foreground' },
  { key: 'active', label: 'Active', color: 'bg-info' },
  { key: 'on-hold', label: 'On Hold', color: 'bg-warning' },
  { key: 'completed', label: 'Completed', color: 'bg-success' },
];

export function ProgramKanban({ programs, projects, tasks, groupBy, portfolios = [] }: ProgramKanbanProps) {
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

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return statusColumns.map((col) => ({
        ...col,
        programs: programs.filter((p) => p.status === col.key),
      }));
    } else {
      // Group by portfolio
      const portfolioMap = new Map<string, Program[]>();
      programs.forEach((p) => {
        const portfolioId = p.portfolioId;
        if (!portfolioMap.has(portfolioId)) {
          portfolioMap.set(portfolioId, []);
        }
        portfolioMap.get(portfolioId)!.push(p);
      });

      return portfolios.map((portfolio) => ({
        key: portfolio.id,
        label: portfolio.name,
        color: 'bg-primary',
        programs: portfolioMap.get(portfolio.id) || [],
      }));
    }
  }, [programs, groupBy, portfolios]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-muted text-muted-foreground',
      active: 'bg-info/10 text-info border-info/30',
      'on-hold': 'bg-warning/10 text-warning border-warning/30',
      completed: 'bg-success/10 text-success border-success/30',
    };
    return colors[status] || colors.planning;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => (
        <div key={column.key} className="flex-shrink-0 w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-2 h-2 rounded-full', column.color)} />
            <h3 className="font-medium text-sm">{column.label}</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {column.programs.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {column.programs.map((program, index) => {
              const stats = programStats.get(program.id);

              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.05 + index * 0.02 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/programs/${program.id}`)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {program.name}
                        </CardTitle>
                        {groupBy === 'portfolio' && (
                          <Badge variant="outline" className={cn('text-xs shrink-0', getStatusBadge(program.status))}>
                            {program.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      {program.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {program.description}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{stats?.avgProgress || 0}%</span>
                        </div>
                        <Progress value={stats?.avgProgress || 0} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" />
                          <span>{stats?.projectCount || 0} projects</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{stats?.completedTasks || 0}/{stats?.taskCount || 0} tasks</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {column.programs.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No programs
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
