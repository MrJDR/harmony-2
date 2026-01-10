import { motion } from 'framer-motion';
import { Briefcase, FolderKanban, CheckCircle2, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { programs, projects, tasks, teamMembers, portfolio, isLoading } = usePortfolioData();
  
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const overallProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64 mt-2" />
            </div>
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Overview of {portfolio?.name || 'your portfolio'}
            </p>
          </div>
          <div className="relative">
            <ProgressRing progress={overallProgress} size={100} strokeWidth={6} />
          </div>
        </motion.div>

        {/* Onboarding Card - resumable */}
        <OnboardingCard />

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-tour="stats-cards">
          <StatsCard
            title="Programs"
            value={programs.length}
            subtitle="Active initiatives"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatsCard
            title="Projects"
            value={projects.length}
            subtitle={`${projects.filter((p) => p.status === 'active').length} active`}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatsCard
            title="Tasks"
            value={tasks.length}
            subtitle={`${completedTasks} completed`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Team Members"
            value={teamMembers.length}
            subtitle="Active contributors"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects Column */}
          <div className="lg:col-span-2 space-y-6" data-tour="active-projects">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Active Projects
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects
                .filter((p) => p.status === 'active')
                .slice(0, 4)
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers}
                  />
                ))}
              {projects.filter((p) => p.status === 'active').length === 0 && (
                <p className="col-span-2 text-center py-8 text-muted-foreground">
                  No active projects yet. Create your first project to get started.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6" data-tour="resource-chart">
            <ResourceChart members={teamMembers} />
            <RecentActivity />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
