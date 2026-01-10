import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { ProgramModal } from '@/components/programs/ProgramModal';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Users,
  Trash2,
  Edit,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Program } from '@/types/portfolio';

export default function Programs() {
  const navigate = useNavigate();
  const { programs, teamMembers, addProgram, updateProgram, deleteProgram } = usePortfolioData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  // Calculate high-level stats for program managers
  const stats = useMemo(() => {
    const totalPrograms = programs.length;
    const activePrograms = programs.filter((p) => p.status === 'active').length;
    const totalProjects = programs.reduce((acc, p) => acc + p.projects.length, 0);
    const activeProjects = programs.reduce(
      (acc, p) => acc + p.projects.filter((proj) => proj.status === 'active').length,
      0
    );
    const totalTasks = programs.reduce(
      (acc, p) => acc + p.projects.reduce((pacc, proj) => pacc + proj.tasks.length, 0),
      0
    );
    const completedTasks = programs.reduce(
      (acc, p) =>
        acc +
        p.projects.reduce(
          (pacc, proj) => pacc + proj.tasks.filter((t) => t.status === 'done').length,
          0
        ),
      0
    );
    const overdueTasks = programs.reduce(
      (acc, p) =>
        acc +
        p.projects.reduce(
          (pacc, proj) =>
            pacc +
            proj.tasks.filter(
              (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
            ).length,
          0
        ),
      0
    );
    const avgProgress =
      totalProjects > 0
        ? Math.round(
            programs.reduce(
              (acc, p) => acc + p.projects.reduce((pacc, proj) => pacc + proj.progress, 0),
              0
            ) / totalProjects
          )
        : 0;
    const teamIds = new Set(
      programs.flatMap((p) => p.projects.flatMap((proj) => proj.teamIds))
    );

    return {
      totalPrograms,
      activePrograms,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      avgProgress,
      teamSize: teamIds.size,
    };
  }, [programs]);

  // Filter programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSearch =
        program.name.toLowerCase().includes(search.toLowerCase()) ||
        program.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [programs, search, statusFilter]);

  const handleSaveProgram = (data: Partial<Program>) => {
    if (data.id) {
      // Edit existing
      updateProgram(data.id, data);
    } else {
      // Create new
      addProgram({
        name: data.name || 'New Program',
        description: data.description || '',
        status: data.status || 'planning',
        portfolioId: 'portfolio-1',
        ownerId: data.ownerId || '',
      });
    }
    setEditingProgram(null);
  };

  const handleEditProgram = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProgram(program);
    setModalOpen(true);
  };

  const handleNewProgram = () => {
    setEditingProgram(null);
    setModalOpen(true);
  };

  const handleDeleteClick = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
            <p className="text-muted-foreground">
              High-level view of all programs and their progress
            </p>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <Button onClick={handleNewProgram}>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Programs</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPrograms}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePrograms} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
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
                <p className="text-xs text-muted-foreground">completed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgProgress}%</div>
                <p className="text-xs text-muted-foreground">across projects</p>
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
                <CardTitle className="text-sm font-medium">Team</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamSize}</div>
                <p className="text-xs text-muted-foreground">members</p>
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
                  {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} require
                  attention across all programs
                </span>
                <Badge variant="outline" className="ml-auto border-warning/30 text-warning">
                  Action Required
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Programs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative group"
            >
              <ProgramCard 
                program={program} 
                teamMembers={teamMembers}
                onClick={() => handleProgramClick(program.id)}
              />
              <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEditProgram(program, e)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Program
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(program, e)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Program
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </PermissionGate>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredPrograms.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'No programs match your filters'
                : 'No programs yet'}
            </p>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button variant="outline" className="mt-4" onClick={handleNewProgram}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first program
              </Button>
            </PermissionGate>
          </div>
        )}
      </div>

      <ProgramModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        program={editingProgram}
        teamMembers={teamMembers}
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
