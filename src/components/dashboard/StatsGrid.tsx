import { Building2, Layers, FolderKanban, CheckCircle2 } from 'lucide-react';
import { StatsCard } from './StatsCard';

interface StatsGridProps {
  portfolioCount: number;
  programCount: number;
  activePrograms: number;
  projectCount: number;
  activeProjects: number;
  taskCount: number;
  completedTasks: number;
}

export function StatsGrid({
  portfolioCount,
  programCount,
  activePrograms,
  projectCount,
  activeProjects,
  taskCount,
  completedTasks,
}: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="stats-cards">
      <StatsCard
        title="Portfolios"
        value={portfolioCount}
        subtitle={`${portfolioCount} portfolio${portfolioCount !== 1 ? 's' : ''}`}
        icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />}
        href="/portfolios"
      />
      <StatsCard
        title="Programs"
        value={programCount}
        subtitle={`${activePrograms} active`}
        icon={<Layers className="h-4 w-4 sm:h-5 sm:w-5" />}
        href="/programs"
      />
      <StatsCard
        title="Projects"
        value={projectCount}
        subtitle={`${activeProjects} active`}
        icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />}
        href="/projects"
      />
      <StatsCard
        title="Tasks"
        value={taskCount}
        subtitle={`${completedTasks} completed`}
        icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
        href="/tasks"
      />
    </div>
  );
}
