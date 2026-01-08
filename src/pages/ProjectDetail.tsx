import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { AddTeamMemberModal } from '@/components/projects/AddTeamMemberModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Project, Task } from '@/types/portfolio';
import { WatchButton } from '@/components/watch/WatchButton';

const statusColors = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

const taskStatusConfig = {
  todo: { icon: Circle, color: 'text-muted-foreground', label: 'To Do' },
  'in-progress': { icon: Clock, color: 'text-info', label: 'In Progress' },
  review: { icon: AlertCircle, color: 'text-warning', label: 'Review' },
  done: { icon: CheckCircle2, color: 'text-success', label: 'Done' },
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Find the initial project data
  const allProjects = mockPortfolio.programs.flatMap((p) => p.projects);
  const initialProject = allProjects.find((p) => p.id === projectId);
  const program = mockPortfolio.programs.find((p) => p.id === initialProject?.programId);

  // State management
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [tasks, setTasks] = useState<Task[]>(initialProject?.tasks || []);
  const [teamIds, setTeamIds] = useState<string[]>(initialProject?.teamIds || []);

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);

  if (!project) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
          <p className="mt-2 text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/projects')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }

  const assignedMembers = mockTeamMembers.filter((m) => teamIds.includes(m.id));

  // Task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const daysRemaining = project.endDate
    ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate progress based on tasks
  const calculatedProgress = taskStats.total > 0 
    ? Math.round((taskStats.done / taskStats.total) * 100) 
    : project.progress;

  // Task handlers
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData } as Task : t))
      );
      toast({ title: 'Task updated', description: 'The task has been updated successfully.' });
    } else {
      const newTask: Task = {
        id: taskData.id || `task-${Date.now()}`,
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        assigneeId: taskData.assigneeId,
        dueDate: taskData.dueDate,
        projectId: project.id,
        subtasks: [],
      };
      setTasks((prev) => [...prev, newTask]);
      toast({ title: 'Task created', description: 'The task has been created successfully.' });
    }
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = () => {
    if (deleteTaskId) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskId));
      toast({ title: 'Task deleted', description: 'The task has been deleted.' });
      setDeleteTaskId(null);
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  // Project handlers
  const handleSaveProject = (projectData: Partial<Project>) => {
    setProject((prev) => prev ? { ...prev, ...projectData } : null);
    toast({ title: 'Project updated', description: 'Project details have been saved.' });
  };

  const handleDeleteProject = () => {
    toast({ title: 'Project deleted', description: 'The project has been deleted.' });
    navigate('/projects');
  };

  // Team handlers
  const handleAddMembers = (memberIds: string[]) => {
    setTeamIds((prev) => [...prev, ...memberIds]);
    toast({ 
      title: 'Members added', 
      description: `${memberIds.length} member(s) added to the project.` 
    });
  };

  const handleRemoveMember = () => {
    if (removeMemberId) {
      setTeamIds((prev) => prev.filter((id) => id !== removeMemberId));
      toast({ title: 'Member removed', description: 'Team member has been removed from the project.' });
      setRemoveMemberId(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Projects
            </button>
            <span className="text-muted-foreground">/</span>
            {program && (
              <>
                <button
                  onClick={() => navigate('/programs')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {program.name}
                </button>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <span className="text-foreground font-medium">{project.name}</span>
          </div>

          {/* Title Row */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-foreground">
                  {project.name}
                </h1>
                <Badge variant="outline" className={cn('border', statusColors[project.status])}>
                  {project.status}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground max-w-2xl">{project.description}</p>
            </div>

            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <div className="flex items-center gap-2">
                <WatchButton 
                  id={project.id} 
                  type="project" 
                  name={project.name} 
                  variant="outline"
                  showLabel 
                />
                <Button variant="outline" onClick={() => setShowProjectModal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
                    <DropdownMenuItem>Archive Project</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setShowDeleteProjectDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </PermissionGate>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Progress Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-2xl font-bold text-foreground">{calculatedProgress}%</span>
            </div>
            <Progress value={calculatedProgress} className="mt-3 h-2" />
          </div>

          {/* Tasks Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <span className="text-2xl font-bold text-foreground">{taskStats.total}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-xs text-muted-foreground">
                {taskStats.done} done
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-info">
                {taskStats.inProgress} in progress
              </span>
            </div>
          </div>

          {/* Team Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team</span>
              <span className="text-2xl font-bold text-foreground">{assignedMembers.length}</span>
            </div>
            <div className="mt-3 flex -space-x-2">
              {assignedMembers.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-medium text-accent-foreground"
                  title={member.name}
                >
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
              ))}
              {assignedMembers.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                  +{assignedMembers.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Timeline</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              {daysRemaining !== null ? (
                <div>
                  <span className={cn(
                    "text-2xl font-bold",
                    daysRemaining < 0 ? "text-destructive" : daysRemaining < 14 ? "text-warning" : "text-foreground"
                  )}>
                    {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days`}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(project.endDate!).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No end date set</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({taskStats.total})</TabsTrigger>
            <TabsTrigger value="team">Team ({assignedMembers.length})</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Project Tasks
              </h3>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager', 'member']}>
                <Button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </PermissionGate>
            </div>

            {tasks.length > 0 ? (
              <TaskList 
                tasks={tasks} 
                teamMembers={mockTeamMembers}
                onTaskUpdate={handleTaskUpdate}
                onTaskEdit={handleEditTask}
                onTaskDelete={(taskId) => setDeleteTaskId(taskId)}
              />
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Team Members ({assignedMembers.length})
              </h3>
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <Button onClick={() => setShowAddMemberModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </PermissionGate>
            </div>
            {assignedMembers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                      <button
                        onClick={() => setRemoveMemberId(member.id)}
                        className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Remove from project"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-card-foreground truncate">{member.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Allocation</span>
                      <span className="font-medium text-foreground">{member.allocation}%</span>
                    </div>
                    <Progress value={member.allocation} className="mt-2 h-1.5" />
                    <p className="mt-3 text-sm text-muted-foreground truncate">{member.email}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No team members assigned yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Project Details */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
                  Project Details
                </h3>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Program</dt>
                    <dd className="font-medium text-foreground">{program?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant="outline" className={cn('border', statusColors[project.status])}>
                        {project.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Start Date</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(project.startDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">End Date</dt>
                    <dd className="font-medium text-foreground">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Progress</dt>
                    <dd className="font-medium text-foreground">{calculatedProgress}%</dd>
                  </div>
                </dl>
              </div>

              {/* Task Summary */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
                  Task Summary
                </h3>
                <div className="space-y-3">
                  {Object.entries(taskStatusConfig).map(([status, config]) => {
                    const Icon = config.icon;
                    const count = tasks.filter((t) => t.status === status).length;
                    const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            <span className="text-sm text-foreground">{config.label}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
                Description
              </h3>
              <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        teamMembers={mockTeamMembers}
        projectId={project.id}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSave={handleSaveProject}
        project={project}
      />

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAdd={handleAddMembers}
        allMembers={mockTeamMembers}
        currentMemberIds={teamIds}
      />

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member from the project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={showDeleteProjectDialog} onOpenChange={setShowDeleteProjectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This will permanently remove the project 
              and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
