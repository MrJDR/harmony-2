import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { WatchButton } from '@/components/watch/WatchButton';
import { ProgramModal } from '@/components/programs/ProgramModal';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Plus,
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Program } from '@/types/portfolio';

const statusColors = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export default function ProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState(mockPortfolio.programs);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const program = programs.find((p) => p.id === programId);

  const stats = useMemo(() => {
    if (!program) return null;

    const totalProjects = program.projects.length;
    const activeProjects = program.projects.filter((p) => p.status === 'active').length;
    const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completedTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
      0
    );
    const inProgressTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'in-progress').length,
      0
    );
    const overdueTasks = program.projects.reduce(
      (acc, p) =>
        acc +
        p.tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
        ).length,
      0
    );
    const avgProgress = totalProjects > 0
      ? Math.round(program.projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects)
      : 0;
    const teamIds = new Set(program.projects.flatMap((p) => p.teamIds));

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      avgProgress,
      teamSize: teamIds.size,
    };
  }, [program]);

  const owner = program ? mockTeamMembers.find((m) => m.id === program.ownerId) : null;

  const handleSaveProgram = (data: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId ? { ...p, ...data } : p
      )
    );
  };

  if (!program || !stats) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Program not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/programs')}>
            Back to Programs
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/programs')}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
                <Badge variant="outline" className={cn('border', statusColors[program.status])}>
                  {program.status}
                </Badge>
                <WatchButton id={program.id} type="program" name={program.name} />
              </div>
              <p className="text-muted-foreground mt-1">{program.description}</p>
              {owner && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>Owner:</span>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {owner.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{owner.name}</span>
                </div>
              )}
            </div>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <Button onClick={() => setEditModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Program
            </Button>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.completedTasks}/{stats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgProgress}%</div>
                <Progress value={stats.avgProgress} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamSize}</div>
                <p className="text-xs text-muted-foreground">team members</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Overdue Alert */}
        {stats.overdueTasks > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">
                  {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} across projects
                </span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Program Projects</h2>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </PermissionGate>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {program.projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard
                    project={project}
                    teamMembers={mockTeamMembers}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                </motion.div>
              ))}
            </div>
            {program.projects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No projects in this program yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockTeamMembers
                .filter((m) =>
                  program.projects.some((p) => p.teamIds.includes(m.id))
                )
                .map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.allocation}%</p>
                          <p className="text-xs text-muted-foreground">allocated</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <h2 className="text-lg font-semibold">Project Timeline</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {program.projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-4">
                      <div className="w-40 truncate font-medium">{project.name}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{project.startDate}</span>
                          <span>→</span>
                          <span>{project.endDate || 'Ongoing'}</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">
                        {project.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProgramModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        program={program}
        teamMembers={mockTeamMembers}
        onSave={handleSaveProgram}
      />
    </MainLayout>
  );
}
