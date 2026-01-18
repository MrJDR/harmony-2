import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users } from 'lucide-react';
import { Project, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ProjectKanbanProps {
  projects: Project[];
  teamMembers: TeamMember[];
  groupBy: 'status' | 'program';
  programs?: Array<{ id: string; name: string }>;
}

const statusColumns = [
  { key: 'planning', label: 'Planning', color: 'bg-muted-foreground' },
  { key: 'active', label: 'Active', color: 'bg-info' },
  { key: 'on-hold', label: 'On Hold', color: 'bg-warning' },
  { key: 'completed', label: 'Completed', color: 'bg-success' },
];

export function ProjectKanban({ projects, teamMembers, groupBy, programs = [] }: ProjectKanbanProps) {
  const navigate = useNavigate();

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return statusColumns.map((col) => ({
        ...col,
        projects: projects.filter((p) => p.status === col.key),
      }));
    } else {
      // Group by program
      const programMap = new Map<string, Project[]>();
      projects.forEach((p) => {
        const programId = p.programId;
        if (!programMap.has(programId)) {
          programMap.set(programId, []);
        }
        programMap.get(programId)!.push(p);
      });

      return programs.map((program) => ({
        key: program.id,
        label: program.name,
        color: 'bg-primary',
        projects: programMap.get(program.id) || [],
      }));
    }
  }, [projects, groupBy, programs]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-muted text-muted-foreground',
      active: 'bg-info/10 text-info border-info/30',
      'on-hold': 'bg-warning/10 text-warning border-warning/30',
      completed: 'bg-success/10 text-success border-success/30',
    };
    return colors[status] || colors.planning;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => (
        <div key={column.key} className="flex-shrink-0 w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-2 h-2 rounded-full', column.color)} />
            <h3 className="font-medium text-sm">{column.label}</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {column.projects.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {column.projects.map((project, index) => {
              const projectTeam = teamMembers.filter((tm) =>
                project.teamIds?.includes(tm.id)
              );

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.05 + index * 0.02 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {project.name}
                        </CardTitle>
                        {groupBy === 'program' && (
                          <Badge variant="outline" className={cn('text-xs shrink-0', getStatusBadge(project.status))}>
                            {project.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        {project.endDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>{format(new Date(project.endDate), 'MMM d')}</span>
                          </div>
                        )}

                        {projectTeam.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <div className="flex -space-x-1.5">
                              {projectTeam.slice(0, 3).map((member) => (
                                <Avatar key={member.id} className="h-5 w-5 border border-background">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-[8px]">
                                    {member.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {projectTeam.length > 3 && (
                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] border border-background">
                                  +{projectTeam.length - 3}
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

            {column.projects.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No projects
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
