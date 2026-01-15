import { useEffect, useState } from 'react';
import { 
  Settings,
  Users,
  Save,
  Bell,
  FolderArchive,
  AlertTriangle,
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
import { 
  programPermissions, 
  defaultProgramRolePermissions,
  type ProgramRole 
} from '@/types/permissions';
import { Program, TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { programStatusMeta, defaultProjectStatuses } from '@/lib/workflow';

interface ProgramSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program;
  teamMembers: TeamMember[];
  onUpdateProgram: (updates: Partial<Program>) => void;
  onArchiveProgram: () => void;
  onDeleteProgram: () => void;
}

export function ProgramSettingsSheet({ 
  open,
  onOpenChange,
  program, 
  teamMembers, 
  onUpdateProgram,
  onArchiveProgram,
  onDeleteProgram 
}: ProgramSettingsSheetProps) {
  const { toast } = useToast();

  // General settings state
  const [programName, setProgramName] = useState(program.name);
  const [programDescription, setProgramDescription] = useState(program.description);
  const [programStatus, setProgramStatus] = useState(program.status);
  const [ownerId, setOwnerId] = useState(program.ownerId || '');

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
  }, [open, program.id, program.name, program.description, program.status, program.ownerId]);

  // Permission toggle
  const toggleProgramPermission = (permission: string) => {
    setProgramRolePermissions((prev) => ({
      ...prev,
      [selectedProgramRole]: prev[selectedProgramRole].includes(permission)
        ? prev[selectedProgramRole].filter((p) => p !== permission)
        : [...prev[selectedProgramRole], permission],
    }));
  };

  // Save handler
  const handleSaveSettings = () => {
    onUpdateProgram({
      name: programName,
      description: programDescription,
      status: programStatus,
      ownerId: ownerId || undefined,
    });

    toast({ title: 'Settings saved', description: 'Program settings have been updated.' });
    onOpenChange(false);
  };

  const statusOptions = ['planning', 'active', 'on-hold', 'completed'] as const;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Program Settings</SheetTitle>
            <SheetDescription>
              Manage program configuration, team access, and notifications
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-1 text-xs px-2">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">General</span>
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
                      {statusOptions.map((id) => {
                        const meta = programStatusMeta(id);
                        return (
                          <SelectItem key={id} value={id}>
                            {meta.label}
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
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
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

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{program.name}"? This will hide the program and all its projects from view. You can restore it later from the archives.
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{program.name}"? This action cannot be undone. All projects, tasks, and associated data will be permanently removed.
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
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
