import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download, 
  FileText, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Briefcase,
  Layers,
  FolderKanban,
  Activity,
  Search,
  Filter,
  Mail,
  Settings,
  UserPlus,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useActivityLog, type ActivityCategory } from '@/contexts/ActivityLogContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/contexts/PermissionsContext';
import { PermissionGate } from '@/components/permissions/PermissionGate';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

const activityTypeIcons: Record<string, typeof CheckCircle2> = {
  task_created: Plus,
  task_updated: Edit,
  task_deleted: Trash2,
  task_completed: CheckCircle2,
  task_assigned: UserPlus,
  subtask_added: Plus,
  subtask_completed: CheckCircle2,
  subtask_deleted: Trash2,
  project_created: Plus,
  project_updated: Edit,
  project_deleted: Trash2,
  program_created: Plus,
  program_updated: Edit,
  team_member_added: UserPlus,
  team_member_removed: Trash2,
  contact_created: Plus,
  contact_updated: Edit,
  contact_deleted: Trash2,
  email_sent: Mail,
  permission_changed: Settings,
  role_assigned: UserPlus,
  settings_updated: Settings,
  report_exported: Download,
  login: Users,
  logout: Users,
};

const categoryColors: Record<ActivityCategory, string> = {
  tasks: 'bg-info/20 text-info',
  projects: 'bg-primary/20 text-primary',
  programs: 'bg-warning/20 text-warning',
  team: 'bg-success/20 text-success',
  contacts: 'bg-accent text-accent-foreground',
  email: 'bg-muted text-muted-foreground',
  settings: 'bg-destructive/20 text-destructive',
  auth: 'bg-secondary text-secondary-foreground',
  reports: 'bg-info/20 text-info',
};

export default function Reports() {
  const { projects, programs, teamMembers, milestones, portfolio } = usePortfolioData();
  const { logs } = useActivityLog();
  const { hasOrgPermission } = usePermissions();
  const [dateRange, setDateRange] = useState('this-month');
  const [reportType, setReportType] = useState('overview');
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');

  // Filter logs based on search and category
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = logSearch === '' || 
        log.title.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.userName.toLowerCase().includes(logSearch.toLowerCase());
      
      const matchesCategory = logCategoryFilter === 'all' || log.category === logCategoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [logs, logSearch, logCategoryFilter]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const allTasks = projects.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = allTasks.filter(t => t.status === 'todo').length;
    const reviewTasks = allTasks.filter(t => t.status === 'review').length;
    
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;

    const highPriorityTasks = allTasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

    // Project stats
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const planningProjects = projects.filter(p => p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;

    // Average progress
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0;

    // Team utilization
    const totalAllocation = teamMembers.reduce((sum, m) => sum + m.allocation, 0);
    const totalCapacity = teamMembers.reduce((sum, m) => sum + m.capacity, 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalAllocation / totalCapacity) * 100) : 0;

    // Upcoming milestones
    const upcomingMilestones = milestones.filter(m => 
      new Date(m.dueDate) > new Date()
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      highPriorityTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      activeProjects,
      planningProjects,
      completedProjects,
      onHoldProjects,
      totalProjects: projects.length,
      avgProgress,
      utilizationRate,
      upcomingMilestones,
      totalPrograms: programs.length,
    };
  }, [projects, programs, teamMembers, milestones]);

  // Chart data
  const taskStatusData = [
    { name: 'To Do', value: stats.todoTasks, color: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: stats.inProgressTasks, color: 'hsl(var(--info))' },
    { name: 'Review', value: stats.reviewTasks, color: 'hsl(var(--warning))' },
    { name: 'Done', value: stats.completedTasks, color: 'hsl(var(--success))' },
  ];

  const projectStatusData = [
    { name: 'Planning', value: stats.planningProjects, color: 'hsl(var(--muted-foreground))' },
    { name: 'Active', value: stats.activeProjects, color: 'hsl(var(--info))' },
    { name: 'Completed', value: stats.completedProjects, color: 'hsl(var(--success))' },
    { name: 'On Hold', value: stats.onHoldProjects, color: 'hsl(var(--warning))' },
  ];

  const projectProgressData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    progress: p.progress,
    tasks: p.tasks.length,
  }));

  const teamWorkloadData = teamMembers.map(m => ({
    name: m.name.split(' ')[0],
    allocation: m.allocation,
    capacity: m.capacity,
    available: m.capacity - m.allocation,
  }));

  const tasksByPriorityData = useMemo(() => {
    const allTasks = projects.flatMap(p => p.tasks);
    return [
      { name: 'High', value: allTasks.filter(t => t.priority === 'high').length },
      { name: 'Medium', value: allTasks.filter(t => t.priority === 'medium').length },
      { name: 'Low', value: allTasks.filter(t => t.priority === 'low').length },
    ];
  }, [projects]);

  const tasksByProjectData = useMemo(() => {
    return projects.map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      total: p.tasks.length,
      completed: p.tasks.filter(t => t.status === 'done').length,
      pending: p.tasks.filter(t => t.status !== 'done').length,
    }));
  }, [projects]);

  // Trend data computed from actual tasks (grouped by week)
  const trendData = useMemo(() => {
    const allTasks = projects.flatMap(p => p.tasks);
    if (allTasks.length === 0) return [];
    
    // Group tasks by week based on created_at or due_date
    const weekMap: Record<string, { completed: number; created: number }> = {};
    
    allTasks.forEach(task => {
      // Use due date or current week as fallback
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date();
      const weekStart = format(taskDate, "'Week' w");
      
      if (!weekMap[weekStart]) {
        weekMap[weekStart] = { completed: 0, created: 0 };
      }
      
      weekMap[weekStart].created += 1;
      if (task.status === 'done') {
        weekMap[weekStart].completed += 1;
      }
    });
    
    return Object.entries(weekMap)
      .map(([week, data]) => ({ week, ...data }))
      .slice(0, 4); // Show last 4 weeks max
  }, [projects]);

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="reports-tabs">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Comprehensive analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Task Completion</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
                </div>
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  stats.completionRate >= 70 ? "bg-success/20" : stats.completionRate >= 40 ? "bg-warning/20" : "bg-destructive/20"
                )}>
                  <CheckCircle2 className={cn(
                    "h-6 w-6",
                    stats.completionRate >= 70 ? "text-success" : stats.completionRate >= 40 ? "text-warning" : "text-destructive"
                  )} />
                </div>
              </div>
              <Progress value={stats.completionRate} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Utilization</p>
                  <p className="text-2xl font-bold text-foreground">{stats.utilizationRate}%</p>
                </div>
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  stats.utilizationRate <= 80 ? "bg-success/20" : stats.utilizationRate <= 95 ? "bg-warning/20" : "bg-destructive/20"
                )}>
                  <Users className={cn(
                    "h-6 w-6",
                    stats.utilizationRate <= 80 ? "text-success" : stats.utilizationRate <= 95 ? "text-warning" : "text-destructive"
                  )} />
                </div>
              </div>
              <Progress value={stats.utilizationRate} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                Across {teamMembers.length} team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{stats.overdueTasks}</p>
                </div>
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  stats.overdueTasks === 0 ? "bg-success/20" : stats.overdueTasks <= 3 ? "bg-warning/20" : "bg-destructive/20"
                )}>
                  <AlertTriangle className={cn(
                    "h-6 w-6",
                    stats.overdueTasks === 0 ? "text-success" : stats.overdueTasks <= 3 ? "text-warning" : "text-destructive"
                  )} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={stats.highPriorityTasks > 0 ? "destructive" : "secondary"}>
                  {stats.highPriorityTasks} high priority
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Project Progress</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avgProgress}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={stats.avgProgress} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                Across {stats.totalProjects} projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <PermissionGate orgPermission="view_task_reports" fallback={null}>
              <TabsTrigger value="tasks">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Tasks
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate orgPermission="view_project_reports" fallback={null}>
              <TabsTrigger value="projects">
                <FolderKanban className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate orgPermission="view_resource_reports" fallback={null}>
              <TabsTrigger value="resources">
                <Users className="mr-2 h-4 w-4" />
                Resources
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate orgPermission="view_activity_logs" fallback={null}>
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate allowedOrgRoles={['owner', 'admin']}>
              <TabsTrigger value="executive">
                <Briefcase className="mr-2 h-4 w-4" />
                Executive
              </TabsTrigger>
            </PermissionGate>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Status Distribution</CardTitle>
                  <CardDescription>Current status of all tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Progress</CardTitle>
                  <CardDescription>Progress by project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectProgressData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={140} 
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => value.length > 18 ? `${value.slice(0, 18)}...` : value}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, 'Progress']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Completion Trend</CardTitle>
                <CardDescription>Weekly task completion vs creation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stackId="1" 
                        stroke="hsl(var(--success))" 
                        fill="hsl(var(--success))" 
                        fillOpacity={0.3}
                        name="Completed"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        stackId="2" 
                        stroke="hsl(var(--info))" 
                        fill="hsl(var(--info))" 
                        fillOpacity={0.3}
                        name="Created"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks by Priority</CardTitle>
                  <CardDescription>Distribution of task priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tasksByPriorityData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          <Cell fill="hsl(var(--destructive))" />
                          <Cell fill="hsl(var(--warning))" />
                          <Cell fill="hsl(var(--success))" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks by Project</CardTitle>
                  <CardDescription>Completed vs pending tasks per project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tasksByProjectData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" stackId="a" fill="hsl(var(--success))" name="Completed" />
                        <Bar dataKey="pending" stackId="a" fill="hsl(var(--muted-foreground))" name="Pending" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map(project => {
                    const projectTasks = project.tasks;
                    const completed = projectTasks.filter(t => t.status === 'done').length;
                    const overdue = projectTasks.filter(t => 
                      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
                    ).length;
                    
                    return (
                      <div key={project.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FolderKanban className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {projectTasks.length} tasks · {completed} completed
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {overdue > 0 && (
                            <Badge variant="destructive">{overdue} overdue</Badge>
                          )}
                          <div className="w-32">
                            <Progress 
                              value={projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Status Distribution</CardTitle>
                  <CardDescription>Current status of all projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio Overview</CardTitle>
                  <CardDescription>High-level portfolio metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="font-medium">Portfolio</span>
                    </div>
                    <span className="text-lg font-bold">{portfolio ? 1 : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-info" />
                      <span className="font-medium">Programs</span>
                    </div>
                    <span className="text-lg font-bold">{stats.totalPrograms}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-5 w-5 text-warning" />
                      <span className="font-medium">Projects</span>
                    </div>
                    <span className="text-lg font-bold">{stats.totalProjects}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-medium">Tasks</span>
                    </div>
                    <span className="text-lg font-bold">{stats.totalTasks}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Milestones</CardTitle>
                <CardDescription>Key milestones across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.sort((a, b) => 
                    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                  ).map(milestone => {
                    const project = projects.find(p => p.id === milestone.projectId);
                    const daysUntil = differenceInDays(new Date(milestone.dueDate), new Date());
                    const isOverdue = daysUntil < 0;
                    
                    return (
                      <div key={milestone.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            isOverdue ? "bg-destructive/20" : daysUntil <= 7 ? "bg-warning/20" : "bg-success/20"
                          )}>
                            <Target className={cn(
                              "h-5 w-5",
                              isOverdue ? "text-destructive" : daysUntil <= 7 ? "text-warning" : "text-success"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{milestone.title}</p>
                            <p className="text-sm text-muted-foreground">{project?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={isOverdue ? "destructive" : daysUntil <= 7 ? "outline" : "secondary"}>
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Workload</CardTitle>
                  <CardDescription>Allocation vs capacity per team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamWorkloadData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="allocation" fill="hsl(var(--primary))" name="Allocated" />
                        <Bar dataKey="available" fill="hsl(var(--muted))" name="Available" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resource Utilization</CardTitle>
                  <CardDescription>Team member utilization rates</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map(member => {
                    const utilization = Math.round((member.allocation / member.capacity) * 100);
                    return (
                      <div key={member.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-foreground">{member.name}</span>
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              utilization > 100 ? "text-destructive" : utilization > 80 ? "text-warning" : "text-success"
                            )}>
                              {utilization}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={cn(
                              utilization > 100 && "[&>div]:bg-destructive",
                              utilization > 80 && utilization <= 100 && "[&>div]:bg-warning"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Executive Tab - Permission Gated */}
          <TabsContent value="executive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Executive Summary</CardTitle>
                <CardDescription>High-level overview for stakeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Overall Health</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      {stats.overdueTasks === 0 && stats.completionRate >= 50 ? (
                        <>
                          <TrendingUp className="h-5 w-5 text-success" />
                          <span className="text-lg font-bold text-success">On Track</span>
                        </>
                      ) : stats.overdueTasks <= 3 ? (
                        <>
                          <Clock className="h-5 w-5 text-warning" />
                          <span className="text-lg font-bold text-warning">At Risk</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-5 w-5 text-destructive" />
                          <span className="text-lg font-bold text-destructive">Off Track</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Budget Status</p>
                    <p className="mt-2 text-lg font-bold text-success">Within Budget</p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Resource Status</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{stats.utilizationRate}% Utilized</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium text-foreground">Key Highlights</h4>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {stats.completedTasks} tasks completed this period
                    </li>
                    <li className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-info" />
                      {stats.activeProjects} projects currently active
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-warning" />
                      {stats.upcomingMilestones} milestones upcoming
                    </li>
                    {stats.overdueTasks > 0 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        {stats.overdueTasks} tasks require immediate attention
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                    <CardDescription>Track all actions across the application</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select value={logCategoryFilter} onValueChange={setLogCategoryFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="programs">Programs</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="contacts">Contacts</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="settings">Settings</SelectItem>
                        <SelectItem value="reports">Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium text-muted-foreground">No activity found</p>
                        <p className="text-sm text-muted-foreground">
                          {logSearch || logCategoryFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Activity will appear here as actions are taken'}
                        </p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => {
                        const IconComponent = activityTypeIcons[log.type] || Activity;
                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                          >
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              categoryColors[log.category]
                            )}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-foreground">{log.title}</p>
                                  <p className="text-sm text-muted-foreground">{log.description}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0 capitalize">
                                  {log.category}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {log.userName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                </span>
                                {log.entityName && (
                                  <span className="truncate">
                                    → {log.entityName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              {(['tasks', 'projects', 'team', 'settings'] as ActivityCategory[]).map(category => {
                const count = logs.filter(l => l.category === category).length;
                return (
                  <Card key={category}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground capitalize">{category}</p>
                          <p className="text-2xl font-bold text-foreground">{count}</p>
                        </div>
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", categoryColors[category])}>
                          {category === 'tasks' && <CheckCircle2 className="h-5 w-5" />}
                          {category === 'projects' && <FolderKanban className="h-5 w-5" />}
                          {category === 'team' && <Users className="h-5 w-5" />}
                          {category === 'settings' && <Settings className="h-5 w-5" />}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Total {category} activities
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}