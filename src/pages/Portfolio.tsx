import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, FolderKanban, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { PortfolioHealthCard } from '@/components/portfolio/PortfolioHealthCard';
import { ProgramHealthChart } from '@/components/portfolio/ProgramHealthChart';
import { UpcomingMilestones } from '@/components/portfolio/UpcomingMilestones';
import { ResourceUtilization } from '@/components/portfolio/ResourceUtilization';
import { ProjectsTimeline } from '@/components/portfolio/ProjectsTimeline';
import { TaskDistributionChart } from '@/components/portfolio/TaskDistributionChart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { WatchButton } from '@/components/watch/WatchButton';

export default function Portfolio() {
  const { programs, projects, tasks, teamMembers, milestones, portfolio, isLoading } = usePortfolioData();

  // Calculate strategic metrics
  const metrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const activePrograms = programs.filter(p => p.status === 'active').length;
    
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
      : 0;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Completed milestones
    const completedMilestones = milestones.filter(m => {
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      return milestoneTasks.length > 0 && milestoneTasks.every(t => t.status === 'done');
    }).length;
    
    return {
      totalPrograms: programs.length,
      activePrograms,
      totalProjects: projects.length,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      avgProgress,
      completionRate,
      totalMilestones: milestones.length,
      completedMilestones,
    };
  }, [programs, projects, tasks, milestones]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {portfolio?.name || 'Portfolio'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {portfolio?.description || 'Manage your programs and projects'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {portfolio && (
              <WatchButton 
                id={portfolio.id} 
                type="portfolio" 
                name={portfolio.name}
                variant="outline"
                showLabel
              />
            )}
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </div>
        </motion.div>

        {/* Key Performance Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="portfolio-health">
          <PortfolioHealthCard
            title="Active Programs"
            value={metrics.activePrograms}
            subtitle={`${metrics.totalPrograms} total programs`}
            icon={<Briefcase className="h-5 w-5" />}
            color="primary"
          />
          <PortfolioHealthCard
            title="Active Projects"
            value={metrics.activeProjects}
            subtitle={`${metrics.totalProjects} total projects`}
            icon={<FolderKanban className="h-5 w-5" />}
            color="info"
          />
          <PortfolioHealthCard
            title="Overall Progress"
            value={`${metrics.avgProgress}%`}
            subtitle={`${metrics.completionRate}% task completion`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
          />
          <PortfolioHealthCard
            title="Milestones"
            value={`${metrics.completedMilestones}/${metrics.totalMilestones}`}
            subtitle={metrics.overdueTasks > 0 ? `${metrics.overdueTasks} overdue tasks` : 'All on schedule'}
            icon={metrics.overdueTasks > 0 ? <AlertTriangle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
            color={metrics.overdueTasks > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Program Health & Timeline */}
          <div className="space-y-6 lg:col-span-2">
            <ProgramHealthChart programs={programs} />
            <ProjectsTimeline projects={projects} />
          </div>

          {/* Right Column - Milestones, Resources, Tasks */}
          <div className="space-y-6">
            <UpcomingMilestones 
              milestones={milestones} 
              tasks={tasks}
              projects={projects}
            />
            <TaskDistributionChart tasks={tasks} />
            <ResourceUtilization teamMembers={teamMembers} />
          </div>
        </div>

        {/* Programs Grid */}
        <div data-tour="program-cards">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">All Programs</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                teamMembers={teamMembers}
              />
            ))}
            {programs.length === 0 && (
              <p className="col-span-2 text-center py-12 text-muted-foreground">
                No programs yet. Create your first program to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
