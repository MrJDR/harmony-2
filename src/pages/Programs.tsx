import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSection } from '@/components/shared/PageSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { ProgramList } from '@/components/programs/ProgramList';
import { ProgramKanban } from '@/components/programs/ProgramKanban';
import { ProgramCalendar } from '@/components/programs/ProgramCalendar';
import { ProgramGantt } from '@/components/programs/ProgramGantt';
import { ProgramModal } from '@/components/programs/ProgramModal';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useArchivedPrograms, useRestoreProgram } from '@/hooks/usePrograms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Users,
  List,
  LayoutGrid,
  X,
  ArrowUp,
  ArrowDown,
  Filter,
  CalendarDays,
  GanttChart,
  Archive,
  ChevronDown,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Program } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { defaultProjectStatuses, getProgramStatusOptions } from '@/lib/workflow';

type ViewMode = 'grid' | 'list' | 'kanban' | 'calendar' | 'gantt';
type KanbanGroupBy = 'status' | 'portfolio';
type SortField = 'name' | 'status' | 'projects';

function ArchivedProgramsSection({ portfolios }: { portfolios: { id: string; name: string }[] }) {
  const navigate = useNavigate();
  const { data: archivedPrograms = [], isLoading } = useArchivedPrograms();
  const restoreMutation = useRestoreProgram();
  const [isOpen, setIsOpen] = useState(false);

  if (archivedPrograms.length === 0) return null;

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
              <span>Archived Programs ({archivedPrograms.length})</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-2">
            {archivedPrograms.map((program) => {
              const portfolio = portfolios.find(p => p.id === program.portfolio_id);
              return (
                <Card key={program.id} className="bg-muted/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{program.name}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {program.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {portfolio && <span>{portfolio.name}</span>}
                        {program.archived_at && (
                          <>
                            <span>•</span>
                            <span>Archived {format(new Date(program.archived_at), 'MMM d, yyyy')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(program.id)}
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

export default function Programs() {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { portfolios, programs, projects, tasks, teamMembers, addProgram, updateProgram, deleteProgram } = usePortfolioData();
  
  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<KanbanGroupBy>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  
  // Org members for owner assignment (profiles, not team_members)
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; email: string; first_name: string | null; last_name: string | null }>>([]);
  
  useEffect(() => {
    async function fetchOrgMembers() {
      if (!organization?.id) return;
      const { data } = await supabase
        .from('profiles_safe')
        .select('id, email, first_name, last_name')
        .eq('org_id', organization.id);
      if (data) setOrgMembers(data as Array<{ id: string; email: string; first_name: string | null; last_name: string | null }>);
    }
    fetchOrgMembers();
  }, [organization?.id]);

  // Calculate high-level stats for program managers using flat arrays
  const stats = useMemo(() => {
    const totalPrograms = programs.length;
    const activePrograms = programs.filter((p) => p.status === 'active').length;
    const planningPrograms = programs.filter((p) => p.status === 'planning').length;
    const totalProjects = projects.length;
    const activeProjects = projects.filter((proj) => proj.status === 'active').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    const avgProgress =
      totalProjects > 0
        ? Math.round(projects.reduce((acc, proj) => acc + proj.progress, 0) / totalProjects)
        : 0;
    
    // Get unique team member IDs from tasks
    const teamIds = new Set(tasks.map((t) => t.assigneeId).filter(Boolean));

    return {
      totalPrograms,
      activePrograms,
      planningPrograms,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      avgProgress,
      teamSize: teamIds.size,
    };
  }, [programs, projects, tasks]);

  // Calculate project count per program for sorting
  const programProjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    programs.forEach((program) => {
      counts.set(program.id, projects.filter((p) => p.programId === program.id).length);
    });
    return counts;
  }, [programs, projects]);

  // Filter and sort programs
  const filteredPrograms = useMemo(() => {
    let result = [...programs];

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
    if (portfolioFilter) {
      result = result.filter((p) => p.portfolioId === portfolioFilter);
    }

    // Sort
    const dirMultiplier = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          const statusOrder = { planning: 0, active: 1, 'on-hold': 2, completed: 3 };
          cmp = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        case 'projects':
          cmp = (programProjectCounts.get(a.id) || 0) - (programProjectCounts.get(b.id) || 0);
          break;
      }
      return cmp * dirMultiplier;
    });

    return result;
  }, [programs, searchQuery, statusFilter, portfolioFilter, sortField, sortDir, programProjectCounts]);

  // Collect all unique statuses from programs (including custom statuses)
  const allStatusOptions = useMemo(() => {
    const statusMap = new Map<string, { id: string; label: string }>();
    
    // Add default statuses
    defaultProjectStatuses.forEach((s) => statusMap.set(s.id, { id: s.id, label: s.label }));
    
    // Add custom statuses from each program
    programs.forEach((program) => {
      const customStatuses = getProgramStatusOptions(program.customStatuses);
      customStatuses.forEach((s) => {
        if (!statusMap.has(s.id)) {
          statusMap.set(s.id, { id: s.id, label: s.label });
        }
      });
      // Also add the actual status of the program if it's not in any list
      if (!statusMap.has(program.status)) {
        statusMap.set(program.status, { id: program.status, label: program.status });
      }
    });
    
    return Array.from(statusMap.values());
  }, [programs]);

  const activeFiltersCount = [statusFilter, portfolioFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setPortfolioFilter(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleSaveProgram = (data: Partial<Program>) => {
    if (data.id) {
      // Edit existing
      updateProgram(data.id, data);
    } else {
      // Create new - use selected portfolio or first available
      const portfolioId = data.portfolioId || portfolios[0]?.id;
      if (!portfolioId) {
        return; // Can't create without a portfolio
      }
      addProgram({
        name: data.name || 'New Program',
        description: data.description || '',
        status: data.status || 'planning',
        portfolioId,
        ownerId: data.ownerId || '',
      });
    }
    setEditingProgram(null);
  };

  const handleNewProgram = () => {
    setEditingProgram(null);
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (programToDelete) {
      deleteProgram(programToDelete.id);
    }
    setDeleteDialogOpen(false);
    setProgramToDelete(null);
  };

  const handleProgramClick = (programId: string) => {
    navigate(`/programs/${programId}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
          data-tour="programs-page"
        >
          <PageHeader
            title="Programs"
            description="High-level view of all programs and their progress"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full sm:w-[280px] pl-8 text-sm"
                aria-label="Search programs"
              />
            </div>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button onClick={handleNewProgram} className="w-full sm:w-auto" data-tour="new-program">
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Button>
            </PermissionGate>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6"
          data-tour="program-list"
        >
          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Programs
                <FolderKanban className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stats.activePrograms} active</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Projects
                <FolderKanban className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stats.activeProjects} active</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Tasks
                <CheckCircle2 className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Avg Progress
                <TrendingUp className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.avgProgress}%</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">across projects</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Team
                <Users className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.teamSize}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">members</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 sm:pb-2 sm:p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                Planning
                <FolderKanban className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.planningPrograms}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">programs</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Alert */}
        {stats.overdueTasks > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 sm:py-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} require attention
                  </span>
                </div>
                <Badge variant="outline" className="w-fit sm:ml-auto border-warning/30 text-warning text-xs">
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
            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Gantt view"
              >
                <GanttChart className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Calendar view"
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
                  <SelectItem value="portfolio">By Portfolio</SelectItem>
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
                  {allStatusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={portfolioFilter || 'all'} onValueChange={(v) => setPortfolioFilter(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 w-[130px] sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue placeholder="Portfolio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portfolios</SelectItem>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>{portfolio.name}</SelectItem>
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
            {(['name', 'status', 'projects'] as const).map((field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => toggleSort(field)}
                className={cn('h-7 px-2 text-xs', sortField === field && 'bg-muted')}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortField === field && (
                  sortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Program Views */}
        <PageSection title="Program list">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {viewMode === 'grid' && (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProgramCard 
                    program={program} 
                    teamMembers={teamMembers}
                    onClick={() => handleProgramClick(program.id)}
                    onEdit={(p) => {
                      setEditingProgram(p);
                      setModalOpen(true);
                    }}
                    onDelete={(p) => {
                      setProgramToDelete(p);
                      setDeleteDialogOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <ProgramList
              programs={filteredPrograms}
              projects={projects}
              tasks={tasks}
              portfolios={portfolios}
            />
          )}

          {viewMode === 'kanban' && (
            <ProgramKanban
              programs={filteredPrograms}
              projects={projects}
              tasks={tasks}
              groupBy={kanbanGroupBy}
              portfolios={portfolios}
              onProgramUpdate={(id, updates) => updateProgram(id, updates)}
            />
          )}

          {viewMode === 'calendar' && (
            <ProgramCalendar
              programs={filteredPrograms}
              projects={projects}
              tasks={tasks}
              onProgramClick={handleProgramClick}
            />
          )}

          {viewMode === 'gantt' && (
            <ProgramGantt
              programs={filteredPrograms}
              projects={projects}
              tasks={tasks}
              onProgramClick={handleProgramClick}
              onProgramUpdate={(id, updates) => updateProgram(id, updates)}
            />
          )}
        </motion.div>

        {/* Empty State */}
        {filteredPrograms.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon={Filter}
              title="No programs found"
              description={
                activeFiltersCount > 0
                  ? 'Try adjusting your filters to see more programs.'
                  : 'Create your first program to get started.'
              }
              action={
                activeFiltersCount > 0 ? (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                ) : (
                  <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                    <Button variant="outline" onClick={handleNewProgram}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first program
                    </Button>
                  </PermissionGate>
                )
              }
            />
            </motion.div>
          )}
        </PageSection>

        {/* Archived Programs Section */}
        <ArchivedProgramsSection portfolios={portfolios} />
      </div>

      <ProgramModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        program={editingProgram}
        teamMembers={teamMembers}
        orgMembers={orgMembers}
        portfolios={portfolios}
        defaultPortfolioId={portfolios[0]?.id}
        onSave={handleSaveProgram}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{programToDelete?.name}"? This will also delete all
              projects, tasks, and milestones within this program. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
