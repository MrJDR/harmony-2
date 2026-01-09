import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Briefcase, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { TeamMember, Project, Task } from '@/types/portfolio';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TeamMemberDetailProps {
  member: TeamMember;
  projects: Project[];
  tasks: Task[];
  onBack: () => void;
}

function getAllocationColor(allocation: number): string {
  if (allocation >= 100) return 'text-destructive';
  if (allocation >= 85) return 'text-warning';
  return 'text-success';
}

export function TeamMemberDetail({ member, projects, tasks, onBack }: TeamMemberDetailProps) {
  const memberProjects = projects.filter(p => member.projectIds.includes(p.id));
  const memberTasks = tasks.filter(t => t.assigneeId === member.id);
  const completedTasks = memberTasks.filter(t => t.status === 'done');
  const inProgressTasks = memberTasks.filter(t => t.status === 'in-progress');
  const todoTasks = memberTasks.filter(t => t.status === 'todo');

  const getProjectById = (projectId: string) => projects.find(p => p.id === projectId);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Resources
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 shadow-card"
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-accent text-xl font-semibold">
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{member.name}</h1>
            <p className="text-muted-foreground">{member.role}</p>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {member.email}
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {memberProjects.length} projects
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {memberTasks.length} tasks assigned
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">Allocation</span>
                <span className={cn('font-semibold', getAllocationColor(member.allocation))}>
                  {member.allocation}%
                </span>
              </div>
              <Progress value={Math.min(member.allocation, 100)} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:min-w-[240px]">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{todoTasks.length}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-info">{inProgressTasks.length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-success">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects ({memberProjects.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({memberTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {memberProjects.map(project => (
              <div
                key={project.id}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                  <Badge variant={
                    project.status === 'active' ? 'default' :
                    project.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {project.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
                {project.endDate && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {format(new Date(project.endDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            ))}
            {memberProjects.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No projects assigned
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="tasks">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
          >
            <div className="divide-y divide-border">
              {memberTasks.map(task => {
                const project = getProjectById(task.projectId);
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      task.status === 'done' && 'bg-success',
                      task.status === 'in-progress' && 'bg-info',
                      task.status === 'todo' && 'bg-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{task.title}</p>
                      {project && (
                        <p className="text-sm text-muted-foreground">{project.name}</p>
                      )}
                    </div>
                    <Badge variant={
                      task.priority === 'high' ? 'destructive' :
                      task.priority === 'medium' ? 'default' : 'secondary'
                    } className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                );
              })}
              {memberTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks assigned
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
