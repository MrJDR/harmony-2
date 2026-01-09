import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, FolderKanban, CheckSquare, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { PortfolioHealthCard } from '@/components/portfolio/PortfolioHealthCard';
import { ProgramHealthChart } from '@/components/portfolio/ProgramHealthChart';
import { UpcomingMilestones } from '@/components/portfolio/UpcomingMilestones';
import { ResourceUtilization } from '@/components/portfolio/ResourceUtilization';
import { ProjectsTimeline } from '@/components/portfolio/ProjectsTimeline';
import { TaskDistributionChart } from '@/components/portfolio/TaskDistributionChart';
import { Button } from '@/components/ui/button';
import { mockPortfolio, mockTeamMembers, mockMilestones } from '@/data/mockData';
import { WatchButton } from '@/components/watch/WatchButton';

export default function Portfolio() {
  // Calculate strategic metrics
  const metrics = useMemo(() => {
    const allProjects = mockPortfolio.programs.flatMap(p => p.projects);
    const allTasks = allProjects.flatMap(p => p.tasks);
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    const activeProjects = allProjects.filter(p => p.status === 'active').length;
    const activePrograms = mockPortfolio.programs.filter(p => p.status === 'active').length;
    
    const avgProgress = Math.round(
      allProjects.reduce((acc, p) => acc + p.progress, 0) / allProjects.length
    );
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Completed milestones
    const completedMilestones = mockMilestones.filter(m => {
      const milestoneTasks = allTasks.filter(t => t.milestoneId === m.id);
      return milestoneTasks.length > 0 && milestoneTasks.every(t => t.status === 'done');
    }).length;
    
    return {
      totalPrograms: mockPortfolio.programs.length,
      activePrograms,
      totalProjects: allProjects.length,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      avgProgress,
      completionRate,
      totalMilestones: mockMilestones.length,
      completedMilestones,
    };
  }, []);

  const allProjects = useMemo(() => 
    mockPortfolio.programs.flatMap(p => p.projects),
  []);

  const allTasks = useMemo(() => 
    allProjects.flatMap(p => p.tasks),
  [allProjects]);

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
              {mockPortfolio.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {mockPortfolio.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WatchButton 
              id={mockPortfolio.id} 
              type="portfolio" 
              name={mockPortfolio.name}
              variant="outline"
              showLabel
            />
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </div>
        </motion.div>

        {/* Key Performance Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PortfolioHealthCard
            title="Active Programs"
            value={metrics.activePrograms}
            subtitle={`${metrics.totalPrograms} total programs`}
            icon={<Briefcase className="h-5 w-5" />}
            color="primary"
            trend="neutral"
            trendValue={`${metrics.totalPrograms} total`}
          />
          <PortfolioHealthCard
            title="Active Projects"
            value={metrics.activeProjects}
            subtitle={`${metrics.totalProjects} total projects`}
            icon={<FolderKanban className="h-5 w-5" />}
            color="info"
            trend="up"
            trendValue="+2 this month"
          />
          <PortfolioHealthCard
            title="Overall Progress"
            value={`${metrics.avgProgress}%`}
            subtitle={`${metrics.completionRate}% completion rate`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
            trend={metrics.avgProgress >= 50 ? 'up' : 'down'}
            trendValue={metrics.avgProgress >= 50 ? 'On Track' : 'Behind'}
          />
          <PortfolioHealthCard
            title="Milestones"
            value={`${metrics.completedMilestones}/${metrics.totalMilestones}`}
            subtitle={metrics.overdueTasks > 0 ? `${metrics.overdueTasks} overdue tasks` : 'All on schedule'}
            icon={metrics.overdueTasks > 0 ? <AlertTriangle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
            color={metrics.overdueTasks > 0 ? 'warning' : 'success'}
            trend={metrics.overdueTasks > 0 ? 'down' : 'up'}
            trendValue={metrics.overdueTasks > 0 ? `${metrics.overdueTasks} at risk` : 'On track'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Program Health & Timeline */}
          <div className="space-y-6 lg:col-span-2">
            <ProgramHealthChart programs={mockPortfolio.programs} />
            <ProjectsTimeline projects={allProjects} />
          </div>

          {/* Right Column - Milestones, Resources, Tasks */}
          <div className="space-y-6">
            <UpcomingMilestones 
              milestones={mockMilestones} 
              tasks={allTasks}
              projects={allProjects}
            />
            <TaskDistributionChart tasks={allTasks} />
            <ResourceUtilization teamMembers={mockTeamMembers} />
          </div>
        </div>

        {/* Programs Grid */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">All Programs</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {mockPortfolio.programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                teamMembers={mockTeamMembers}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
