import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Grid3X3, List } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Projects() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allProjects = mockPortfolio.programs.flatMap((p) => p.projects);

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
              {allProjects.length} projects across all programs
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
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
              className={cn(
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              )}
            >
              {allProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  teamMembers={mockTeamMembers}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allProjects
                .filter((p) => p.status === 'active')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={mockTeamMembers}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="planning">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allProjects
                .filter((p) => p.status === 'planning')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={mockTeamMembers}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allProjects
                .filter((p) => p.status === 'completed')
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={mockTeamMembers}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
