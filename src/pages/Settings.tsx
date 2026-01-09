import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Users, FolderKanban, Briefcase, Layers } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgPermissions } from '@/components/settings/OrgPermissions';
import { PortfolioPermissions } from '@/components/settings/PortfolioPermissions';
import { ProgramPermissions } from '@/components/settings/ProgramPermissions';
import { ProjectPermissions } from '@/components/settings/ProjectPermissions';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { RoleSwitcher } from '@/components/permissions/RoleSwitcher';
import { PermissionGate } from '@/components/permissions/PermissionGate';

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

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

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
            </PermissionGate>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <TabsTrigger value="program-permissions" className="gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Program Roles</span>
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <TabsTrigger value="project-permissions" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                <span className="hidden sm:inline">Project Roles</span>
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
          <TabsContent value="notifications" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          {/* Organization Permissions Tab */}
          <TabsContent value="org-permissions" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <OrgPermissions />
            </motion.div>
          </TabsContent>

          {/* Portfolio Permissions Tab */}
          <TabsContent value="portfolio-permissions" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <PortfolioPermissions />
            </motion.div>
          </TabsContent>

          {/* Program Permissions Tab */}
          <TabsContent value="program-permissions" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <ProgramPermissions />
            </motion.div>
          </TabsContent>

          {/* Project Permissions Tab */}
          <TabsContent value="project-permissions" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <ProjectPermissions />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
