import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  List,
  LayoutGrid,
  GanttChart,
  CalendarDays,
  AlertTriangle,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  Archive,
  ChevronDown,
  RotateCcw,
  Search,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectKanban } from '@/components/projects/ProjectKanban';
import { ProjectGantt } from '@/components/projects/ProjectGantt';
import { ProjectCalendar } from '@/components/projects/ProjectCalendar';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { useArchivedProjects, useRestoreProject } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Project, Task } from '@/types/portfolio';
import { format } from 'date-fns';

type ViewMode = 'grid' | 'list' | 'kanban' | 'gantt' | 'calendar';
type KanbanGroupBy = 'status' | 'program';
type SortField = 'name' | 'progress' | 'status' | 'endDate';

function ArchivedProjectsSection({ programs }: { programs: { id: string; name: string }[] }) {
  const { data: archivedProjects = [], isLoading } = useArchivedProjects();
  const restoreMutation = useRestoreProject();
  const [isOpen, setIsOpen] = useState(false);

  if (archivedProjects.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span>Archived Projects ({archivedProjects.length})</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-2">
            {archivedProjects.map((project) => {
              const program = programs.find(p => p.id === project.program_id);
              return (
                <Card key={project.id} className="bg-muted/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{project.name}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {project.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {project.progress}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {program && <span>{program.name}</span>}
                        {project.archived_at && (
                          <>
                            <span>•</span>
                            <span>Archived {format(new Date(project.archived_at), 'MMM d, yyyy')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(project.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </PermissionGate>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export default function Projects() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<KanbanGroupBy>('status');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { tasks, milestones, projects, programs, teamMembers, addProject, updateProject, updateTask } = usePortfolioData();
  const { currentOrgRole } = usePermissions();

  // Calculate stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'active').length;
    const planning = projects.filter((p) => p.status === 'planning').length;
    const onHold = projects.filter((p) => p.status === 'on-hold').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const avgProgress = total > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / total)
      : 0;

    return { total, active, planning, onHold, completed, avgProgress };
  }, [projects]);

  // Calculate overdue items
  const overdueItems = useMemo(() => {
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    const overdueMilestones = milestones.filter(m => {
      if (new Date(m.dueDate) >= new Date()) return false;
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      return milestoneTasks.length === 0 || !milestoneTasks.every(t => t.status === 'done');
    }).length;
    
    return { tasks: overdueTasks, milestones: overdueMilestones };
  }, [tasks, milestones]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (programFilter) {
      result = result.filter((p) => p.programId === programFilter);
    }

    // Sort
    const dirMultiplier = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'progress':
          cmp = a.progress - b.progress;
          break;
        case 'status':
          const statusOrder = { planning: 0, active: 1, 'on-hold': 2, completed: 3 };
          cmp = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        case 'endDate':
          if (!a.endDate && !b.endDate) cmp = 0;
          else if (!a.endDate) cmp = 1;
          else if (!b.endDate) cmp = -1;
          else cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
      }
      return cmp * dirMultiplier;
    });

    return result;
  }, [projects, searchQuery, statusFilter, programFilter, sortField, sortDir]);

  const activeFiltersCount = [statusFilter, programFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setProgramFilter(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleSaveProject = (data: Partial<Project>) => {
    if (data.id) {
      updateProject(data.id, data);
    } else {
      const programId = data.programId || programs[0]?.id;
      if (!programId) return;
      addProject({
        name: data.name || 'New Project',
        description: data.description || '',
        status: data.status || 'planning',
        progress: 0,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        programId,
        teamIds: [],
      }, programId);
    }
    setEditingProject(null);
    setModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              {stats.total} projects across all programs
            </p>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager', 'member']}>
            <Button data-tour="new-project" onClick={handleNewProject} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">New </span>Project
            </Button>
          </PermissionGate>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-info">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Planning</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">{stats.planning}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">On Hold</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-warning">{stats.onHold}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-success">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.avgProgress}%</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Alert */}
        {(overdueItems.tasks > 0 || overdueItems.milestones > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:py-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium">
                    {overdueItems.tasks + overdueItems.milestones} overdue items
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {overdueItems.tasks > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {overdueItems.tasks} task{overdueItems.tasks > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {overdueItems.milestones > 0 && (
                      <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                        {overdueItems.milestones} milestone{overdueItems.milestones > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="border-warning/30 text-warning shrink-0 text-xs">
                  Action Required
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters and View Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full sm:w-[180px] pl-8 text-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                title="Kanban View"
              >
                <LayoutGrid className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex"
                title="Gantt View"
              >
                <GanttChart className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex"
                title="Calendar View"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>

            {viewMode === 'kanban' && (
              <Select value={kanbanGroupBy} onValueChange={(v: KanbanGroupBy) => setKanbanGroupBy(v)}>
                <SelectTrigger className="h-8 w-[120px] sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="program">By Program</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 w-[100px] sm:w-[130px] text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={programFilter || 'all'} onValueChange={(v) => setProgramFilter(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 w-[130px] sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs sm:text-sm">
                  <X className="mr-1 h-3 w-3" />
                  Clear ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>Sort:</span>
            {(['name', 'progress', 'status', 'endDate'] as const).map((field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => toggleSort(field)}
                className={cn('h-7 px-2 text-xs', sortField === field && 'bg-muted')}
              >
                {field === 'endDate' ? 'Due Date' : field.charAt(0).toUpperCase() + field.slice(1)}
                {sortField === field && (
                  sortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Project Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-tour="project-list"
        >
          {viewMode === 'grid' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <ProjectList
              projects={filteredProjects}
              teamMembers={teamMembers}
              programs={programs}
            />
          )}

          {viewMode === 'kanban' && (
            <ProjectKanban
              projects={filteredProjects}
              teamMembers={teamMembers}
              groupBy={kanbanGroupBy}
              programs={programs}
              onProjectUpdate={(id, updates) => updateProject(id, updates)}
            />
          )}

          {viewMode === 'gantt' && (
            <ProjectGantt
              projects={filteredProjects}
              programs={programs}
              tasks={tasks}
              onProjectEdit={(project) => {
                setEditingProject(project);
                setModalOpen(true);
              }}
              onProjectUpdate={(id, updates) => updateProject(id, updates)}
              onTaskEdit={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
            />
          )}

          {viewMode === 'calendar' && (
            <ProjectCalendar
              projects={filteredProjects}
              teamMembers={teamMembers}
              programs={programs}
            />
          )}
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="rounded-full bg-muted p-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeFiltersCount > 0
                ? 'Try adjusting your filters to see more projects.'
                : 'Create your first project to get started.'}
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                Clear all filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Archived Projects Section */}
        <ArchivedProjectsSection programs={programs} />
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        programs={programs}
        defaultProgramId={programs[0]?.id}
        currentUserOrgRole={currentOrgRole}
      />

      {editingTask && (
        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={(data) => {
            if (editingTask) {
              updateTask(editingTask.id, data);
            }
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          projectId={editingTask.projectId}
          teamMembers={teamMembers}
        />
      )}
    </MainLayout>
  );
}
