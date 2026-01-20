import { useEffect, useMemo, useState } from 'react';
import { 
  Settings,
  Users,
  Save,
  Bell,
  FolderArchive,
  AlertTriangle,
  CircleDot,
  Plus,
  Trash2,
  GripVertical,
  Wallet,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { usePermissions } from '@/contexts/PermissionsContext';
import { 
  programPermissions, 
  defaultProgramRolePermissions,
  type ProgramRole 
} from '@/types/permissions';
import { Program, TeamMember, ProjectStatus, Project } from '@/types/portfolio';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  getProgramStatusOptions, 
  defaultProjectStatuses, 
  workflowDotClass 
} from '@/lib/workflow';

// Org member type for owner selection
export interface OrgMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ProgramSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program;
  teamMembers: TeamMember[];
  orgMembers?: OrgMember[];
  onUpdateProgram: (updates: Partial<Program>) => void;
  onArchiveProgram: () => void;
  onDeleteProgram: () => void;
  onUpdateProjectBudget?: (projectId: string, allocatedBudget: number) => void;
}

const colorOptions: Array<{ value: ProjectStatus['color']; label: string; className: string }> = [
  { value: 'muted', label: 'Gray', className: 'bg-muted-foreground' },
  { value: 'info', label: 'Blue', className: 'bg-info' },
  { value: 'success', label: 'Green', className: 'bg-success' },
  { value: 'warning', label: 'Yellow', className: 'bg-warning' },
  { value: 'destructive', label: 'Red', className: 'bg-destructive' },
];

const canonicalProgramStatusOptions = ['planning', 'active', 'on-hold', 'completed'] as const;

export function ProgramSettingsSheet({ 
  open,
  onOpenChange,
  program, 
  teamMembers,
  orgMembers = [],
  onUpdateProgram,
  onArchiveProgram,
  onDeleteProgram,
  onUpdateProjectBudget,
}: ProgramSettingsSheetProps) {
  const { toast } = useToast();
  const { hasOrgPermission } = usePermissions();
  const canViewEmails = hasOrgPermission('view_contact_emails');

  // General settings state
  const [programName, setProgramName] = useState(program.name);
  const [programDescription, setProgramDescription] = useState(program.description);
  const [programStatus, setProgramStatus] = useState(program.status);
  const [ownerId, setOwnerId] = useState(program.ownerId || '');

  // Workflow state - Program Statuses (for this program)
  const [programStatuses, setProgramStatuses] = useState<ProjectStatus[]>(
    program.customStatuses || defaultProjectStatuses
  );
  // Project Statuses (default for projects in this program)
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>(
    program.customProjectStatuses || defaultProjectStatuses
  );
  const [newProgramStatusLabel, setNewProgramStatusLabel] = useState('');
  const [newProjectStatusLabel, setNewProjectStatusLabel] = useState('');

  // Budget state
  const [budgetStr, setBudgetStr] = useState((program.budget || 0).toString());
  const [projectAllocations, setProjectAllocations] = useState<Record<string, string>>({});

  // Role permissions state (local for now, not persisted)
  const [selectedProgramRole, setSelectedProgramRole] = useState<ProgramRole>('contributor');
  const [programRolePermissions, setProgramRolePermissions] = useState<Record<ProgramRole, string[]>>(
    () => JSON.parse(JSON.stringify(defaultProgramRolePermissions))
  );
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});

  // Notifications state
  const [notifications, setNotifications] = useState({
    projectCreated: true,
    projectCompleted: true,
    milestoneReached: true,
    riskIdentified: true,
    statusChanged: true,
  });

  // Dialogs
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Keep all sheet state in sync when opening or when the program changes
  useEffect(() => {
    if (!open) return;

    setProgramName(program.name);
    setProgramDescription(program.description);
    setProgramStatus(program.status);
    setOwnerId(program.ownerId || '');
    setProgramStatuses(program.customStatuses || defaultProjectStatuses);
    setProjectStatuses(program.customProjectStatuses || defaultProjectStatuses);
    setNewProgramStatusLabel('');
    setNewProjectStatusLabel('');
    setBudgetStr((program.budget || 0).toString());
    
    // Initialize project allocations
    const allocs: Record<string, string> = {};
    program.projects.forEach(p => {
      allocs[p.id] = (p.allocatedBudget || 0).toString();
    });
    setProjectAllocations(allocs);
  }, [open, program.id, program.name, program.description, program.status, program.ownerId, program.customStatuses, program.customProjectStatuses, program.budget, program.projects]);

  // Permission toggle
  const toggleProgramPermission = (permission: string) => {
    setProgramRolePermissions((prev) => ({
      ...prev,
      [selectedProgramRole]: prev[selectedProgramRole].includes(permission)
        ? prev[selectedProgramRole].filter((p) => p !== permission)
        : [...prev[selectedProgramRole], permission],
    }));
  };

  // Program Status handlers
  const handleAddProgramStatus = () => {
    if (!newProgramStatusLabel.trim()) return;
    const newStatus: ProjectStatus = {
      id: newProgramStatusLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newProgramStatusLabel,
      color: 'muted',
    };
    setProgramStatuses((prev) => [...prev, newStatus]);
    setNewProgramStatusLabel('');
  };

  const handleRemoveProgramStatus = (id: string) => {
    if (canonicalProgramStatusOptions.includes(id as any)) {
      toast({ title: 'Cannot remove', description: 'Default program statuses cannot be removed.', variant: 'destructive' });
      return;
    }
    setProgramStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateProgramStatusColor = (id: string, color: ProjectStatus['color']) => {
    setProgramStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  };

  // Project Status handlers (defaults for projects in this program)
  const handleAddProjectStatus = () => {
    if (!newProjectStatusLabel.trim()) return;
    const newStatus: ProjectStatus = {
      id: newProjectStatusLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newProjectStatusLabel,
      color: 'muted',
    };
    setProjectStatuses((prev) => [...prev, newStatus]);
    setNewProjectStatusLabel('');
  };

  const handleRemoveProjectStatus = (id: string) => {
    if (['planning', 'active', 'on-hold', 'completed'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default project statuses cannot be removed.', variant: 'destructive' });
      return;
    }
    setProjectStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateProjectStatusColor = (id: string, color: ProjectStatus['color']) => {
    setProjectStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  };

  // Budget calculations
  const programBudget = parseFloat(budgetStr) || 0;
  const totalAllocated = useMemo(() => {
    return Object.values(projectAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [projectAllocations]);
  const remainingBudget = programBudget - totalAllocated;
  const allocationPercent = programBudget > 0 ? Math.round((totalAllocated / programBudget) * 100) : 0;

  // Calculate actual costs from tasks
  const totalActualCost = useMemo(() => {
    return program.projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  }, [program.projects]);
  const costPercent = programBudget > 0 ? Math.round((totalActualCost / programBudget) * 100) : 0;

  // Save handler
  const handleSaveSettings = () => {
    onUpdateProgram({
      name: programName,
      description: programDescription,
      status: programStatus,
      ownerId: ownerId || undefined,
      customStatuses: programStatuses,
      customProjectStatuses: projectStatuses,
      budget: programBudget,
      allocatedBudget: totalAllocated,
    });

    toast({ title: 'Settings saved', description: 'Program settings have been updated.' });
    onOpenChange(false);
  };

  // Save budget allocations to projects
  const handleSaveBudget = () => {
    // Update program budget
    onUpdateProgram({
      budget: programBudget,
      allocatedBudget: totalAllocated,
    });

    // Update each project's allocated budget
    if (onUpdateProjectBudget) {
      Object.entries(projectAllocations).forEach(([projectId, val]) => {
        onUpdateProjectBudget(projectId, parseFloat(val) || 0);
      });
    }

    toast({ title: 'Budget saved', description: 'Program and project budgets have been updated.' });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Program Settings</SheetTitle>
            <SheetDescription>
              Manage program configuration, workflow, team access, and notifications
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="gap-1 text-xs px-2">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="gap-1 text-xs px-2">
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-1 text-xs px-2">
                <CircleDot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-1 text-xs px-2">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Access</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1 text-xs px-2">
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Program Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="program-name">Program Name</Label>
                  <Input 
                    id="program-name"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-status">Status</Label>
                  <Select value={programStatus} onValueChange={(v) => setProgramStatus(v as Program['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {canonicalProgramStatusOptions.map((id) => {
                        const meta = programStatuses.find((s) => s.id === id);
                        return (
                          <SelectItem key={id} value={id}>
                            {meta?.label ?? id}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-owner">Program Owner</Label>
                  <Select value={ownerId || 'unassigned'} onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="unassigned">No owner assigned</SelectItem>
                      {orgMembers.map((member) => {
                        const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
                        return (
                          <SelectItem key={member.id} value={member.id}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-description">Description</Label>
                  <Textarea 
                    id="program-description"
                    value={programDescription}
                    onChange={(e) => setProgramDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <PermissionGate allowedOrgRoles={['owner', 'admin']}>
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Danger Zone
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5">
                      <div>
                        <p className="font-medium text-foreground text-sm">Archive Program</p>
                        <p className="text-xs text-muted-foreground">Hide this program and its projects from view</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-warning text-warning hover:bg-warning/10"
                        onClick={() => setShowArchiveDialog(true)}
                      >
                        <FolderArchive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                      <div>
                        <p className="font-medium text-foreground text-sm">Delete Program</p>
                        <p className="text-xs text-muted-foreground">Permanently delete this program and all its data</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </PermissionGate>

              <Button className="w-full" onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="space-y-6 mt-6">
              {/* Program Budget */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Program Budget
                </h3>
                <p className="text-sm text-muted-foreground">Set the total budget for this program and allocate it to projects</p>
                
                <div className="space-y-2">
                  <Label htmlFor="program-budget">Total Budget ($)</Label>
                  <Input 
                    id="program-budget"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={budgetStr}
                    onChange={(e) => setBudgetStr(e.target.value)}
                    onBlur={() => {
                      const num = parseFloat(budgetStr);
                      setBudgetStr(isNaN(num) ? '0' : num.toString());
                    }}
                  />
                </div>

                {/* Budget Summary */}
                <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-medium">${programBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allocated to Projects</span>
                    <span className="font-medium">${totalAllocated.toLocaleString()}</span>
                  </div>
                  <Progress value={allocationPercent} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={remainingBudget < 0 ? 'text-destructive font-medium' : 'font-medium'}>
                      ${remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actual Cost Summary */}
                <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <h4 className="font-medium text-sm">Cost Tracking</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual Cost (from tasks)</span>
                    <span className="font-medium">${totalActualCost.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min(costPercent, 100)} 
                    className={`h-2 ${costPercent > 100 ? '[&>div]:bg-destructive' : costPercent > 90 ? '[&>div]:bg-warning' : ''}`} 
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className={costPercent > 100 ? 'text-destructive font-medium' : costPercent > 90 ? 'text-warning font-medium' : 'font-medium'}>
                      {costPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Project Allocations */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Allocate to Projects</h3>
                <p className="text-sm text-muted-foreground">Distribute the program budget across projects</p>

                {program.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No projects in this program yet.</p>
                ) : (
                  <div className="space-y-3">
                    {program.projects.map((project) => {
                      const allocated = parseFloat(projectAllocations[project.id] || '0') || 0;
                      const projectActualCost = project.actualCost || 0;
                      const projectCostPercent = allocated > 0 ? Math.round((projectActualCost / allocated) * 100) : 0;
                      
                      return (
                        <div key={project.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground text-sm">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Spent: ${projectActualCost.toLocaleString()} 
                                {allocated > 0 && ` (${projectCostPercent}%)`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">$</span>
                              <Input 
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={projectAllocations[project.id] || ''}
                                onChange={(e) => setProjectAllocations(prev => ({
                                  ...prev,
                                  [project.id]: e.target.value,
                                }))}
                                onBlur={() => {
                                  const num = parseFloat(projectAllocations[project.id] || '0');
                                  setProjectAllocations(prev => ({
                                    ...prev,
                                    [project.id]: isNaN(num) ? '0' : num.toString(),
                                  }));
                                }}
                                className="w-28 h-8"
                              />
                            </div>
                          </div>
                          {allocated > 0 && (
                            <Progress 
                              value={Math.min(projectCostPercent, 100)} 
                              className={`h-1.5 ${projectCostPercent > 100 ? '[&>div]:bg-destructive' : projectCostPercent > 90 ? '[&>div]:bg-warning' : ''}`} 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {remainingBudget < 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Over-allocated by ${Math.abs(remainingBudget).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSaveBudget}>
                <Save className="h-4 w-4 mr-2" />
                Save Budget
              </Button>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-6 mt-6">
              {/* Program Statuses */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Program Statuses</h3>
                <p className="text-sm text-muted-foreground">Customize status labels and colors for this program</p>
                <div className="space-y-3">
                  {programStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn('w-3 h-3 rounded-full', workflowDotClass(status.color))} />
                      <Input
                        value={status.label}
                        onChange={(e) => {
                          setProgramStatuses((prev) =>
                            prev.map((s) => (s.id === status.id ? { ...s, label: e.target.value } : s))
                          );
                        }}
                        className="flex-1 h-8"
                      />
                      <Select
                        value={status.color}
                        onValueChange={(v) => handleUpdateProgramStatusColor(status.id, v as ProjectStatus['color'])}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {colorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', opt.className)} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveProgramStatus(status.id)}
                        disabled={canonicalProgramStatusOptions.includes(status.id as any)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="New program status name..."
                    value={newProgramStatusLabel}
                    onChange={(e) => setNewProgramStatusLabel(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProgramStatus()}
                  />
                  <Button onClick={handleAddProgramStatus} disabled={!newProgramStatusLabel.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Default Project Statuses (for projects in this program) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Default Project Statuses</h3>
                <p className="text-sm text-muted-foreground">Set default status options for projects created in this program</p>
                <div className="space-y-3">
                  {projectStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn('w-3 h-3 rounded-full', workflowDotClass(status.color))} />
                      <Input
                        value={status.label}
                        onChange={(e) => {
                          setProjectStatuses((prev) =>
                            prev.map((s) => (s.id === status.id ? { ...s, label: e.target.value } : s))
                          );
                        }}
                        className="flex-1 h-8"
                      />
                      <Select
                        value={status.color}
                        onValueChange={(v) => handleUpdateProjectStatusColor(status.id, v as ProjectStatus['color'])}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {colorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', opt.className)} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveProjectStatus(status.id)}
                        disabled={['planning', 'active', 'on-hold', 'completed'].includes(status.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="New project status name..."
                    value={newProjectStatusLabel}
                    onChange={(e) => setNewProjectStatusLabel(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProjectStatus()}
                  />
                  <Button onClick={handleAddProjectStatus} disabled={!newProjectStatusLabel.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Access Tab */}
            <TabsContent value="access" className="space-y-6 mt-6">
              {/* Role Permissions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Role Permissions</h3>
                <p className="text-sm text-muted-foreground">Configure what each role can do</p>

                <div>
                  <Label>Select Role to Configure</Label>
                  <Select value={selectedProgramRole} onValueChange={(v) => setSelectedProgramRole(v as ProgramRole)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="program-manager">Program Manager</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {programPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Checkbox
                        id={`prog-${permission.id}`}
                        checked={programRolePermissions[selectedProgramRole]?.includes(permission.key)}
                        onCheckedChange={() => toggleProgramPermission(permission.key)}
                        disabled={selectedProgramRole === 'program-manager'}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`prog-${permission.id}`} className="font-medium text-foreground cursor-pointer text-sm">
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Member Roles */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Team Member Roles</h3>
                <p className="text-sm text-muted-foreground">Assign roles to team members</p>

                <div className="space-y-2">
                  {teamMembers.slice(0, 10).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{member.name}</p>
                          {canViewEmails && member.email && (
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                      </div>
                      <Select 
                        value={memberRoles[member.id] || 'contributor'} 
                        onValueChange={(v) => setMemberRoles(prev => ({ ...prev, [member.id]: v }))}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="program-manager">Program Manager</SelectItem>
                          <SelectItem value="contributor">Contributor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No team members assigned yet.</p>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Program Notifications</h3>
                <p className="text-sm text-muted-foreground">Configure email notifications for program events</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Project Created</p>
                      <p className="text-xs text-muted-foreground">Notify when a new project is added</p>
                    </div>
                    <Switch
                      checked={notifications.projectCreated}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, projectCreated: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Project Completed</p>
                      <p className="text-xs text-muted-foreground">Notify when a project is completed</p>
                    </div>
                    <Switch
                      checked={notifications.projectCompleted}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, projectCompleted: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Milestone Reached</p>
                      <p className="text-xs text-muted-foreground">Notify when a milestone is achieved</p>
                    </div>
                    <Switch
                      checked={notifications.milestoneReached}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, milestoneReached: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Risk Identified</p>
                      <p className="text-xs text-muted-foreground">Notify when a new risk is flagged</p>
                    </div>
                    <Switch
                      checked={notifications.riskIdentified}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, riskIdentified: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Status Changed</p>
                      <p className="text-xs text-muted-foreground">Notify when program status changes</p>
                    </div>
                    <Switch
                      checked={notifications.statusChanged}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, statusChanged: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{program.name}"? This will hide the program and all its projects from view. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => {
                onArchiveProgram();
                setShowArchiveDialog(false);
                onOpenChange(false);
              }}
            >
              Archive Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{program.name}"? This action cannot be undone. All projects, tasks, and data within this program will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDeleteProgram();
                setShowDeleteDialog(false);
                onOpenChange(false);
              }}
            >
              Delete Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}