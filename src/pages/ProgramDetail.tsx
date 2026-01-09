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
import { Input } from '@/components/ui/input';
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
import { MilestoneCard } from '@/components/programs/MilestoneCard';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bug,
  ArrowRightCircle,
  ChevronRight,
  Trash2,
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

// Milestone task interface
interface MilestoneTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  tasks: MilestoneTask[];
}

// Mock milestones data with tasks
const mockMilestones: Milestone[] = [
  { 
    id: 'm1', 
    title: 'Phase 1 Complete', 
    dueDate: '2025-02-28', 
    projectId: 'p1',
    tasks: [
      { id: 'mt1-1', title: 'Complete design review', completed: true, assigneeId: 't1' },
      { id: 'mt1-2', title: 'Finalize specifications', completed: true, assigneeId: 't2' },
      { id: 'mt1-3', title: 'Sign-off from stakeholders', completed: true, assigneeId: 't4' },
    ]
  },
  { 
    id: 'm2', 
    title: 'Beta Launch', 
    dueDate: '2025-04-15', 
    projectId: 'p2',
    tasks: [
      { id: 'mt2-1', title: 'Complete core features', completed: true, assigneeId: 't3' },
      { id: 'mt2-2', title: 'QA testing complete', completed: false, assigneeId: 't5' },
      { id: 'mt2-3', title: 'Deploy to staging', completed: false, assigneeId: 't1' },
      { id: 'mt2-4', title: 'Beta user onboarding', completed: false, assigneeId: 't2' },
    ]
  },
  { 
    id: 'm3', 
    title: 'Infrastructure Ready', 
    dueDate: '2025-03-30', 
    projectId: 'p3',
    tasks: [
      { id: 'mt3-1', title: 'Provision cloud resources', completed: true, assigneeId: 't1' },
      { id: 'mt3-2', title: 'Configure CI/CD pipeline', completed: false, assigneeId: 't3' },
      { id: 'mt3-3', title: 'Security audit', completed: false, assigneeId: 't4' },
    ]
  },
  { 
    id: 'm4', 
    title: 'API v1.0 Release', 
    dueDate: '2025-05-01', 
    projectId: 'p4',
    tasks: [
      { id: 'mt4-1', title: 'API documentation complete', completed: false, assigneeId: 't2' },
      { id: 'mt4-2', title: 'Integration tests passing', completed: false, assigneeId: 't5' },
      { id: 'mt4-3', title: 'Performance benchmarks met', completed: false, assigneeId: 't1' },
    ]
  },
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

// Mock issues data
interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigneeId?: string;
  projectId: string;
  createdAt: string;
  fromRiskId?: string;
}

const mockIssues: Issue[] = [
  { id: 'i1', title: 'Authentication timeout on mobile', description: 'Users experience timeout errors when logging in on mobile devices', priority: 'high', status: 'in-progress', assigneeId: 't3', projectId: 'p2', createdAt: '2025-01-05' },
  { id: 'i2', title: 'Dashboard charts not loading', description: 'Charts fail to render on first page load', priority: 'medium', status: 'open', assigneeId: 't1', projectId: 'p1', createdAt: '2025-01-07' },
];

const issueStatusColors = {
  'open': 'bg-info/10 text-info border-info/20',
  'in-progress': 'bg-warning/10 text-warning border-warning/20',
  'resolved': 'bg-success/10 text-success border-success/20',
  'closed': 'bg-muted text-muted-foreground border-muted',
};

const issuePriorityColors = {
  'low': 'bg-muted text-muted-foreground border-muted',
  'medium': 'bg-info/10 text-info border-info/20',
  'high': 'bg-warning/10 text-warning border-warning/20',
  'critical': 'bg-destructive/10 text-destructive border-destructive/20',
};

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
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [risks, setRisks] = useState(mockRisks);

  // Find the program - use useMemo to ensure stable reference
  const program = useMemo(() => {
    return programs.find((p) => p.id === programId);
  }, [programs, programId]);

  // Calculate comprehensive stats - always returns a valid object with defaults
  const stats = useMemo(() => {
    if (!program) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        planningProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        reviewTasks: 0,
        overdueTasks: 0,
        avgProgress: 0,
        teamSize: 0,
        healthyProjects: 0,
        atRiskProjects: 0,
        upcomingMilestones: 0,
        completedMilestones: 0,
        totalMilestones: 0,
        openRisks: 0,
        highRisks: 0,
        openIssues: 0,
        criticalIssues: 0,
        totalIssues: 0,
      };
    }

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
    const isMilestoneComplete = (m: Milestone) => m.tasks.length > 0 && m.tasks.every(t => t.completed);
    const upcomingMilestones = programMilestones.filter((m) => !isMilestoneComplete(m));
    const completedMilestonesCount = programMilestones.filter((m) => isMilestoneComplete(m)).length;

    // Risks for this program
    const programRisksFiltered = risks.filter((r) => programProjectIds.includes(r.projectId));
    const openRisks = programRisksFiltered.filter((r) => r.status === 'open');
    const highRisks = openRisks.filter((r) => r.severity === 'high');

    // Issues for this program
    const programIssuesFiltered = issues.filter((i) => programProjectIds.includes(i.projectId));
    const openIssues = programIssuesFiltered.filter((i) => i.status === 'open' || i.status === 'in-progress');
    const criticalIssues = programIssuesFiltered.filter((i) => i.priority === 'critical');

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
      openIssues: openIssues.length,
      criticalIssues: criticalIssues.length,
      totalIssues: programIssuesFiltered.length,
    };
  }, [program, milestones, risks, issues]);

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
    return risks.filter((r) => projectIds.includes(r.projectId));
  }, [program, risks]);

  // Get issues for this program
  const programIssues = useMemo(() => {
    if (!program) return [];
    const projectIds = program.projects.map((p) => p.id);
    return issues.filter((i) => projectIds.includes(i.projectId));
  }, [program, issues]);

  const handleSaveProgram = (data: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === programId ? { ...p, ...data } : p))
    );
  };

  const toggleMilestoneTask = (milestoneId: string, taskId: string) => {
    setMilestones((prev) =>
      prev.map((m) => 
        m.id === milestoneId 
          ? { 
              ...m, 
              tasks: m.tasks.map(t => 
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ) 
            } 
          : m
      )
    );
  };

  const addMilestoneTask = (milestoneId: string, title: string) => {
    if (!title.trim()) return;
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              tasks: [
                ...m.tasks,
                { id: `mt-${Date.now()}`, title: title.trim(), completed: false },
              ],
            }
          : m
      )
    );
  };

  const deleteMilestoneTask = (milestoneId: string, taskId: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
          : m
      )
    );
  };

  const isMilestoneComplete = (milestone: Milestone) => 
    milestone.tasks.length > 0 && milestone.tasks.every(t => t.completed);

  const getProjectName = (projectId: string) => {
    return program?.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const getMilestoneDaysLeft = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, isOverdue: true };
    if (days === 0) return { text: 'Due today', isOverdue: false };
    return { text: `${days} days left`, isOverdue: false };
  };

  const convertRiskToIssue = (riskId: string) => {
    const risk = risks.find((r) => r.id === riskId);
    if (!risk) return;

    // Create new issue from risk
    const newIssue: Issue = {
      id: `i${Date.now()}`,
      title: risk.title,
      description: `Converted from risk: ${risk.title}`,
      priority: risk.severity === 'high' ? 'critical' : risk.severity,
      status: 'open',
      assigneeId: risk.owner,
      projectId: risk.projectId,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      fromRiskId: risk.id,
    };

    setIssues((prev) => [...prev, newIssue]);
    
    // Mark risk as mitigated
    setRisks((prev) =>
      prev.map((r) => (r.id === riskId ? { ...r, status: 'mitigated' } : r))
    );
  };

  const updateIssueStatus = (issueId: string, status: Issue['status']) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status } : i))
    );
  };

  if (!program) {
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
            <TabsTrigger value="issues" className="gap-2">
              <Bug className="h-4 w-4" />
              Issues
              {stats.openIssues > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.openIssues}
                </Badge>
              )}
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
                        .filter((m) => !isMilestoneComplete(m))
                        .slice(0, 4)
                        .map((milestone) => {
                          const daysInfo = getMilestoneDaysLeft(milestone.dueDate);
                          const completedTasks = milestone.tasks.filter(t => t.completed).length;
                          return (
                            <div key={milestone.id} className="flex items-start gap-3">
                              <div className={cn(
                                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                                daysInfo.isOverdue ? "bg-destructive" : "bg-warning"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{milestone.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getProjectName(milestone.projectId)} · {completedTasks}/{milestone.tasks.length} tasks
                                </p>
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
                      {programMilestones.filter((m) => !isMilestoneComplete(m)).length === 0 && (
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
            
            <div className="space-y-3">
              {programMilestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  projectName={getProjectName(milestone.projectId)}
                  teamMembers={mockTeamMembers}
                  daysInfo={getMilestoneDaysLeft(milestone.dueDate)}
                  onToggleTask={toggleMilestoneTask}
                  onAddTask={addMilestoneTask}
                  onDeleteTask={deleteMilestoneTask}
                />
              ))}
            </div>

            {programMilestones.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No milestones defined yet</p>
                  <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                    <Button variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Milestone
                    </Button>
                  </PermissionGate>
                </div>
              </Card>
            )}
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
                              {risk.status === 'open' && (
                                <DropdownMenuItem onClick={() => convertRiskToIssue(risk.id)}>
                                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                                  Convert to Issue
                                </DropdownMenuItem>
                              )}
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

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Issue Tracker</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.openIssues} open · {stats.criticalIssues} critical · {stats.totalIssues} total
                </p>
              </div>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Issue
                </Button>
              </PermissionGate>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programIssues.map((issue) => {
                    const assignee = mockTeamMembers.find((m) => m.id === issue.assigneeId);
                    return (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Bug className={cn(
                              "h-4 w-4 mt-0.5 shrink-0",
                              issue.priority === 'critical' ? "text-destructive" :
                              issue.priority === 'high' ? "text-warning" : "text-muted-foreground"
                            )} />
                            <div>
                              <p className="font-medium">{issue.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{issue.description}</p>
                              {issue.fromRiskId && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <Shield className="mr-1 h-3 w-3" />
                                  From Risk
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getProjectName(issue.projectId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('border capitalize', issuePriorityColors[issue.priority])}>
                            {issue.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('border capitalize', issueStatusColors[issue.status])}>
                            {issue.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {assignee.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(issue.createdAt), 'MMM d, yyyy')}
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
                              <DropdownMenuItem onClick={() => updateIssueStatus(issue.id, 'in-progress')}>
                                Start Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateIssueStatus(issue.id, 'resolved')}>
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateIssueStatus(issue.id, 'closed')}>
                                Close
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {programIssues.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bug className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p>No issues tracked yet</p>
                  <p className="text-sm mt-1">Issues can be created or converted from risks</p>
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
