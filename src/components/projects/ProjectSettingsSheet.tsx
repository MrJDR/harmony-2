import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings,
  CircleDot,
  Users,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { Project, TaskStatus, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface ProjectSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  teamMembers: TeamMember[];
  onUpdateProject: (updates: Partial<Project>) => void;
  onDeleteProject: () => void;
}

const defaultTaskStatuses: TaskStatus[] = [
  { id: 'todo', label: 'To Do', color: 'muted' },
  { id: 'in-progress', label: 'In Progress', color: 'info' },
  { id: 'review', label: 'Review', color: 'warning' },
  { id: 'done', label: 'Done', color: 'success' },
];

const colorOptions: Array<{ value: TaskStatus['color']; label: string; className: string }> = [
  { value: 'muted', label: 'Gray', className: 'bg-muted' },
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
  onDeleteProject 
}: ProjectSettingsSheetProps) {
  const { toast } = useToast();

  // General settings state
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);
  const [projectStatus, setProjectStatus] = useState(project.status);
  const [startDate, setStartDate] = useState<Date | undefined>(
    project.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project.endDate ? new Date(project.endDate) : undefined
  );
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  // Statuses state
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(
    project.customTaskStatuses || defaultTaskStatuses
  );
  const [newStatusLabel, setNewStatusLabel] = useState('');

  // Roles state
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(teamMembers.map(m => [m.id, 'contributor']))
  );

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Status handlers
  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const newStatus: TaskStatus = {
      id: newStatusLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newStatusLabel,
      color: 'muted',
    };
    setTaskStatuses(prev => [...prev, newStatus]);
    setNewStatusLabel('');
  };

  const handleRemoveStatus = (id: string) => {
    if (['todo', 'done'].includes(id)) {
      toast({ title: 'Cannot remove', description: 'Default statuses cannot be removed.', variant: 'destructive' });
      return;
    }
    setTaskStatuses(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateStatusColor = (id: string, color: TaskStatus['color']) => {
    setTaskStatuses(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  };

  // Save handler
  const handleSaveSettings = () => {
    onUpdateProject({
      name: projectName,
      description: projectDescription,
      status: projectStatus,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : project.startDate,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : project.endDate,
      customTaskStatuses: taskStatuses,
    });
    toast({ title: 'Settings saved', description: 'Project settings have been updated.' });
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Project Settings</SheetTitle>
            <SheetDescription>
              Manage project configuration, statuses, and team roles
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="statuses" className="gap-2">
                <CircleDot className="h-4 w-4" />
                Statuses
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Users className="h-4 w-4" />
                Roles
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">General</h3>
                
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
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
                      <PopoverContent className="w-auto p-0" align="start">
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
                      <PopoverContent className="w-auto p-0" align="start">
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

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified on task updates</p>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Weekly summary emails</p>
                  </div>
                  <Switch 
                    checked={emailUpdates} 
                    onCheckedChange={setEmailUpdates}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Delete Project</p>
                    <p className="text-sm text-muted-foreground">This cannot be undone</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Statuses Tab */}
            <TabsContent value="statuses" className="space-y-6 mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Customize workflow columns for your project's task board
                </p>

                <div className="space-y-3">
                  {taskStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background"
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
                        <SelectTrigger className="w-[90px] h-8">
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

                <div className="flex gap-2">
                  <Input 
                    placeholder="New status name..." 
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

              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-6 mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Assign roles to team members in this project
                </p>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
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
                        <SelectTrigger className="w-[130px] h-8">
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
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

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
