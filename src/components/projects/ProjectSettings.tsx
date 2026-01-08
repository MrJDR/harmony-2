import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Bell, 
  Tag, 
  FolderArchive,
  Settings as SettingsIcon,
  Workflow,
  Users,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { 
  projectPermissions, 
  defaultProjectRolePermissions,
  type ProjectRole 
} from '@/types/permissions';
import { Project, TaskStatus, TaskPriority, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface ProjectSettingsProps {
  project: Project;
  teamMembers: TeamMember[];
  onUpdateProject: (updates: Partial<Project>) => void;
  onArchiveProject: () => void;
  onDeleteProject: () => void;
}

const defaultTaskStatuses: TaskStatus[] = [
  { id: 'todo', label: 'To Do', color: 'muted' },
  { id: 'in-progress', label: 'In Progress', color: 'info' },
  { id: 'review', label: 'Review', color: 'warning' },
  { id: 'done', label: 'Done', color: 'success' },
];

const defaultTaskPriorities: TaskPriority[] = [
  { id: 'low', label: 'Low', color: 'muted' },
  { id: 'medium', label: 'Medium', color: 'warning' },
  { id: 'high', label: 'High', color: 'destructive' },
];

const colorOptions: Array<{ value: TaskStatus['color']; label: string; className: string }> = [
  { value: 'muted', label: 'Gray', className: 'bg-muted' },
  { value: 'info', label: 'Blue', className: 'bg-info' },
  { value: 'success', label: 'Green', className: 'bg-success' },
  { value: 'warning', label: 'Yellow', className: 'bg-warning' },
  { value: 'destructive', label: 'Red', className: 'bg-destructive' },
];

export function ProjectSettings({ 
  project, 
  teamMembers, 
  onUpdateProject, 
  onArchiveProject,
  onDeleteProject 
}: ProjectSettingsProps) {
  const { toast } = useToast();

  // Workflow state
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(
    project.customTaskStatuses || defaultTaskStatuses
  );
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>(
    project.customTaskPriorities || defaultTaskPriorities
  );
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newPriorityLabel, setNewPriorityLabel] = useState('');

  // Access & Roles state
  const [selectedProjectRole, setSelectedProjectRole] = useState<ProjectRole>('project-manager');
  const [projectRolePermissions, setProjectRolePermissions] = useState(defaultProjectRolePermissions);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(teamMembers.map(m => [m.id, 'contributor']))
  );

  // Other settings state
  const [notifications, setNotifications] = useState({
    taskCreated: true,
    taskAssigned: true,
    taskCompleted: true,
    dueDateReminder: true,
    commentAdded: true,
  });
  const [labels, setLabels] = useState<string[]>(['bug', 'feature', 'urgent', 'documentation']);
  const [newLabel, setNewLabel] = useState('');
  
  // Dialogs
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleProjectPermission = (permission: string) => {
    setProjectRolePermissions((prev) => ({
      ...prev,
      [selectedProjectRole]: prev[selectedProjectRole].includes(permission)
        ? prev[selectedProjectRole].filter((p) => p !== permission)
        : [...prev[selectedProjectRole], permission],
    }));
  };

  // Workflow handlers
  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const newStatus: TaskStatus = {
      id: newStatusLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newStatusLabel,
      color: 'muted',
    };
    setTaskStatuses(prev => [...prev, newStatus]);
    setNewStatusLabel('');
    toast({ title: 'Status added', description: `"${newStatusLabel}" status has been created.` });
  };

  const handleRemoveStatus = (id: string) => {
    if (['todo', 'done'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default statuses cannot be removed.', variant: 'destructive' });
      return;
    }
    setTaskStatuses(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Status removed' });
  };

  const handleUpdateStatusColor = (id: string, color: TaskStatus['color']) => {
    setTaskStatuses(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  };

  const handleAddPriority = () => {
    if (!newPriorityLabel.trim()) return;
    const newPriority: TaskPriority = {
      id: newPriorityLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newPriorityLabel,
      color: 'muted',
    };
    setTaskPriorities(prev => [...prev, newPriority]);
    setNewPriorityLabel('');
    toast({ title: 'Priority added', description: `"${newPriorityLabel}" priority has been created.` });
  };

  const handleRemovePriority = (id: string) => {
    if (['low', 'medium', 'high'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default priorities cannot be removed.', variant: 'destructive' });
      return;
    }
    setTaskPriorities(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Priority removed' });
  };

  const handleUpdatePriorityColor = (id: string, color: TaskPriority['color']) => {
    setTaskPriorities(prev => prev.map(p => p.id === id ? { ...p, color } : p));
  };

  // Label handlers
  const handleAddLabel = () => {
    if (!newLabel.trim() || labels.includes(newLabel.toLowerCase())) return;
    setLabels(prev => [...prev, newLabel.toLowerCase()]);
    setNewLabel('');
    toast({ title: 'Label added' });
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(prev => prev.filter(l => l !== label));
  };

  // Save handlers
  const handleSaveWorkflow = () => {
    onUpdateProject({
      customTaskStatuses: taskStatuses,
      customTaskPriorities: taskPriorities,
    });
    toast({ title: 'Workflow saved', description: 'Task statuses and priorities have been updated.' });
  };

  const handleSavePermissions = () => {
    toast({ title: 'Permissions saved', description: 'Project role permissions have been updated.' });
  };

  const handleSaveNotifications = () => {
    toast({ title: 'Notifications saved', description: 'Notification preferences have been updated.' });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="workflow" className="gap-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
        </TabsList>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">Task Statuses</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Customize the workflow columns for your project's task board
            </p>

            <div className="mt-6 space-y-3">
              {taskStatuses.map((status, index) => (
                <div
                  key={status.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className={cn("w-3 h-3 rounded-full", `bg-${status.color}`)} />
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
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

            <div className="mt-4 flex gap-2">
              <Input 
                placeholder="New status name..." 
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                className="flex-1"
              />
              <Button onClick={handleAddStatus} disabled={!newStatusLabel.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">Task Priorities</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Define priority levels for categorizing task urgency
            </p>

            <div className="mt-6 space-y-3">
              {taskPriorities.map((priority) => (
                <div
                  key={priority.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background/50"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className={cn("w-3 h-3 rounded-full", `bg-${priority.color}`)} />
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
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

            <div className="mt-4 flex gap-2">
              <Input 
                placeholder="New priority name..." 
                value={newPriorityLabel}
                onChange={(e) => setNewPriorityLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                className="flex-1"
              />
              <Button onClick={handleAddPriority} disabled={!newPriorityLabel.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Priority
              </Button>
            </div>
          </motion.div>

          <div className="flex justify-end">
            <Button onClick={handleSaveWorkflow}>Save Workflow Settings</Button>
          </div>
        </TabsContent>

        {/* Access & Roles Tab */}
        <TabsContent value="access" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">Role Permissions</h3>
            <p className="mt-1 text-sm text-muted-foreground">Configure what each role can do in this project</p>

            <div className="mt-6">
              <Label>Select Role to Configure</Label>
              <Select value={selectedProjectRole} onValueChange={(v) => setSelectedProjectRole(v as ProjectRole)}>
                <SelectTrigger className="mt-2 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project-manager">Project Manager</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-3">
              {projectPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-4"
                >
                  <Checkbox
                    id={`proj-${permission.id}`}
                    checked={projectRolePermissions[selectedProjectRole].includes(permission.key)}
                    onCheckedChange={() => toggleProjectPermission(permission.key)}
                    disabled={selectedProjectRole === 'project-manager'}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`proj-${permission.id}`} className="font-medium text-foreground cursor-pointer">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">Team Member Roles</h3>
            <p className="mt-1 text-sm text-muted-foreground">Assign roles to team members in this project</p>

            <div className="mt-6 space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Select 
                    value={memberRoles[member.id] || 'contributor'} 
                    onValueChange={(v) => setMemberRoles(prev => ({ ...prev, [member.id]: v }))}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">Email Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which events trigger email notifications for project members
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Task Created</Label>
                  <p className="text-sm text-muted-foreground">Notify when a new task is created</p>
                </div>
                <Switch 
                  checked={notifications.taskCreated} 
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskCreated: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Task Assigned</Label>
                  <p className="text-sm text-muted-foreground">Notify when a task is assigned to you</p>
                </div>
                <Switch 
                  checked={notifications.taskAssigned} 
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskAssigned: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Task Completed</Label>
                  <p className="text-sm text-muted-foreground">Notify when a task is marked as done</p>
                </div>
                <Switch 
                  checked={notifications.taskCompleted} 
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, taskCompleted: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Due Date Reminder</Label>
                  <p className="text-sm text-muted-foreground">Remind before task due dates</p>
                </div>
                <Switch 
                  checked={notifications.dueDateReminder} 
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, dueDateReminder: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Comments</Label>
                  <p className="text-sm text-muted-foreground">Notify when someone comments on your tasks</p>
                </div>
                <Switch 
                  checked={notifications.commentAdded} 
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, commentAdded: v }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Labels
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create labels to categorize and filter tasks
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {labels.map((label) => (
                <Badge 
                  key={label} 
                  variant="secondary" 
                  className="gap-1 pr-1"
                >
                  {label}
                  <button 
                    onClick={() => handleRemoveLabel(label)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Input 
                placeholder="New label..." 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="flex-1 max-w-xs"
              />
              <Button variant="outline" onClick={handleAddLabel} disabled={!newLabel.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Label
              </Button>
            </div>
          </motion.div>

          <PermissionGate allowedOrgRoles={['owner', 'admin']}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Danger Zone
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Irreversible actions for this project
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="font-medium text-foreground">Archive Project</p>
                    <p className="text-sm text-muted-foreground">
                      Hide this project from views. Can be restored later.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowArchiveDialog(true)}>
                    <FolderArchive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-background p-4">
                  <div>
                    <p className="font-medium text-foreground">Delete Project</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this project and all its data. This cannot be undone.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </PermissionGate>
        </TabsContent>
      </Tabs>

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
            <AlertDialogAction onClick={() => { onArchiveProject(); setShowArchiveDialog(false); }}>
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
    </div>
  );
}
