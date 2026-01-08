import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Users, FolderKanban, Briefcase, Layers, Mail, CheckSquare, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleSwitcher } from '@/components/permissions/RoleSwitcher';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  orgPermissions,
  portfolioPermissions,
  programPermissions,
  defaultOrgRolePermissions,
  defaultPortfolioRolePermissions,
  defaultProgramRolePermissions,
  type OrgRole,
  type PortfolioRole,
  type ProgramRole,
} from '@/types/permissions';

const otherSettingsSections = [
  {
    icon: Shield,
    title: 'Security',
    description: 'Password and authentication settings',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Customize the look and feel',
  },
  {
    icon: Globe,
    title: 'Language & Region',
    description: 'Set your preferred language and timezone',
  },
];

const notificationTypes = [
  { id: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you' },
  { id: 'task_completed', label: 'Task Completed', description: 'When a task you created is completed' },
  { id: 'task_comment', label: 'Task Comments', description: 'When someone comments on your tasks' },
  { id: 'project_update', label: 'Project Updates', description: 'Important project status changes' },
  { id: 'deadline_approaching', label: 'Deadline Reminders', description: 'Upcoming task and project deadlines' },
  { id: 'team_changes', label: 'Team Changes', description: 'When team members are added or removed' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderTiming, setReminderTiming] = useState('1day');
  const [enabledNotifications, setEnabledNotifications] = useState<string[]>(
    notificationTypes.map((n) => n.id)
  );

  // Role permissions state
  const [selectedOrgRole, setSelectedOrgRole] = useState<OrgRole>('admin');
  const [selectedPortfolioRole, setSelectedPortfolioRole] = useState<PortfolioRole>('portfolio-manager');
  const [selectedProgramRole, setSelectedProgramRole] = useState<ProgramRole>('program-manager');
  const [orgRolePermissions, setOrgRolePermissions] = useState(defaultOrgRolePermissions);
  const [portfolioRolePermissions, setPortfolioRolePermissions] = useState(defaultPortfolioRolePermissions);
  const [programRolePermissions, setProgramRolePermissions] = useState(defaultProgramRolePermissions);

  const toggleNotificationType = (id: string) => {
    setEnabledNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const toggleOrgPermission = (permission: string) => {
    setOrgRolePermissions((prev) => ({
      ...prev,
      [selectedOrgRole]: prev[selectedOrgRole].includes(permission)
        ? prev[selectedOrgRole].filter((p) => p !== permission)
        : [...prev[selectedOrgRole], permission],
    }));
  };

  const togglePortfolioPermission = (permission: string) => {
    setPortfolioRolePermissions((prev) => ({
      ...prev,
      [selectedPortfolioRole]: prev[selectedPortfolioRole].includes(permission)
        ? prev[selectedPortfolioRole].filter((p) => p !== permission)
        : [...prev[selectedPortfolioRole], permission],
    }));
  };

  const toggleProgramPermission = (permission: string) => {
    setProgramRolePermissions((prev) => ({
      ...prev,
      [selectedProgramRole]: prev[selectedProgramRole].includes(permission)
        ? prev[selectedProgramRole].filter((p) => p !== permission)
        : [...prev[selectedProgramRole], permission],
    }));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
        </motion.div>

        {/* Role Switcher for Testing */}
        <RoleSwitcher />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <PermissionGate allowedOrgRoles={['owner', 'admin']}>
              <TabsTrigger value="org-permissions" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Org Roles</span>
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <TabsTrigger value="portfolio-permissions" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Portfolio Roles</span>
              </TabsTrigger>
              <TabsTrigger value="program-permissions" className="gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Program Roles</span>
              </TabsTrigger>
            </PermissionGate>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your personal information</p>

              <div className="mt-6 flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground">
                  JD
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input defaultValue="John" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name</label>
                  <Input defaultValue="Doe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <Input defaultValue="john.doe@company.com" type="email" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </motion.div>

            {/* Other Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {otherSettingsSections.map((section, index) => (
                <div
                  key={index}
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <section.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{section.title}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Notification Channels</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you receive notifications</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Notification Types</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select which notifications you want to receive</p>

              <div className="mt-6 space-y-3">
                {notificationTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-4"
                  >
                    <Checkbox
                      id={type.id}
                      checked={enabledNotifications.includes(type.id)}
                      onCheckedChange={() => toggleNotificationType(type.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={type.id} className="font-medium text-foreground cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Reminder Timing</h2>
              <p className="mt-1 text-sm text-muted-foreground">When to send deadline reminders</p>

              <div className="mt-6 flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Select value={reminderTiming} onValueChange={setReminderTiming}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1hour">1 hour before</SelectItem>
                    <SelectItem value="3hours">3 hours before</SelectItem>
                    <SelectItem value="1day">1 day before</SelectItem>
                    <SelectItem value="2days">2 days before</SelectItem>
                    <SelectItem value="1week">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </TabsContent>

          {/* Organization Permissions Tab */}
          <TabsContent value="org-permissions" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Organization Roles</h2>
              <p className="mt-1 text-sm text-muted-foreground">Configure permissions for each organization role</p>

              <div className="mt-6">
                <Label>Select Role to Configure</Label>
                <Select value={selectedOrgRole} onValueChange={(v) => setSelectedOrgRole(v as OrgRole)}>
                  <SelectTrigger className="mt-2 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-3">
                {orgPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-4"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={orgRolePermissions[selectedOrgRole].includes(permission.key)}
                      onCheckedChange={() => toggleOrgPermission(permission.key)}
                      disabled={selectedOrgRole === 'owner'}
                    />
                    <div className="flex-1">
                      <Label htmlFor={permission.id} className="font-medium text-foreground cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Portfolio Permissions Tab */}
          <TabsContent value="portfolio-permissions" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Portfolio Roles</h2>
              <p className="mt-1 text-sm text-muted-foreground">Configure permissions for each portfolio role</p>

              <div className="mt-6">
                <Label>Select Role to Configure</Label>
                <Select value={selectedPortfolioRole} onValueChange={(v) => setSelectedPortfolioRole(v as PortfolioRole)}>
                  <SelectTrigger className="mt-2 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio-manager">Portfolio Manager</SelectItem>
                    <SelectItem value="program-lead">Program Lead</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-3">
                {portfolioPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-4"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={portfolioRolePermissions[selectedPortfolioRole].includes(permission.key)}
                      onCheckedChange={() => togglePortfolioPermission(permission.key)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={permission.id} className="font-medium text-foreground cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Program Permissions Tab */}
          <TabsContent value="program-permissions" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-card-foreground">Program Roles</h2>
              <p className="mt-1 text-sm text-muted-foreground">Configure permissions for each program role</p>

              <div className="mt-6">
                <Label>Select Role to Configure</Label>
                <Select value={selectedProgramRole} onValueChange={(v) => setSelectedProgramRole(v as ProgramRole)}>
                  <SelectTrigger className="mt-2 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="program-manager">Program Manager</SelectItem>
                    <SelectItem value="project-lead">Project Lead</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-3">
                {programPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-4"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={programRolePermissions[selectedProgramRole].includes(permission.key)}
                      onCheckedChange={() => toggleProgramPermission(permission.key)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={permission.id} className="font-medium text-foreground cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
