import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, CheckCircle2 } from 'lucide-react';
import { Program, Project, Task } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProgramKanbanProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  groupBy: 'status' | 'portfolio';
  portfolios?: Array<{ id: string; name: string }>;
  onProgramUpdate?: (programId: string, updates: Partial<Program>) => void;
}

const statusColumns = [
  { key: 'planning', label: 'Planning', color: 'bg-muted-foreground', bgColor: 'bg-muted-foreground/10', borderColor: 'border-muted-foreground/30' },
  { key: 'active', label: 'Active', color: 'bg-info', bgColor: 'bg-info/10', borderColor: 'border-info/30' },
  { key: 'on-hold', label: 'On Hold', color: 'bg-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
  { key: 'completed', label: 'Completed', color: 'bg-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' },
];

export function ProgramKanban({ programs, projects, tasks, groupBy, portfolios = [], onProgramUpdate }: ProgramKanbanProps) {
  const navigate = useNavigate();
  const [draggedProgram, setDraggedProgram] = useState<Program | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
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

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, program: Program) => {
    setDraggedProgram(program);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', program.id);
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
    setDraggedProgram(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedProgram || !onProgramUpdate) return;

    if (groupBy === 'status') {
      if (draggedProgram.status !== columnKey) {
        onProgramUpdate(draggedProgram.id, { status: columnKey as Program['status'] });
        toast.success(`Program moved to ${statusColumns.find(c => c.key === columnKey)?.label || columnKey}`);
      }
    } else {
      if (draggedProgram.portfolioId !== columnKey) {
        onProgramUpdate(draggedProgram.id, { portfolioId: columnKey });
        toast.success(`Program moved to ${portfolios.find(p => p.id === columnKey)?.name || 'new portfolio'}`);
      }
    }
    
    setDraggedProgram(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => {
        const isOver = dragOverColumn === column.key;
        
        return (
          <div 
            key={column.key} 
            className="flex-shrink-0 w-[300px]"
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className={cn(
              "rounded-t-lg px-3 py-2 border border-b-0 border-border",
              column.bgColor
            )}>
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', column.color)} />
                <h3 className="font-medium text-sm">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {column.programs.length}
                </Badge>
              </div>
            </div>

            <div className={cn(
              "min-h-[400px] rounded-b-lg border border-t-0 border-border bg-muted p-2 space-y-3 transition-colors duration-200",
              isOver && "bg-primary/10 border-primary/30"
            )}>
              {column.programs.map((program, index) => {
                const stats = programStats.get(program.id);
                const isDragging = draggedProgram?.id === program.id;

                return (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: colIndex * 0.05 + index * 0.02 }}
                    draggable={!!onProgramUpdate}
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, program)}
                    onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all active:cursor-grabbing",
                        isDragging && "opacity-50 scale-95"
                      )}
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
                <div className={cn(
                  "rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors",
                  isOver && "border-primary bg-primary/5"
                )}>
                  {isOver ? 'Drop here' : 'No programs'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}