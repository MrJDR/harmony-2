import { useEffect, useMemo, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings,
  CircleDot,
  Users,
  Save,
  Bell,
  FolderArchive,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { 
  projectPermissions, 
  defaultProjectRolePermissions,
  type ProjectRole 
} from '@/types/permissions';
import { Project, ProjectStatus, TaskStatus, TaskPriority, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface ProjectSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  teamMembers: TeamMember[];
  onUpdateProject: (updates: Partial<Project>) => void;
  onArchiveProject: () => void;
  onDeleteProject: () => void;
}

// Defaults now live in src/lib/workflow so they remain consistent across UI
import {
  defaultProjectStatuses,
  defaultTaskStatuses,
  defaultTaskPriorities,
  workflowDotClass,
} from '@/lib/workflow';

const colorOptions: Array<{ value: TaskStatus['color']; label: string; className: string }> = [
  { value: 'muted', label: 'Gray', className: 'bg-muted-foreground' },
  { value: 'info', label: 'Blue', className: 'bg-info' },
  { value: 'success', label: 'Green', className: 'bg-success' },
  { value: 'warning', label: 'Yellow', className: 'bg-warning' },
  { value: 'destructive', label: 'Red', className: 'bg-destructive' },
];

export function ProjectSettingsSheet({ 
  open,
  onOpenChange,
  project, 
  teamMembers, 
  onUpdateProject,
  onArchiveProject,
  onDeleteProject 
}: ProjectSettingsSheetProps) {
  const { toast } = useToast();

  // General settings state
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);

  // NOTE: Project.status in DB is still one of the canonical IDs.
  // We'll show the canonical IDs here, but the *labels/colors* come from the workflow configuration.
  const [projectStatus, setProjectStatus] = useState(project.status);

  const [startDate, setStartDate] = useState<Date | undefined>(
    project.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project.endDate ? new Date(project.endDate) : undefined
  );

  const canonicalProjectStatusOptions = useMemo(
    () => ['planning', 'active', 'on-hold', 'completed'] as const,
    []
  );

  // Workflow state
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>(
    project.customStatuses || defaultProjectStatuses
  );
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(
    project.customTaskStatuses || defaultTaskStatuses
  );
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>(
    project.customTaskPriorities || defaultTaskPriorities
  );
  const [newProjectStatusLabel, setNewProjectStatusLabel] = useState('');
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newPriorityLabel, setNewPriorityLabel] = useState('');

  // Role permissions state (local for now, not persisted)
  const [selectedProjectRole, setSelectedProjectRole] = useState<ProjectRole>('contributor');
  const [projectRolePermissions, setProjectRolePermissions] = useState<Record<ProjectRole, string[]>>(
    () => JSON.parse(JSON.stringify(defaultProjectRolePermissions))
  );
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});

  // Notifications state
  const [notifications, setNotifications] = useState({
    taskCreated: true,
    taskAssigned: true,
    taskCompleted: true,
    dueDateReminder: true,
    commentAdded: true,
  });

  // Dialogs
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Keep all sheet state in sync when opening or when the project changes
  useEffect(() => {
    if (!open) return;

    setProjectName(project.name);
    setProjectDescription(project.description);
    setProjectStatus(project.status);
    setStartDate(project.startDate ? new Date(project.startDate) : undefined);
    setEndDate(project.endDate ? new Date(project.endDate) : undefined);

    setProjectStatuses(project.customStatuses || defaultProjectStatuses);
    setTaskStatuses(project.customTaskStatuses || defaultTaskStatuses);
    setTaskPriorities(project.customTaskPriorities || defaultTaskPriorities);

    // Reset transient inputs
    setNewProjectStatusLabel('');
    setNewStatusLabel('');
    setNewPriorityLabel('');
  }, [open, project.id, project.name, project.description, project.status, project.startDate, project.endDate, project.customStatuses, project.customTaskStatuses, project.customTaskPriorities]);

  // Permission toggle
  const toggleProjectPermission = (permission: string) => {
    setProjectRolePermissions((prev) => ({
      ...prev,
      [selectedProjectRole]: prev[selectedProjectRole].includes(permission)
        ? prev[selectedProjectRole].filter((p) => p !== permission)
        : [...prev[selectedProjectRole], permission],
    }));
  };

  // Note: Role permissions + member roles are not persisted yet (requires tables/policies).
  // We keep the UI here but avoid claiming it's saved.

  // Project Status handlers
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

  // Task Status handlers
  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const newStatus: TaskStatus = {
      id: newStatusLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newStatusLabel,
      color: 'muted',
    };
    setTaskStatuses((prev) => [...prev, newStatus]);
    setNewStatusLabel('');
  };

  const handleRemoveStatus = (id: string) => {
    if (['todo', 'in-progress', 'review', 'done'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default statuses cannot be removed.', variant: 'destructive' });
      return;
    }
    setTaskStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateStatusColor = (id: string, color: TaskStatus['color']) => {
    setTaskStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  };

  // Priority handlers
  const handleAddPriority = () => {
    if (!newPriorityLabel.trim()) return;
    const newPriority: TaskPriority = {
      id: newPriorityLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newPriorityLabel,
      color: 'muted',
    };
    setTaskPriorities((prev) => [...prev, newPriority]);
    setNewPriorityLabel('');
  };

  const handleRemovePriority = (id: string) => {
    if (['low', 'medium', 'high'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default priorities cannot be removed.', variant: 'destructive' });
      return;
    }
    setTaskPriorities((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePriorityColor = (id: string, color: TaskPriority['color']) => {
    setTaskPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
  };

  // Save handler
  const handleSaveSettings = () => {
    onUpdateProject({
      name: projectName,
      description: projectDescription,
      status: projectStatus,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : project.startDate,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : project.endDate,
      customStatuses: projectStatuses,
      customTaskStatuses: taskStatuses,
      customTaskPriorities: taskPriorities,
    });

    toast({ title: 'Settings saved', description: 'Project settings have been updated.' });
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Project Settings</SheetTitle>
            <SheetDescription>
              Manage project configuration, workflow, and team access
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1 text-xs px-2">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">General</span>
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
                <h3 className="font-semibold text-foreground">Project Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input 
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-status">Status</Label>
                  <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as Project['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {canonicalProjectStatusOptions.map((id) => {
                        const meta = projectStatuses.find((s) => s.id === id);
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
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea 
                    id="project-description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'MM/dd/yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'MM/dd/yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Workflow Tab */}
              <TabsContent value="workflow" className="space-y-6 mt-6">
                {/* Project Statuses */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Project Statuses</h3>
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
                          <SelectContent>
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
                          disabled={canonicalProjectStatusOptions.includes(status.id as any)}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddProjectStatus()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddProjectStatus} disabled={!newProjectStatusLabel.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Task Statuses */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Task Statuses</h3>
                  <div className="space-y-3">
                    {taskStatuses.map((status) => (
                      <div
                        key={status.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className={cn('w-3 h-3 rounded-full', workflowDotClass(status.color))} />
                        <Input
                          value={status.label}
                          onChange={(e) => {
                            setTaskStatuses((prev) =>
                              prev.map((s) => (s.id === status.id ? { ...s, label: e.target.value } : s))
                            );
                          }}
                          className="flex-1 h-8"
                        />
                        <Select
                          value={status.color}
                          onValueChange={(v) => handleUpdateStatusColor(status.id, v as TaskStatus['color'])}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                          onClick={() => handleRemoveStatus(status.id)}
                          disabled={['todo', 'in-progress', 'review', 'done'].includes(status.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="New task status name..."
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddStatus} disabled={!newStatusLabel.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Task Priorities */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Task Priorities</h3>
                  <div className="space-y-3">
                    {taskPriorities.map((priority) => (
                      <div
                        key={priority.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className={cn('w-3 h-3 rounded-full', workflowDotClass(priority.color))} />
                        <Input
                          value={priority.label}
                          onChange={(e) => {
                            setTaskPriorities((prev) =>
                              prev.map((p) => (p.id === priority.id ? { ...p, label: e.target.value } : p))
                            );
                          }}
                          className="flex-1 h-8"
                        />
                        <Select
                          value={priority.color}
                          onValueChange={(v) => handleUpdatePriorityColor(priority.id, v as TaskPriority['color'])}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                          onClick={() => handleRemovePriority(priority.id)}
                          disabled={['low', 'medium', 'high'].includes(priority.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="New priority name..."
                      value={newPriorityLabel}
                      onChange={(e) => setNewPriorityLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddPriority} disabled={!newPriorityLabel.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <PermissionGate allowedOrgRoles={['owner', 'admin']}>
                <div className="space-y-4">
                  <h3 className="font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">Archive Project</p>
                        <p className="text-xs text-muted-foreground">Hide from views, can restore later</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowArchiveDialog(true)}>
                        <FolderArchive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">Delete Project</p>
                        <p className="text-xs text-muted-foreground">Cannot be undone</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </PermissionGate>

              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-6 mt-6">
              {/* Project Statuses */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Project Statuses</h3>
                <p className="text-sm text-muted-foreground">
                  Customize project lifecycle stages
                </p>

                <div className="space-y-2">
                  {projectStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 bg-background"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        status.color === 'muted' && 'bg-muted-foreground',
                        status.color === 'info' && 'bg-info',
                        status.color === 'success' && 'bg-success',
                        status.color === 'warning' && 'bg-warning',
                        status.color === 'destructive' && 'bg-destructive',
                      )} />
                      <Input 
                        value={status.label} 
                        onChange={(e) => {
                          setProjectStatuses(prev => prev.map(s => 
                            s.id === status.id ? { ...s, label: e.target.value } : s
                          ));
                        }}
                        className="flex-1 h-8"
                      />
                      <Select 
                        value={status.color} 
                        onValueChange={(v) => handleUpdateProjectStatusColor(status.id, v as ProjectStatus['color'])}
                      >
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", opt.className)} />
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
                        disabled={['planning', 'active', 'completed'].includes(status.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="New project status..." 
                    value={newProjectStatusLabel}
                    onChange={(e) => setNewProjectStatusLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProjectStatus()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddProjectStatus} disabled={!newProjectStatusLabel.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Task Statuses */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Task Statuses</h3>
                <p className="text-sm text-muted-foreground">
                  Customize workflow columns for your project
                </p>

                <div className="space-y-2">
                  {taskStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 bg-background"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        status.color === 'muted' && 'bg-muted-foreground',
                        status.color === 'info' && 'bg-info',
                        status.color === 'success' && 'bg-success',
                        status.color === 'warning' && 'bg-warning',
                        status.color === 'destructive' && 'bg-destructive',
                      )} />
                      <Input 
                        value={status.label} 
                        onChange={(e) => {
                          setTaskStatuses(prev => prev.map(s => 
                            s.id === status.id ? { ...s, label: e.target.value } : s
                          ));
                        }}
                        className="flex-1 h-8"
                      />
                      <Select 
                        value={status.color} 
                        onValueChange={(v) => handleUpdateStatusColor(status.id, v as TaskStatus['color'])}
                      >
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", opt.className)} />
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
                        onClick={() => handleRemoveStatus(status.id)}
                        disabled={['todo', 'done'].includes(status.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="New status name..." 
                    value={newStatusLabel}
                    onChange={(e) => setNewStatusLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddStatus} disabled={!newStatusLabel.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Task Priorities */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Task Priorities</h3>
                <p className="text-sm text-muted-foreground">
                  Define priority levels for task urgency
                </p>

                <div className="space-y-2">
                  {taskPriorities.map((priority) => (
                    <div
                      key={priority.id}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 bg-background"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        priority.color === 'muted' && 'bg-muted-foreground',
                        priority.color === 'info' && 'bg-info',
                        priority.color === 'success' && 'bg-success',
                        priority.color === 'warning' && 'bg-warning',
                        priority.color === 'destructive' && 'bg-destructive',
                      )} />
                      <Input 
                        value={priority.label} 
                        onChange={(e) => {
                          setTaskPriorities(prev => prev.map(p => 
                            p.id === priority.id ? { ...p, label: e.target.value } : p
                          ));
                        }}
                        className="flex-1 h-8"
                      />
                      <Select 
                        value={priority.color} 
                        onValueChange={(v) => handleUpdatePriorityColor(priority.id, v as TaskPriority['color'])}
                      >
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", opt.className)} />
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
                        onClick={() => handleRemovePriority(priority.id)}
                        disabled={['low', 'medium', 'high'].includes(priority.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="New priority name..." 
                    value={newPriorityLabel}
                    onChange={(e) => setNewPriorityLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddPriority} disabled={!newPriorityLabel.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
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
                  <Select value={selectedProjectRole} onValueChange={(v) => setSelectedProjectRole(v as ProjectRole)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="project-manager">Project Manager</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {projectPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Checkbox
                        id={`proj-${permission.id}`}
                        checked={projectRolePermissions[selectedProjectRole].includes(permission.key)}
                        onCheckedChange={() => toggleProjectPermission(permission.key)}
                        disabled={selectedProjectRole === 'project-manager'}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`proj-${permission.id}`} className="font-medium text-foreground cursor-pointer text-sm">
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
                  {teamMembers.map((member) => (
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
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Select 
                        value={memberRoles[member.id] || 'contributor'} 
                        onValueChange={(v) => setMemberRoles(prev => ({ ...prev, [member.id]: v }))}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="project-manager">Project Manager</SelectItem>
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

              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which events trigger email notifications
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">Task Created</Label>
                      <p className="text-xs text-muted-foreground">Notify when a new task is created</p>
                    </div>
                    <Switch 
                      checked={notifications.taskCreated} 
                      onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskCreated: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">Task Assigned</Label>
                      <p className="text-xs text-muted-foreground">Notify when a task is assigned to you</p>
                    </div>
                    <Switch 
                      checked={notifications.taskAssigned} 
                      onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskAssigned: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">Task Completed</Label>
                      <p className="text-xs text-muted-foreground">Notify when a task is marked as done</p>
                    </div>
                    <Switch 
                      checked={notifications.taskCompleted} 
                      onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskCompleted: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">Due Date Reminder</Label>
                      <p className="text-xs text-muted-foreground">Remind before task due dates</p>
                    </div>
                    <Switch 
                      checked={notifications.dueDateReminder} 
                      onCheckedChange={(v) => setNotifications(prev => ({ ...prev, dueDateReminder: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">Comments</Label>
                      <p className="text-xs text-muted-foreground">Notify when someone comments</p>
                    </div>
                    <Switch 
                      checked={notifications.commentAdded} 
                      onCheckedChange={(v) => setNotifications(prev => ({ ...prev, commentAdded: v }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
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
            <AlertDialogTitle>Archive Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{project.name}"? The project will be hidden from all views but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onArchiveProject(); setShowArchiveDialog(false); onOpenChange(false); }}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{project.name}"? This will remove all tasks, files, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { onDeleteProject(); setShowDeleteDialog(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}