import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  List,
  LayoutGrid,
  CalendarDays,
  GanttChart,
  CalendarIcon,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskKanban } from '@/components/tasks/TaskKanban';
import { TaskGantt } from '@/components/tasks/TaskGantt';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/contexts/PermissionsContext';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { format, isWithinInterval, isSameDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
import { cn } from '@/lib/utils';
import { Task } from '@/types/portfolio';

// Simulated current user - in a real app, this would come from auth context
const CURRENT_USER_ID = 't1'; // Alex Rivera - Lead Developer

// Define who oversees whom (manager -> direct reports)
const oversightMap: Record<string, string[]> = {
  't4': ['t1', 't2', 't3', 't5'], // Taylor (Project Manager) oversees everyone
  't1': ['t2'], // Alex (Lead Developer) oversees Jordan
};

export default function Tasks() {
  const { toast } = useToast();
  const { currentOrgRole, currentProjectRole } = usePermissions();
  const { projects, tasks, teamMembers, milestones, addTask, updateTask, deleteTask } = usePortfolioData();

  // Projects + tasks come from shared context (single source of truth)
  const allProjects = projects;

  const tasksWithMeta = useMemo(() => {
    return tasks.map((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return {
        ...task,
        projectName: project?.name || 'Unknown Project',
        milestoneName: task.milestoneId
          ? milestones.find((m) => m.id === task.milestoneId)?.title
          : undefined,
      };
    });
  }, [tasks, projects, milestones]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskDefaults, setNewTaskDefaults] = useState<{ status?: Task['status']; assigneeId?: string } | undefined>(undefined);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  
  // View and filter states
  const [taskView, setTaskView] = useState<'list' | 'kanban' | 'gantt' | 'calendar'>('list');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'assignee'>('status');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [taskDateRange, setTaskDateRange] = useState<DateRange | undefined>(undefined);
  const [taskSort, setTaskSort] = useState<'dueDate' | 'priority' | 'title' | 'status'>('dueDate');
  const [taskSortDir, setTaskSortDir] = useState<'asc' | 'desc'>('asc');

  // Determine which tasks the current user can manage
  const canManageTask = (task: Task): boolean => {
    // User can always manage their own tasks
    if (task.assigneeId === CURRENT_USER_ID) return true;
    
    // Project managers and admins can manage all tasks
    if (currentProjectRole === 'project-manager') return true;
    if (['owner', 'admin', 'manager'].includes(currentOrgRole)) return true;
    
    // Check if user oversees the task assignee
    const directReports = oversightMap[CURRENT_USER_ID] || [];
    if (task.assigneeId && directReports.includes(task.assigneeId)) return true;
    
    return false;
  };

  // Filter tasks based on permissions
  const accessibleTasks = useMemo(() => {
    // Viewers can only see their own tasks
    if (currentOrgRole === 'viewer' && currentProjectRole === 'viewer') {
      return tasksWithMeta.filter((t) => t.assigneeId === CURRENT_USER_ID);
    }

    // Everyone else can see all tasks but with different management capabilities
    return tasksWithMeta;
  }, [tasksWithMeta, currentOrgRole, currentProjectRole]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = accessibleTasks;

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (assigneeFilter) {
      result = result.filter((t) => t.assigneeId === assigneeFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (projectFilter) {
      result = result.filter((t) => t.projectId === projectFilter);
    }
    if (taskDateRange?.from) {
      result = result.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        if (taskDateRange.to) {
          return isWithinInterval(taskDate, { start: taskDateRange.from!, end: taskDateRange.to });
        }
        return isSameDay(taskDate, taskDateRange.from!);
      });
    }

    return result;
  }, [accessibleTasks, statusFilter, assigneeFilter, priorityFilter, projectFilter, taskDateRange]);

  // Sort tasks
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusOrder = { todo: 0, 'in-progress': 1, review: 2, done: 3 };
  const dirMultiplier = taskSortDir === 'asc' ? 1 : -1;

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let result = 0;
      switch (taskSort) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) result = 0;
          else if (!a.dueDate) result = 1;
          else if (!b.dueDate) result = -1;
          else result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          result = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
        case 'status':
          result = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return result * dirMultiplier;
    });
  }, [filteredTasks, taskSort, taskSortDir]);

  // Task statistics
  const taskStats = useMemo(() => ({
    total: accessibleTasks.length,
    myTasks: accessibleTasks.filter((t) => t.assigneeId === CURRENT_USER_ID).length,
    todo: accessibleTasks.filter((t) => t.status === 'todo').length,
    inProgress: accessibleTasks.filter((t) => t.status === 'in-progress').length,
    review: accessibleTasks.filter((t) => t.status === 'review').length,
    done: accessibleTasks.filter((t) => t.status === 'done').length,
  }), [accessibleTasks]);

  const activeFiltersCount = [statusFilter, assigneeFilter, priorityFilter, projectFilter, taskDateRange?.from].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter(null);
    setAssigneeFilter(null);
    setPriorityFilter(null);
    setProjectFilter(null);
    setTaskDateRange(undefined);
  };

  // Task handlers using context mutations
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      toast({ title: 'Task updated', description: 'The task has been updated successfully.' });
    } else {
      const projectId = taskData.projectId || allProjects[0]?.id;
      if (!projectId) {
        toast({ title: 'No project', description: 'Please create a project first.', variant: 'destructive' });
        return;
      }
      addTask({
        ...taskData,
        assigneeId: taskData.assigneeId || CURRENT_USER_ID,
      }, projectId);
      toast({ title: 'Task created', description: 'The task has been created successfully.' });
    }

    setEditingTask(null);
    setShowTaskModal(false);
  };

  const handleEditTask = (task: Task) => {
    if (!canManageTask(task)) {
      toast({ title: 'Permission denied', description: 'You can only edit your own tasks or tasks of your direct reports.', variant: 'destructive' });
      return;
    }
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = () => {
    if (!deleteTaskId) return;

    const task = tasksWithMeta.find((t) => t.id === deleteTaskId);
    if (task && !canManageTask(task)) {
      toast({ title: 'Permission denied', description: 'You cannot delete this task.', variant: 'destructive' });
      setDeleteTaskId(null);
      return;
    }

    deleteTask(deleteTaskId);
    toast({ title: 'Task deleted', description: 'The task has been deleted.' });
    setDeleteTaskId(null);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    const task = tasksWithMeta.find((t) => t.id === taskId);
    if (task && !canManageTask(task)) {
      toast({ title: 'Permission denied', description: 'You can only update your own tasks or tasks of your direct reports.', variant: 'destructive' });
      return;
    }

    updateTask(taskId, updates);
  };

  const toggleSort = (field: typeof taskSort) => {
    if (taskSort === field) {
      setTaskSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTaskSort(field);
      setTaskSortDir('asc');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your tasks and those you oversee across all projects
            </p>
          </div>
          <Button onClick={() => { setEditingTask(null); setNewTaskDefaults(undefined); setShowTaskModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{taskStats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{taskStats.myTasks}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{taskStats.todo}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{taskStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{taskStats.review}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Done</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{taskStats.done}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and View Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2" data-tour="task-views">
            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
              <Button
                variant={taskView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('list')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={taskView === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('kanban')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={taskView === 'gantt' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('gantt')}
                className="h-8"
              >
                <GanttChart className="h-4 w-4" />
              </Button>
              <Button
                variant={taskView === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('calendar')}
                className="h-8"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>

            {taskView === 'kanban' && (
              <Select value={kanbanGroupBy} onValueChange={(v: 'status' | 'assignee') => setKanbanGroupBy(v)}>
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="assignee">Group by Assignee</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="h-6 w-px bg-border" />

            {/* Filters */}
            <Select value={projectFilter || 'all'} onValueChange={(v) => setProjectFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {allProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter || 'all'} onValueChange={(v) => setPriorityFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter || 'all'} onValueChange={(v) => setAssigneeFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {taskDateRange?.from ? (
                    taskDateRange.to ? (
                      `${format(taskDateRange.from, 'MMM d')} - ${format(taskDateRange.to, 'MMM d')}`
                    ) : (
                      format(taskDateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Date Range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={taskDateRange}
                  onSelect={setTaskDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8">
                <X className="mr-1 h-3 w-3" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sort by:</span>
            {(['dueDate', 'priority', 'title', 'status'] as const).map((field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => toggleSort(field)}
                className={cn('h-7 px-2', taskSort === field && 'bg-muted')}
              >
                {field === 'dueDate' ? 'Due Date' : field.charAt(0).toUpperCase() + field.slice(1)}
                {taskSort === field && (
                  taskSortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Task Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {taskView === 'list' && (
            <TaskList
              tasks={sortedTasks}
              teamMembers={teamMembers}
              onTaskUpdate={handleTaskUpdate}
              onTaskEdit={handleEditTask}
              onTaskDelete={(id) => setDeleteTaskId(id)}
            />
          )}
          {taskView === 'kanban' && (
            <TaskKanban
              tasks={sortedTasks}
              teamMembers={teamMembers}
              groupBy={kanbanGroupBy}
              onTaskUpdate={handleTaskUpdate}
              onTaskEdit={handleEditTask}
              onTaskDelete={(id) => setDeleteTaskId(id)}
              onAddTask={(defaults) => {
                setEditingTask(null);
                setNewTaskDefaults(defaults);
                setShowTaskModal(true);
              }}
            />
          )}
          {taskView === 'gantt' && (
            <TaskGantt
              tasks={sortedTasks}
              teamMembers={teamMembers}
              onTaskEdit={handleEditTask}
              onTaskUpdate={(taskId, updates) => {
                handleTaskUpdate(taskId, updates);
              }}
            />
          )}
          {taskView === 'calendar' && (
            <TaskCalendar
              tasks={sortedTasks}
              teamMembers={teamMembers}
              onTaskEdit={handleEditTask}
              onTaskUpdate={(taskId, updates) => {
                handleTaskUpdate(taskId, updates);
              }}
              activeFilters={{
                status: statusFilter,
                assignee: assigneeFilter,
                priority: priorityFilter,
                dateRange: !!taskDateRange?.from,
              }}
            />
          )}
        </motion.div>

        {/* Empty State */}
        {sortedTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="rounded-full bg-muted p-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">No tasks found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeFiltersCount > 0 
                ? 'Try adjusting your filters to see more tasks.'
                : 'Create your first task to get started.'}
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                Clear all filters
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setNewTaskDefaults(undefined); }}
        task={editingTask}
        teamMembers={teamMembers}
        onSave={handleSaveTask}
        projectId={editingTask?.projectId || allProjects[0]?.id || 'p1'}
        defaults={newTaskDefaults}
      />

      {/* Delete Confirmation */}
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
    </MainLayout>
  );
}
