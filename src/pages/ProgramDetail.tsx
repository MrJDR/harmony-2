import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { WatchButton } from '@/components/watch/WatchButton';
import { ProgramModal } from '@/components/programs/ProgramModal';
import { motion } from 'framer-motion';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
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
  MoreVertical,
  Calendar,
  Target,
  Shield,
  MessageSquare,
  Activity,
  ListTodo,
  ExternalLink,
  Mail,
  Flag,
  Circle,
  AlertCircle,
  Milestone,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Program, Project } from '@/types/portfolio';

const statusColors = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

const riskColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

// Mock milestones data
const mockMilestones = [
  { id: 'm1', title: 'Phase 1 Complete', dueDate: '2025-02-28', completed: true, projectId: 'p1' },
  { id: 'm2', title: 'Beta Launch', dueDate: '2025-04-15', completed: false, projectId: 'p2' },
  { id: 'm3', title: 'Infrastructure Ready', dueDate: '2025-03-30', completed: false, projectId: 'p3' },
  { id: 'm4', title: 'API v1.0 Release', dueDate: '2025-05-01', completed: false, projectId: 'p4' },
];

// Mock risks data
const mockRisks = [
  { id: 'r1', title: 'Resource shortage for Q2', severity: 'high' as const, status: 'open', owner: 't4', projectId: 'p1' },
  { id: 'r2', title: 'Third-party API dependency', severity: 'medium' as const, status: 'mitigated', owner: 't3', projectId: 'p2' },
  { id: 'r3', title: 'Timeline slip risk', severity: 'medium' as const, status: 'open', owner: 't4', projectId: 'p3' },
];

// Mock activity data
const mockProgramActivity = [
  { id: 'a1', type: 'completed' as const, message: 'Design Homepage Mockups completed', project: 'Website Redesign', user: 'Jordan Kim', time: '2 hours ago' },
  { id: 'a2', type: 'progress' as const, message: 'Navigation Component started', project: 'Website Redesign', user: 'Alex Rivera', time: '4 hours ago' },
  { id: 'a3', type: 'comment' as const, message: 'New feedback on authentication flow', project: 'Mobile App Development', user: 'Sam Chen', time: '6 hours ago' },
  { id: 'a4', type: 'milestone' as const, message: 'Phase 1 milestone achieved', project: 'Website Redesign', user: 'Taylor Morgan', time: '1 day ago' },
  { id: 'a5', type: 'assigned' as const, message: 'Casey assigned to QA review', project: 'API Gateway', user: 'Taylor Morgan', time: '2 days ago' },
];

const activityIcons = {
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  progress: <Clock className="h-4 w-4 text-info" />,
  comment: <MessageSquare className="h-4 w-4 text-warning" />,
  assigned: <Circle className="h-4 w-4 text-primary" />,
  milestone: <Flag className="h-4 w-4 text-accent-foreground" />,
};

export default function ProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState(mockPortfolio.programs);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [milestones, setMilestones] = useState(mockMilestones);

  const program = programs.find((p) => p.id === programId);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    if (!program) return null;

    const totalProjects = program.projects.length;
    const activeProjects = program.projects.filter((p) => p.status === 'active').length;
    const planningProjects = program.projects.filter((p) => p.status === 'planning').length;
    const completedProjects = program.projects.filter((p) => p.status === 'completed').length;
    
    const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completedTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
      0
    );
    const inProgressTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'in-progress').length,
      0
    );
    const todoTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'todo').length,
      0
    );
    const reviewTasks = program.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'review').length,
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
    
    // Calculate project health
    const healthyProjects = program.projects.filter((p) => p.progress >= 50 || p.status === 'planning').length;
    const atRiskProjects = program.projects.filter(
      (p) => p.progress < 50 && p.status === 'active'
    ).length;

    // Milestones for this program
    const programProjectIds = program.projects.map((p) => p.id);
    const programMilestones = milestones.filter((m) => programProjectIds.includes(m.projectId));
    const upcomingMilestones = programMilestones.filter((m) => !m.completed);
    const completedMilestonesCount = programMilestones.filter((m) => m.completed).length;

    // Risks for this program
    const programRisks = mockRisks.filter((r) => programProjectIds.includes(r.projectId));
    const openRisks = programRisks.filter((r) => r.status === 'open');
    const highRisks = openRisks.filter((r) => r.severity === 'high');

    return {
      totalProjects,
      activeProjects,
      planningProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      avgProgress,
      teamSize: teamIds.size,
      healthyProjects,
      atRiskProjects,
      upcomingMilestones: upcomingMilestones.length,
      completedMilestones: completedMilestonesCount,
      totalMilestones: programMilestones.length,
      openRisks: openRisks.length,
      highRisks: highRisks.length,
    };
  }, [program, milestones]);

  const owner = program ? mockTeamMembers.find((m) => m.id === program.ownerId) : null;

  // Get team members for this program
  const teamMembers = useMemo(() => {
    if (!program) return [];
    const teamIds = new Set(program.projects.flatMap((p) => p.teamIds));
    return mockTeamMembers.filter((m) => teamIds.has(m.id));
  }, [program]);

  // Get milestones for this program
  const programMilestones = useMemo(() => {
    if (!program) return [];
    const projectIds = program.projects.map((p) => p.id);
    return milestones
      .filter((m) => projectIds.includes(m.projectId))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [program, milestones]);

  // Get risks for this program
  const programRisks = useMemo(() => {
    if (!program) return [];
    const projectIds = program.projects.map((p) => p.id);
    return mockRisks.filter((r) => projectIds.includes(r.projectId));
  }, [program]);

  const handleSaveProgram = (data: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === programId ? { ...p, ...data } : p))
    );
  };

  const toggleMilestone = (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, completed: !m.completed } : m))
    );
  };

  const getProjectName = (projectId: string) => {
    return program?.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const getMilestoneDaysLeft = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, isOverdue: true };
    if (days === 0) return { text: 'Due today', isOverdue: false };
    return { text: `${days} days left`, isOverdue: false };
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
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/programs')}
              className="mt-1 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{program.name}</h1>
                <Badge variant="outline" className={cn('border shrink-0', statusColors[program.status])}>
                  {program.status}
                </Badge>
                <WatchButton id={program.id} type="program" name={program.name} />
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">{program.description}</p>
              {owner && (
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {owner.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Program Owner: </span>
                    <span className="font-medium">{owner.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-12 lg:ml-0">
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Send Update
              </Button>
              <Button size="sm" onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-xs text-muted-foreground">of {stats.totalTasks} tasks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingUp className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Users className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.teamSize}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Milestone className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedMilestones}/{stats.totalMilestones}</p>
                <p className="text-xs text-muted-foreground">Milestones</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stats.highRisks > 0 ? "bg-destructive/10" : "bg-muted")}>
                <Shield className={cn("h-4 w-4", stats.highRisks > 0 ? "text-destructive" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openRisks}</p>
                <p className="text-xs text-muted-foreground">Open Risks</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {(stats.overdueTasks > 0 || stats.highRisks > 0) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {stats.overdueTasks > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1"
              >
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="flex items-center gap-3 py-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                    <span className="text-sm font-medium">
                      {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} require attention
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {stats.highRisks > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1"
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="flex items-center gap-3 py-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <span className="text-sm font-medium">
                      {stats.highRisks} high severity risk{stats.highRisks > 1 ? 's' : ''} identified
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-2">
              <Target className="h-4 w-4" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-2">
              <Shield className="h-4 w-4" />
              Risks
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Progress Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Task Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Task Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">Todo</div>
                        <div className="flex-1">
                          <Progress 
                            value={stats.totalTasks > 0 ? (stats.todoTasks / stats.totalTasks) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">{stats.todoTasks}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">In Progress</div>
                        <div className="flex-1">
                          <Progress 
                            value={stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0} 
                            className="h-2 [&>div]:bg-info" 
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">{stats.inProgressTasks}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">In Review</div>
                        <div className="flex-1">
                          <Progress 
                            value={stats.totalTasks > 0 ? (stats.reviewTasks / stats.totalTasks) * 100 : 0} 
                            className="h-2 [&>div]:bg-warning" 
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">{stats.reviewTasks}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">Done</div>
                        <div className="flex-1">
                          <Progress 
                            value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0} 
                            className="h-2 [&>div]:bg-success" 
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">{stats.completedTasks}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {program.projects.map((project) => (
                        <div 
                          key={project.id} 
                          className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{project.name}</span>
                              <Badge variant="outline" className={cn('border text-xs shrink-0', statusColors[project.status])}>
                                {project.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{project.startDate}</span>
                              <span>→</span>
                              <span>{project.endDate || 'Ongoing'}</span>
                            </div>
                          </div>
                          <div className="w-32">
                            <Progress value={project.progress} className="h-2" />
                          </div>
                          <div className="w-12 text-right text-sm font-medium">
                            {project.progress}%
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Quick Info */}
              <div className="space-y-6">
                {/* Upcoming Milestones */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      Upcoming Milestones
                      <Badge variant="secondary">{stats.upcomingMilestones}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {programMilestones
                        .filter((m) => !m.completed)
                        .slice(0, 4)
                        .map((milestone) => {
                          const daysInfo = getMilestoneDaysLeft(milestone.dueDate);
                          return (
                            <div key={milestone.id} className="flex items-start gap-3">
                              <div className={cn(
                                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                                daysInfo.isOverdue ? "bg-destructive" : "bg-warning"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{milestone.title}</p>
                                <p className="text-xs text-muted-foreground">{getProjectName(milestone.projectId)}</p>
                              </div>
                              <span className={cn(
                                "text-xs shrink-0",
                                daysInfo.isOverdue ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {daysInfo.text}
                              </span>
                            </div>
                          );
                        })}
                      {programMilestones.filter((m) => !m.completed).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All milestones completed!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockProgramActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="mt-0.5 shrink-0">
                            {activityIcons[activity.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.project} · {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      Team
                      <Badge variant="secondary">{teamMembers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.slice(0, 6).map((member) => (
                        <Avatar key={member.id} className="h-9 w-9 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {teamMembers.length > 6 && (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          +{teamMembers.length - 6}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Program Projects</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.activeProjects} active · {stats.planningProjects} planning · {stats.completedProjects} completed
                </p>
              </div>
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
              <Card className="p-12">
                <div className="text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No projects in this program yet</p>
                  <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                    <Button variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Project
                    </Button>
                  </PermissionGate>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Milestones</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.completedMilestones} of {stats.totalMilestones} completed
                </p>
              </div>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </PermissionGate>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programMilestones.map((milestone) => {
                    const daysInfo = getMilestoneDaysLeft(milestone.dueDate);
                    return (
                      <TableRow key={milestone.id}>
                        <TableCell>
                          <Checkbox
                            checked={milestone.completed}
                            onCheckedChange={() => toggleMilestone(milestone.id)}
                          />
                        </TableCell>
                        <TableCell className={cn("font-medium", milestone.completed && "line-through text-muted-foreground")}>
                          {milestone.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getProjectName(milestone.projectId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {milestone.completed ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Completed
                            </Badge>
                          ) : daysInfo.isOverdue ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {daysInfo.text}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {programMilestones.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No milestones defined yet
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Risk Register</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.openRisks} open · {stats.highRisks} high severity
                </p>
              </div>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Risk
                </Button>
              </PermissionGate>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programRisks.map((risk) => {
                    const riskOwner = mockTeamMembers.find((m) => m.id === risk.owner);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{risk.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getProjectName(risk.projectId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('border capitalize', riskColors[risk.severity])}>
                            {risk.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={risk.status === 'open' ? 'default' : 'secondary'} className="capitalize">
                            {risk.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {riskOwner?.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{riskOwner?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Mitigate</DropdownMenuItem>
                              <DropdownMenuItem>Close</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {programRisks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No risks identified
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">
                  {teamMembers.length} people working across {stats.totalProjects} projects
                </p>
              </div>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </PermissionGate>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, index) => {
                const memberProjects = program.projects.filter((p) => p.teamIds.includes(member.id));
                const memberTasks = program.projects
                  .flatMap((p) => p.tasks)
                  .filter((t) => t.assigneeId === member.id);
                const completedMemberTasks = memberTasks.filter((t) => t.status === 'done').length;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {member.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FolderKanban className="h-3 w-3" />
                                {memberProjects.length} projects
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {completedMemberTasks}/{memberTasks.length} tasks
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-lg font-bold",
                              member.allocation > 80 ? "text-destructive" :
                              member.allocation > 60 ? "text-warning" : "text-success"
                            )}>
                              {member.allocation}%
                            </div>
                            <p className="text-xs text-muted-foreground">allocated</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Activity Feed</h2>
              <p className="text-sm text-muted-foreground">
                Recent updates across all projects
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {mockProgramActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4"
                    >
                      <div className="mt-1 shrink-0">
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-muted-foreground"> · </span>
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{activity.project}</span>
                          <span>·</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </motion.div>
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
