import { useMemo, useState } from 'react';
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
import { toast } from 'sonner';

interface ProjectKanbanProps {
  projects: Project[];
  teamMembers: TeamMember[];
  groupBy: 'status' | 'program';
  programs?: Array<{ id: string; name: string }>;
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
}

const statusColumns = [
  { key: 'planning', label: 'Planning', color: 'bg-muted-foreground', bgColor: 'bg-muted-foreground/10', borderColor: 'border-muted-foreground/30' },
  { key: 'active', label: 'Active', color: 'bg-info', bgColor: 'bg-info/10', borderColor: 'border-info/30' },
  { key: 'on-hold', label: 'On Hold', color: 'bg-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
  { key: 'completed', label: 'Completed', color: 'bg-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' },
];

export function ProjectKanban({ projects, teamMembers, groupBy, programs = [], onProjectUpdate }: ProjectKanbanProps) {
  const navigate = useNavigate();
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
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

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id);
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
    setDraggedProject(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedProject || !onProjectUpdate) return;

    if (groupBy === 'status') {
      if (draggedProject.status !== columnKey) {
        onProjectUpdate(draggedProject.id, { status: columnKey as Project['status'] });
        toast.success(`Project moved to ${statusColumns.find(c => c.key === columnKey)?.label || columnKey}`);
      }
    } else {
      if (draggedProject.programId !== columnKey) {
        onProjectUpdate(draggedProject.id, { programId: columnKey });
        toast.success(`Project moved to ${programs.find(p => p.id === columnKey)?.name || 'new program'}`);
      }
    }
    
    setDraggedProject(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => {
        const isOver = dragOverColumn === column.key;
        
        return (
          <div 
            key={column.key} 
            className="flex-shrink-0 w-[300px]"
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className={cn(
              "rounded-t-lg px-3 py-2 border border-b-0 border-border",
              column.bgColor
            )}>
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', column.color)} />
                <h3 className="font-medium text-sm">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {column.projects.length}
                </Badge>
              </div>
            </div>

            <div className={cn(
              "min-h-[400px] rounded-b-lg border border-t-0 border-border bg-muted p-2 space-y-3 transition-colors duration-200",
              isOver && "bg-primary/10 border-primary/30"
            )}>
              {column.projects.map((project, index) => {
                const projectTeam = teamMembers.filter((tm) =>
                  project.teamIds?.includes(tm.id)
                );
                const isDragging = draggedProject?.id === project.id;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: colIndex * 0.05 + index * 0.02 }}
                    draggable={!!onProjectUpdate}
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project)}
                    onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all active:cursor-grabbing",
                        isDragging && "opacity-50 scale-95"
                      )}
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
                <div className={cn(
                  "rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors",
                  isOver && "border-primary bg-primary/5"
                )}>
                  {isOver ? 'Drop here' : 'No projects'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}