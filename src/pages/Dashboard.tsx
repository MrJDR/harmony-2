import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  FolderKanban, 
  CheckCircle2, 
  Users, 
  Building2, 
  Layers, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Clock,
  Target,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { programs, projects, tasks, teamMembers, portfolios, isLoading } = usePortfolioData();
  const { hasOrgPermission } = usePermissions();
  
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              High-level overview of your portfolio
            </p>
          </div>
          <div className="self-end sm:self-auto">
            <ProgressRing progress={overallProgress} size={80} strokeWidth={5} />
          </div>
        </motion.div>

        {/* Onboarding Card - resumable */}
        <OnboardingCard />

        {/* Alerts Section - show if there are issues */}
        {(stats.overdueTasks > 0 || stats.highPriorityTasks > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Attention Required</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {stats.overdueTasks > 0 && (
                    <button 
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-1 text-destructive hover:underline"
                    >
                      <Clock className="h-4 w-4" />
                      {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
                    </button>
                  )}
                  {stats.highPriorityTasks > 0 && (
                    <button 
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-1 text-warning hover:underline"
                    >
                      <Target className="h-4 w-4" />
                      {stats.highPriorityTasks} high priority task{stats.highPriorityTasks > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Portfolio Hierarchy Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="stats-cards">
          <StatsCard
            title="Portfolios"
            value={portfolios.length}
            subtitle={`${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`}
            icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            href="/portfolios"
          />
          <StatsCard
            title="Programs"
            value={programs.length}
            subtitle={`${stats.activePrograms} active`}
            icon={<Layers className="h-4 w-4 sm:h-5 sm:w-5" />}
            href="/programs"
          />
          <StatsCard
            title="Projects"
            value={projects.length}
            subtitle={`${stats.activeProjects} active`}
            icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />}
            href="/projects"
          />
          <StatsCard
            title="Tasks"
            value={tasks.length}
            subtitle={`${completedTasks} completed`}
            icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            href="/tasks"
          />
        </div>

        {/* Budget Overview - Permission Gated */}
        <PermissionGate orgPermission="view_budget">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/reports')}
                  className="text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="View reports"
                >
                  View Reports
                  <ChevronRight className="ml-1 h-3 w-3" aria-hidden />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    ${stats.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Actual Cost</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    ${stats.totalActualCost.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className={cn(
                      "text-2xl font-bold",
                      stats.budgetUtilization > 100 ? "text-destructive" :
                      stats.budgetUtilization > 90 ? "text-warning" : "text-success"
                    )}>
                      {stats.budgetUtilization}%
                    </p>
                    {stats.budgetUtilization <= 90 && (
                      <TrendingUp className="h-5 w-5 text-success" />
                    )}
                  </div>
                  <Progress 
                    value={Math.min(stats.budgetUtilization, 100)} 
                    className="mt-2 h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Programs Quick Access */}
        {programs.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Programs</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/programs')}
                  className="text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="View all programs"
                >
                  View All
                  <ChevronRight className="ml-1 h-3 w-3" aria-hidden />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {programs.slice(0, 6).map((program) => {
                  const programProjects = projects.filter(p => p.programId === program.id);
                  const programTasks = programProjects.flatMap(p => p.tasks);
                  const completedProgramTasks = programTasks.filter(t => t.status === 'done').length;
                  const progress = programTasks.length > 0 
                    ? Math.round((completedProgramTasks / programTasks.length) * 100) 
                    : 0;
                  
                  return (
                    <motion.div
                      key={program.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate(`/programs/${program.id}`)}
                      className="cursor-pointer rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-accent/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate">{program.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {programProjects.length} project{programProjects.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant={program.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
                          {program.status}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6" data-tour="active-projects">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                Projects
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/projects')}
                className="text-xs"
              >
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {projects
                .slice(0, 4)
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers}
                  />
                ))}
              {projects.length === 0 && (
                <p className="col-span-2 text-center py-8 text-muted-foreground">
                  No projects yet. Create your first project to get started.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6" data-tour="resource-chart">
            {/* Team Stats - Permission Gated for CRM access */}
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <StatsCard
                title="Team Members"
                value={teamMembers.length}
                subtitle="Active contributors"
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
                href="/resources"
              />
            </PermissionGate>
            
            <ResourceChart members={teamMembers} />
            <RecentActivity />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
