import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Grid3X3, List } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { cn } from '@/lib/utils';
import { Project } from '@/types/portfolio';

export default function Projects() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Projects</h1>
              <p className="mt-1 text-muted-foreground">
                {projects.length} projects across all programs
              </p>
          </div>
          <div className="flex items-center gap-3">
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
              <Button data-tour="new-project" onClick={handleNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </PermissionGate>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
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
