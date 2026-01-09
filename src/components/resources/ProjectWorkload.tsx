import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TeamMember, Project } from '@/types/portfolio';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectWorkloadProps {
  projects: Project[];
  members: TeamMember[];
}

export function ProjectWorkload({ projects, members }: ProjectWorkloadProps) {
  const navigate = useNavigate();

  const getProjectMembers = (project: Project) => {
    return members.filter(m => m.projectIds.includes(project.id));
  };

  const getWorkloadStatus = (memberCount: number) => {
    if (memberCount === 0) return { label: 'Understaffed', color: 'text-destructive' };
    if (memberCount <= 2) return { label: 'Light', color: 'text-warning' };
    if (memberCount <= 4) return { label: 'Balanced', color: 'text-success' };
    return { label: 'Heavy', color: 'text-info' };
  };

  // Sort projects by number of members (least to most, to highlight understaffed)
  const sortedProjects = [...projects].sort((a, b) => {
    const aMembers = getProjectMembers(a).length;
    const bMembers = getProjectMembers(b).length;
    return aMembers - bMembers;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
    >
      <div className="border-b border-border p-6">
        <h3 className="font-display text-lg font-semibold text-card-foreground">
          Project Workload
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Resource distribution across projects</p>
      </div>

      <div className="divide-y divide-border">
        {sortedProjects.map(project => {
          const projectMembers = getProjectMembers(project);
          const status = getWorkloadStatus(projectMembers.length);

          return (
            <div key={project.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{project.name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn('text-sm', status.color)}>{status.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {projectMembers.length} team member{projectMembers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex -space-x-2">
                  {projectMembers.slice(0, 5).map(member => (
                    <Avatar key={member.id} className="h-7 w-7 border-2 border-card">
                      <AvatarFallback className="bg-accent text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {projectMembers.length > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                      +{projectMembers.length - 5}
                    </div>
                  )}
                  {projectMembers.length === 0 && (
                    <span className="text-sm text-destructive">No team assigned</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{project.progress}% complete</span>
              </div>

              <Progress value={project.progress} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
