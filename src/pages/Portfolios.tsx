import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Briefcase, FolderKanban, Users, TrendingUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { MainLayout } from '@/components/layout/MainLayout';
import { PortfolioModal } from '@/components/portfolio/PortfolioModal';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { toast } from 'sonner';

export default function Portfolios() {
  const navigate = useNavigate();
  const { 
    portfolios, 
    programs, 
    projects, 
    tasks, 
    teamMembers,
    isLoading, 
    addPortfolio, 
    updatePortfolio, 
    deletePortfolio,
    addProgram,
    updateProgram,
  } = usePortfolioData();
  
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<{ id: string; name: string } | null>(null);

  // Calculate stats for each portfolio
  const getPortfolioStats = (portfolioId: string) => {
    const portfolioPrograms = programs.filter(p => p.portfolioId === portfolioId);
    const programIds = portfolioPrograms.map(p => p.id);
    const portfolioProjects = projects.filter(p => programIds.includes(p.programId));
    const projectIds = portfolioProjects.map(p => p.id);
    const portfolioTasks = tasks.filter(t => projectIds.includes(t.projectId));
    
    const completedTasks = portfolioTasks.filter(t => t.status === 'done').length;
    const totalTasks = portfolioTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const activePrograms = portfolioPrograms.filter(p => p.status === 'active').length;
    const activeProjects = portfolioProjects.filter(p => p.status === 'active').length;
    
    // Get unique team members from projects
    const teamMemberIds = new Set<string>();
    portfolioProjects.forEach(project => {
      project.teamIds?.forEach(id => teamMemberIds.add(id));
    });
    
    return {
      programCount: portfolioPrograms.length,
      activePrograms,
      projectCount: portfolioProjects.length,
      activeProjects,
      taskCount: totalTasks,
      completedTasks,
      progress,
      teamMemberCount: teamMemberIds.size,
    };
  };

  const handleDeletePortfolio = async () => {
    if (!portfolioToDelete) return;
    try {
      deletePortfolio(portfolioToDelete.id);
      toast.success('Portfolio deleted successfully');
      setDeleteDialogOpen(false);
      setPortfolioToDelete(null);
    } catch (error) {
      toast.error('Failed to delete portfolio');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-72 mt-2" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Portfolios
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage and organize your portfolios, programs, and projects
            </p>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <Button onClick={() => {
              setEditingPortfolio(null);
              setPortfolioModalOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
          </PermissionGate>
        </motion.div>

        {/* Portfolios Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio, index) => {
            const stats = getPortfolioStats(portfolio.id);
            return (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 group"
                  onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                            {portfolio.name}
                          </CardTitle>
                        </div>
                      </div>
                      <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingPortfolio({
                                id: portfolio.id,
                                name: portfolio.name,
                                description: portfolio.description || '',
                              });
                              setPortfolioModalOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPortfolioToDelete({ id: portfolio.id, name: portfolio.name });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </PermissionGate>
                    </div>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {portfolio.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{stats.progress}%</span>
                      </div>
                      <Progress value={stats.progress} className="h-2" />
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Programs:</span>
                        <span className="font-medium">{stats.programCount}</span>
                        {stats.activePrograms > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {stats.activePrograms} active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Projects:</span>
                        <span className="font-medium">{stats.projectCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tasks:</span>
                        <span className="font-medium">{stats.completedTasks}/{stats.taskCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{stats.teamMemberCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Empty State */}
          {portfolios.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No portfolios yet</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    Create your first portfolio to start organizing your programs and projects.
                  </p>
                  <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                    <Button onClick={() => {
                      setEditingPortfolio(null);
                      setPortfolioModalOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Portfolio
                    </Button>
                  </PermissionGate>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Modal */}
      <PortfolioModal
        open={portfolioModalOpen}
        onOpenChange={(open) => {
          setPortfolioModalOpen(open);
          if (!open) setEditingPortfolio(null);
        }}
        portfolio={editingPortfolio}
        teamMembers={teamMembers}
        programs={programs.map(p => ({ id: p.id, name: p.name, status: p.status, portfolioId: p.portfolioId }))}
        onSave={async (data) => {
          try {
            let targetPortfolioId: string | undefined = data.id;
            
            if (data.id) {
              await updatePortfolio(data.id, { name: data.name, description: data.description });
              toast.success('Portfolio updated successfully');
            } else {
              const result = await addPortfolio({ name: data.name, description: data.description });
              targetPortfolioId = result?.id;
              toast.success('Portfolio created successfully');
            }
            
            // Add existing programs to this portfolio
            if (data.addExistingProgramIds && data.addExistingProgramIds.length > 0 && targetPortfolioId) {
              for (const programId of data.addExistingProgramIds) {
                await updateProgram(programId, { portfolioId: targetPortfolioId });
              }
              toast.success(`${data.addExistingProgramIds.length} program(s) added to portfolio`);
            }
            
            // Create new program if requested
            if (data.createProgram && targetPortfolioId) {
              await addProgram({
                name: data.createProgram.name,
                description: data.createProgram.description,
                status: data.createProgram.status as 'planning' | 'active' | 'on-hold' | 'completed',
                portfolioId: targetPortfolioId,
                ownerId: data.createProgram.ownerId === 'unassigned' ? '' : (data.createProgram.ownerId || ''),
              });
              toast.success('New program created');
            }
            
            setPortfolioModalOpen(false);
            setEditingPortfolio(null);
          } catch (error) {
            toast.error('Failed to save portfolio');
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{portfolioToDelete?.name}"? This action cannot be undone.
              Programs within this portfolio will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePortfolio}
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
