import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AlertsBanner } from '@/components/dashboard/AlertsBanner';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { ProgramsQuickAccess } from '@/components/dashboard/ProgramsQuickAccess';
import { ProjectsSection } from '@/components/dashboard/ProjectsSection';

export default function Dashboard() {
  const { programs, projects, tasks, teamMembers, portfolios, isLoading } = usePortfolioData();
  
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const overallProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Calculate high-level stats
  const stats = useMemo(() => {
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    
    const totalBudget = programs.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;
    
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const activePrograms = programs.filter(p => p.status === 'active').length;
    
    return {
      overdueTasks,
      highPriorityTasks,
      totalBudget,
      totalActualCost,
      budgetUtilization,
      activeProjects,
      activePrograms,
    };
  }, [tasks, programs, projects]);

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
        <DashboardHeader overallProgress={overallProgress} />

        {/* Onboarding Card - resumable */}
        <OnboardingCard />

        {/* Alerts Section */}
        <AlertsBanner 
          overdueTasks={stats.overdueTasks} 
          highPriorityTasks={stats.highPriorityTasks} 
        />

        {/* Portfolio Hierarchy Overview */}
        <StatsGrid
          portfolioCount={portfolios.length}
          programCount={programs.length}
          activePrograms={stats.activePrograms}
          projectCount={projects.length}
          activeProjects={stats.activeProjects}
          taskCount={tasks.length}
          completedTasks={completedTasks}
        />

        {/* Budget Overview - Permission Gated */}
        <PermissionGate orgPermission="view_budget">
          <BudgetOverview
            totalBudget={stats.totalBudget}
            totalActualCost={stats.totalActualCost}
            budgetUtilization={stats.budgetUtilization}
          />
        </PermissionGate>

        {/* Programs Quick Access */}
        <ProgramsQuickAccess 
          programs={programs} 
          projects={projects}
          tasks={tasks}
        />

        {/* Main Content Grid */}
        <ProjectsSection 
          projects={projects} 
          teamMembers={teamMembers} 
        />
      </div>
    </MainLayout>
  );
}
