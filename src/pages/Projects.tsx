import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Grid3X3, List, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { cn } from '@/lib/utils';
import { Project } from '@/types/portfolio';

export default function Projects() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { tasks, milestones } = usePortfolioData();

  // Calculate overdue items for all projects
  const overdueItems = useMemo(() => {
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    const overdueMilestones = milestones.filter(m => {
      if (new Date(m.dueDate) >= new Date()) return false;
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      return milestoneTasks.length === 0 || !milestoneTasks.every(t => t.status === 'done');
    }).length;
    
    return { tasks: overdueTasks, milestones: overdueMilestones };
  }, [tasks, milestones]);
  
  const { projects, programs, teamMembers, addProject, updateProject } = usePortfolioData();

  const handleNewProject = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleSaveProject = (data: Partial<Project>) => {
    if (data.id) {
      updateProject(data.id, data);
    } else {
      const programId = data.programId || programs[0]?.id;
      if (!programId) return;
      addProject({
        name: data.name || 'New Project',
        description: data.description || '',
        status: data.status || 'planning',
        progress: 0,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        programId,
        teamIds: [],
      }, programId);
    }
    setEditingProject(null);
    setModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              {projects.length} projects across all programs
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager', 'member']}>
              <Button data-tour="new-project" onClick={handleNewProject} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">New </span>Project
              </Button>
            </PermissionGate>
          </div>
        </motion.div>

        {/* Overdue Alert */}
        {(overdueItems.tasks > 0 || overdueItems.milestones > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:py-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium">
                    {overdueItems.tasks + overdueItems.milestones} overdue items
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {overdueItems.tasks > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {overdueItems.tasks} task{overdueItems.tasks > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {overdueItems.milestones > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {overdueItems.milestones} milestone{overdueItems.milestones > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="border-warning/30 text-warning shrink-0 text-xs">
                  Action Required
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
            <TabsTrigger value="planning" className="text-xs sm:text-sm">Planning</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div
              data-tour="project-list"
              className={cn(
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              )}
            >
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter((p) => p.status === 'active')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="planning">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter((p) => p.status === 'planning')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter((p) => p.status === 'completed')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        programs={programs}
        defaultProgramId={programs[0]?.id}
      />
    </MainLayout>
  );
}
