import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Briefcase, FolderKanban, Target, TrendingUp, AlertTriangle, Settings, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { usePermissions } from '@/contexts/PermissionsContext';
import { WatchButton } from '@/components/watch/WatchButton';
import { ProgramModal } from '@/components/programs/ProgramModal';
import { PortfolioModal } from '@/components/portfolio/PortfolioModal';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { CommunicationButton } from '@/components/communication/CommunicationButton';
import { toast } from 'sonner';

export default function PortfolioDetail() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const { programs: allPrograms, projects: allProjects, tasks: allTasks, teamMembers, milestones: allMilestones, portfolios, isLoading, addProgram, updateProgram, addPortfolio, updatePortfolio } = usePortfolioData();
  const { currentOrgRole } = usePermissions();
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<{ id: string; name: string; description: string } | null>(null);

  // Get the specific portfolio
  const portfolio = useMemo(() => {
    return portfolios.find(p => p.id === portfolioId) || null;
  }, [portfolios, portfolioId]);

  // Filter data for this portfolio
  const programs = useMemo(() => {
    return allPrograms.filter(p => p.portfolioId === portfolioId);
  }, [allPrograms, portfolioId]);

  const programIds = useMemo(() => programs.map(p => p.id), [programs]);

  const projects = useMemo(() => {
    return allProjects.filter(p => programIds.includes(p.programId));
  }, [allProjects, programIds]);

  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  const tasks = useMemo(() => {
    return allTasks.filter(t => projectIds.includes(t.projectId));
  }, [allTasks, projectIds]);

  const milestones = useMemo(() => {
    return allMilestones.filter(m => projectIds.includes(m.projectId));
  }, [allMilestones, projectIds]);

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
    
    // Overdue projects (past end date, not completed)
    const overdueProjects = projects.filter(p => 
      p.endDate && new Date(p.endDate) < new Date() && p.status !== 'completed'
    ).length;
    
    // Overdue milestones (past due date, not all tasks done)
    const overdueMilestones = milestones.filter(m => {
      if (new Date(m.dueDate) >= new Date()) return false;
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      return milestoneTasks.length === 0 || !milestoneTasks.every(t => t.status === 'done');
    }).length;
    
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
      overdueProjects,
      overdueMilestones,
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

  // Portfolio not found
  if (!portfolio) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Briefcase className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Portfolio not found</h2>
          <p className="text-muted-foreground mb-4">The portfolio you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/portfolios')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Portfolios
          </Button>
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
            <div className="flex items-center gap-3 mb-1">
              <Link 
                to="/portfolios" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {portfolio.name}
              </h1>
            </div>
            <p className="mt-1 text-muted-foreground ml-8">
              {portfolio.description || 'Manage your programs and projects'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CommunicationButton
              contextType="portfolio"
              contextId={portfolio.id}
              contextName={portfolio.name}
              memberIds={teamMembers.map(m => m.id)}
              variant="outline"
            />
            <WatchButton 
              id={portfolio.id} 
              type="portfolio" 
              name={portfolio.name}
              variant="outline"
              showLabel
            />
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingPortfolio({
                    id: portfolio.id,
                    name: portfolio.name,
                    description: portfolio.description || ''
                  });
                  setPortfolioModalOpen(true);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button onClick={() => setProgramModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Button>
            </PermissionGate>
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

        {/* Overdue Alert */}
        {(metrics.overdueTasks > 0 || metrics.overdueMilestones > 0 || metrics.overdueProjects > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {metrics.overdueTasks + metrics.overdueMilestones + metrics.overdueProjects} overdue items across your portfolio
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {metrics.overdueTasks > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {metrics.overdueTasks} task{metrics.overdueTasks > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {metrics.overdueMilestones > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {metrics.overdueMilestones} milestone{metrics.overdueMilestones > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {metrics.overdueProjects > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {metrics.overdueProjects} project{metrics.overdueProjects > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="border-warning/30 text-warning shrink-0">
                  Action Required
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

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

      {/* Program Modal */}
      <ProgramModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        teamMembers={teamMembers}
        portfolios={portfolios}
        defaultPortfolioId={portfolio.id}
        currentUserOrgRole={currentOrgRole}
        onSave={async (data) => {
          try {
            await addProgram({
              name: data.name || '',
              description: data.description || '',
              status: data.status || 'planning',
              portfolioId: data.portfolioId || portfolio.id,
              ownerId: data.ownerId || '',
            });
            toast.success('Program created successfully');
            setProgramModalOpen(false);
          } catch (error) {
            toast.error('Failed to create program');
          }
        }}
      />

      {/* Portfolio Modal - for editing current portfolio */}
      <PortfolioModal
        open={portfolioModalOpen}
        onOpenChange={(open) => {
          setPortfolioModalOpen(open);
          if (!open) setEditingPortfolio(null);
        }}
        portfolio={editingPortfolio}
        teamMembers={teamMembers}
        programs={allPrograms.map(p => ({ id: p.id, name: p.name, status: p.status, portfolioId: p.portfolioId }))}
        onSave={async (data) => {
          try {
            if (data.id) {
              await updatePortfolio(data.id, { name: data.name, description: data.description });
              toast.success('Portfolio updated successfully');
            }
            
            // Add existing programs to this portfolio
            if (data.addExistingProgramIds && data.addExistingProgramIds.length > 0 && data.id) {
              for (const programId of data.addExistingProgramIds) {
                await updateProgram(programId, { portfolioId: data.id });
              }
              toast.success(`${data.addExistingProgramIds.length} program(s) added to portfolio`);
            }
            
            // Create new program if requested
            if (data.createProgram && data.id) {
              await addProgram({
                name: data.createProgram.name,
                description: data.createProgram.description,
                status: data.createProgram.status as 'planning' | 'active' | 'on-hold' | 'completed',
                portfolioId: data.id,
                ownerId: data.createProgram.ownerId === 'unassigned' ? '' : (data.createProgram.ownerId || ''),
              });
              toast.success('New program created');
            }
            
            setPortfolioModalOpen(false);
            setEditingPortfolio(null);
          } catch (error) {
            toast.error('Failed to save portfolio');
          }
        }}
      />
    </MainLayout>
  );
}
