import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './ProjectCard';
import { ResourceChart } from './ResourceChart';
import { RecentActivity } from './RecentActivity';
import { StatsCard } from './StatsCard';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { Project, TeamMember } from '@/types/portfolio';

interface ProjectsSectionProps {
  projects: Project[];
  teamMembers: TeamMember[];
}

export function ProjectsSection({ projects, teamMembers }: ProjectsSectionProps) {
  const navigate = useNavigate();

  return (
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
  );
}
