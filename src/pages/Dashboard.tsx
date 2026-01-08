import { motion } from 'framer-motion';
import { Briefcase, FolderKanban, CheckCircle2, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';

export default function Dashboard() {
  const allProjects = mockPortfolio.programs.flatMap((p) => p.projects);
  const allTasks = allProjects.flatMap((p) => p.tasks);
  const completedTasks = allTasks.filter((t) => t.status === 'done').length;
  const overallProgress = Math.round((completedTasks / allTasks.length) * 100);

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
              Overview of {mockPortfolio.name}
            </p>
          </div>
          <div className="relative">
            <ProgressRing progress={overallProgress} size={100} strokeWidth={6} />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Programs"
            value={mockPortfolio.programs.length}
            subtitle="Active initiatives"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatsCard
            title="Projects"
            value={allProjects.length}
            subtitle={`${allProjects.filter((p) => p.status === 'active').length} active`}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatsCard
            title="Tasks"
            value={allTasks.length}
            subtitle={`${completedTasks} completed`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Team Members"
            value={mockTeamMembers.length}
            subtitle="Active contributors"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Active Projects
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {allProjects
                .filter((p) => p.status === 'active')
                .slice(0, 4)
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={mockTeamMembers}
                  />
                ))}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <ResourceChart members={mockTeamMembers} />
            <RecentActivity />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
