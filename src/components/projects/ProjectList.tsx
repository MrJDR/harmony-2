import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, FolderKanban, Users } from 'lucide-react';
import { Project, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ProjectListProps {
  projects: Project[];
  teamMembers: TeamMember[];
  programs?: Array<{ id: string; name: string }>;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-info/10 text-info border-info/30',
  'on-hold': 'bg-warning/10 text-warning border-warning/30',
  completed: 'bg-success/10 text-success border-success/30',
};

export function ProjectList({ projects, teamMembers, programs = [] }: ProjectListProps) {
  const navigate = useNavigate();

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || 'Unknown Program';
  };

  return (
    <div className="space-y-2">
      {projects.map((project, index) => {
        const projectTeam = teamMembers.filter((tm) =>
          project.teamIds?.includes(tm.id)
        );

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{project.name}</h3>
                      <Badge variant="outline" className={cn('text-xs shrink-0', statusColors[project.status])}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        <span>{getProgramName(project.programId)}</span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>Due {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-full sm:w-32 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Team */}
                  {projectTeam.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {projectTeam.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {projectTeam.length > 4 && (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{projectTeam.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No projects found</p>
        </div>
      )}
    </div>
  );
}
